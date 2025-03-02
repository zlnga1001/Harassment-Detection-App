import React, { useRef, useEffect, useState, useCallback } from 'react';
import VideoControls from './VideoControls';

const VideoPlayer = ({ src, width, height, autoPlay, muted, loop, onClick, style }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [boxesData, setBoxesData] = useState(null);
    const [error, setError] = useState(null);
    const animationFrameRef = useRef(null);
    
    // Visualization controls
    const [showBoxes, setShowBoxes] = useState(true);
    const [showPaths, setShowPaths] = useState(true);
    const [showIds, setShowIds] = useState(true);
    const [showConfidence, setShowConfidence] = useState(true);

    const [boxHistory, setBoxHistory] = useState({});
    const [smoothedBoxes, setSmoothedBoxes] = useState({});

    // Number of frames to keep in history for smoothing
    const HISTORY_LENGTH = 15;
    // Weight for temporal smoothing (0-1), higher means more smoothing
    const SMOOTHING_FACTOR = 0.8;
    // Number of frames to show in motion trail
    const TRAIL_LENGTH = 30;
    // Minimum confidence threshold for detection
    const CONFIDENCE_THRESHOLD = 0.3;

    const smoothBoxes = useCallback((currentBoxes, trackId) => {
        if (!boxHistory[trackId]) {
            return currentBoxes;
        }

        const history = boxHistory[trackId];
        let smoothed = currentBoxes.map((coord, i) => {
            let sum = coord * (1 - SMOOTHING_FACTOR);
            let weightSum = 1 - SMOOTHING_FACTOR;
            
            history.forEach((entry, index) => {
                const weight = SMOOTHING_FACTOR * (1 - index / history.length);
                sum += entry[i] * weight;
                weightSum += weight;
            });
            
            return sum / weightSum;
        });

        return smoothed;
    }, [boxHistory]);

    const updateBoxHistory = useCallback((boxes, trackId) => {
        setBoxHistory(prev => {
            const history = prev[trackId] || [];
            const newHistory = [boxes, ...history].slice(0, HISTORY_LENGTH);
            return { ...prev, [trackId]: newHistory };
        });
    }, []);

    useEffect(() => {
        // Load the corresponding JSON file for bounding boxes
        const jsonSrc = src.replace('/videos/', '/').replace('.mp4', '_boxes.json');
        console.log('Loading JSON from:', jsonSrc);
        
        fetch(jsonSrc)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Loaded JSON data:', data);
                setBoxesData(data);
                setError(null);
            })
            .catch(error => {
                console.error('Error loading bounding box data:', error);
                setError(error.message);
            });

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [src]);

    const interpolateBoxes = useCallback((frame1Data, frame2Data, progress) => {
        if (!frame1Data?.boxes || !frame2Data?.boxes) return null;
        
        const boxes = [];
        const confidences = [];
        const track_ids = [];

        frame1Data.track_ids.forEach((id1, index1) => {
            const index2 = frame2Data.track_ids.indexOf(id1);
            if (index2 !== -1) {
                const box1 = frame1Data.boxes[index1];
                const box2 = frame2Data.boxes[index2];
                const conf1 = frame1Data.confidences[index1];
                const conf2 = frame2Data.confidences[index2];

                // Only include if confidence is above threshold
                if (conf1 > CONFIDENCE_THRESHOLD || conf2 > CONFIDENCE_THRESHOLD) {
                    // Enhanced smooth interpolation
                    const smoothProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
                    const box = box1.map((coord1, i) => {
                        const coord2 = box2[i];
                        return coord1 + (coord2 - coord1) * smoothProgress;
                    });

                    // Weighted confidence based on temporal distance
                    const confidence = conf1 + (conf2 - conf1) * smoothProgress;

                    boxes.push(box);
                    confidences.push(confidence);
                    track_ids.push(id1);
                }
            }
        });

        return {
            boxes,
            confidences,
            track_ids,
            is_keyframe: false
        };
    }, []);

    const getFrameData = useCallback((currentFrame) => {
        if (!boxesData) return null;

        // If we have data for the exact frame, use it
        if (boxesData.frames[currentFrame]) {
            const frameData = boxesData.frames[currentFrame];
            
            // Apply temporal smoothing to each box
            const smoothedData = {
                ...frameData,
                boxes: frameData.boxes.map((box, index) => {
                    const trackId = frameData.track_ids[index];
                    const smoothed = smoothBoxes(box, trackId);
                    updateBoxHistory(box, trackId);
                    return smoothed;
                })
            };
            
            return smoothedData;
        }

        // Find the nearest frames before and after
        const frameNumbers = Object.keys(boxesData.frames).map(Number);
        const prevFrame = Math.max(...frameNumbers.filter(f => f <= currentFrame));
        const nextFrame = Math.min(...frameNumbers.filter(f => f > currentFrame));

        if (isFinite(prevFrame) && isFinite(nextFrame)) {
            const progress = (currentFrame - prevFrame) / (nextFrame - prevFrame);
            const interpolated = interpolateBoxes(
                boxesData.frames[prevFrame],
                boxesData.frames[nextFrame],
                progress
            );

            if (interpolated) {
                // Apply temporal smoothing to interpolated boxes
                interpolated.boxes = interpolated.boxes.map((box, index) => {
                    const trackId = interpolated.track_ids[index];
                    return smoothBoxes(box, trackId);
                });
            }

            return interpolated;
        }

        return null;
    }, [boxesData, interpolateBoxes, smoothBoxes, updateBoxHistory]);

    const drawMotionTrail = useCallback((trackId, currentFrame, ctx, canvas) => {
        if (!boxesData?.tracks?.[trackId]) return;
        
        const trackData = boxesData.tracks[trackId];
        const recentPoints = trackData
            .filter(point => point.frame <= currentFrame && point.frame >= currentFrame - TRAIL_LENGTH)
            .map(point => ({
                center: point.center,
                frame: point.frame
            }));

        if (recentPoints.length < 2) return;

        const scaleX = canvas.width / boxesData.video_info.width;
        const scaleY = canvas.height / boxesData.video_info.height;

        // Draw gradient trail
        for (let i = 1; i < recentPoints.length; i++) {
            const [x1, y1] = recentPoints[i-1].center;
            const [x2, y2] = recentPoints[i].center;
            
            // Calculate opacity based on how recent the point is
            const opacity = 0.7 * (1 - (i / recentPoints.length));
            
            ctx.beginPath();
            ctx.moveTo(x1 * scaleX, y1 * scaleY);
            ctx.lineTo(x2 * scaleX, y2 * scaleY);
            
            // Create gradient for trail
            const gradient = ctx.createLinearGradient(
                x1 * scaleX, y1 * scaleY,
                x2 * scaleX, y2 * scaleY
            );
            gradient.addColorStop(0, `rgba(0, 255, 0, ${opacity})`);
            gradient.addColorStop(1, `rgba(0, 255, 0, ${opacity * 0.5})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }, [boxesData]);

    const drawMovementPath = useCallback((trackId, currentFrame, ctx, canvas) => {
        if (!boxesData?.tracks?.[trackId]) return;
        
        const trackData = boxesData.tracks[trackId];
        const recentPoints = trackData
            .filter(point => point.frame <= currentFrame && point.frame >= currentFrame - 30)
            .map(point => point.center);

        if (recentPoints.length < 2) return;

        const scaleX = canvas.width / boxesData.video_info.width;
        const scaleY = canvas.height / boxesData.video_info.height;

        ctx.beginPath();
        ctx.moveTo(recentPoints[0][0] * scaleX, recentPoints[0][1] * scaleY);
        
        for (let i = 1; i < recentPoints.length; i++) {
            const [x, y] = recentPoints[i];
            ctx.lineTo(x * scaleX, y * scaleY);
        }

        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [boxesData]);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) return;
        
        const ctx = canvas.getContext('2d');

        const drawBoxes = () => {
            if (!video || !boxesData || video.paused) return;
        
            const fps = boxesData.video_info.fps;
            const currentFrame = Math.floor(video.currentTime * fps);
            const frameData = getFrameData(currentFrame);
        
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        
            // Draw motion trails if enabled
            if (showPaths) {
                frameData.track_ids.forEach(trackId => {
                    drawMotionTrail(trackId, currentFrame, ctx, canvas);
                });
            }
        
            frameData.boxes.forEach((box, index) => {
                if (!showBoxes) return;
        
                const confidence = frameData.confidences[index];
                if (confidence < CONFIDENCE_THRESHOLD) return;
        
                const [x1, y1, x2, y2] = box;
                const trackId = frameData.track_ids[index];
        
                const scaleX = canvas.width / boxesData.video_info.width;
                const scaleY = canvas.height / boxesData.video_info.height;
        
                const scaledX1 = x1 * scaleX;
                const scaledY1 = y1 * scaleY;
                const scaledX2 = x2 * scaleX;
                const scaledY2 = y2 * scaleY;
        
                // Draw semi-transparent bounding box background with FIXED opacity
                ctx.fillStyle = `rgba(0, 255, 0, 0.3)`; // Fixed opacity
                ctx.fillRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
        
                // Reset shadow before drawing border
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
        
                // Draw a **consistent** border with fixed thickness
                ctx.strokeStyle = 'rgb(0, 255, 0)'; // Bright green
                ctx.lineWidth = 3; // Fixed thickness
                ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
        
                // Display confidence & ID labels
                if (showIds || showConfidence) {
                    ctx.fillStyle = 'rgb(0, 255, 0)';
                    ctx.font = '12px Arial';
                    let label = '';
                    if (showIds) label += `ID:${trackId}`;
                    if (showConfidence) label += ` ${(confidence * 100).toFixed(0)}%`;
        
                    ctx.fillText(label, scaledX1, scaledY1 - 5);
                }
            });
        
            animationFrameRef.current = requestAnimationFrame(drawBoxes);
        };
        

        const handlePlay = () => {
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
            drawBoxes();
        };

        const handleResize = () => {
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
        };

        video.addEventListener('play', handlePlay);
        window.addEventListener('resize', handleResize);

        // Initial setup
        handleResize();
        if (!video.paused) {
            drawBoxes();
        }

        return () => {
            video.removeEventListener('play', handlePlay);
            window.removeEventListener('resize', handleResize);
        };
    }, [boxesData, showBoxes, showPaths, showIds, showConfidence, getFrameData, drawMotionTrail]);

    return (
        <div style={{ position: 'relative', ...style }}>
            <video
                ref={videoRef}
                width={width}
                height={height}
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                onClick={onClick}
                style={{ width: '100%', height: '100%', ...style }}
            >
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            />
            {error && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: 'rgba(255, 0, 0, 0.7)',
                    color: 'white',
                    padding: '5px',
                    fontSize: '12px'
                }}>
                    Error: {error}
                </div>
            )}
            <VideoControls
                showBoxes={showBoxes}
                setShowBoxes={setShowBoxes}
                showPaths={showPaths}
                setShowPaths={setShowPaths}
                showIds={showIds}
                setShowIds={setShowIds}
                showConfidence={showConfidence}
                setShowConfidence={setShowConfidence}
            />
        </div>
    );
};

export default VideoPlayer;
