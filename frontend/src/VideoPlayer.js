import React, { useRef, useEffect, useState, useCallback } from 'react';
import VideoControls from './VideoControls';

const VideoPlayer = ({ src, width, height, autoPlay, muted, loop, onClick, style }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [boxesData, setBoxesData] = useState(null);
    const [error, setError] = useState(null);
    const [showBoxes, setShowBoxes] = useState(true);
    const [boxHistory, setBoxHistory] = useState({});
    const animationFrameRef = useRef(null);

    // Parameters for box smoothing
    const HISTORY_LENGTH = 30;  // Increased for smoother tracking
    const SMOOTHING_FACTOR = 0.85;  // Increased for more stability
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
                const weight = SMOOTHING_FACTOR * Math.exp(-index / history.length);  // Exponential decay
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

    const getFrameData = useCallback((currentFrame) => {
        if (!boxesData?.frames) return null;

        // If we have data for the exact frame, use it
        if (boxesData.frames[currentFrame]) {
            const frameData = boxesData.frames[currentFrame];
            if (!frameData?.boxes) return null;
            
            // Apply temporal smoothing to each box
            const smoothedData = {
                ...frameData,
                boxes: frameData.boxes.map((box, index) => {
                    if (!box) return null;
                    const trackId = frameData.track_ids?.[index];
                    if (!trackId) return box;
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
            
            // Smooth interpolation between frames
            const frame1 = boxesData.frames[prevFrame];
            const frame2 = boxesData.frames[nextFrame];
            
            if (!frame1?.boxes || !frame2?.boxes) return null;

            const boxes = [];
            const confidences = [];
            const track_ids = [];

            frame1.track_ids.forEach((id1, index1) => {
                if (!id1) return;
                const index2 = frame2.track_ids.indexOf(id1);
                if (index2 === -1) return;

                const box1 = frame1.boxes[index1];
                const box2 = frame2.boxes[index2];
                if (!box1 || !box2) return;

                const conf1 = frame1.confidences?.[index1] ?? 0;
                const conf2 = frame2.confidences?.[index2] ?? 0;

                // Smooth easing function for interpolation
                const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
                
                // Interpolate box coordinates
                const box = box1.map((coord1, i) => {
                    const coord2 = box2[i];
                    return coord1 + (coord2 - coord1) * easeProgress;
                });

                boxes.push(box);
                confidences.push(conf1 + (conf2 - conf1) * easeProgress);
                track_ids.push(id1);
            });

            const interpolated = {
                boxes,
                confidences,
                track_ids,
                is_keyframe: false
            };

            // Apply temporal smoothing to interpolated boxes
            interpolated.boxes = interpolated.boxes.map((box, index) => {
                if (!box) return null;
                const trackId = interpolated.track_ids?.[index];
                if (!trackId) return box;
                return smoothBoxes(box, trackId);
            });

            return interpolated;
        }

        return null;
    }, [boxesData, smoothBoxes, updateBoxHistory]);

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
            if (!frameData?.boxes) return;
        
            frameData.boxes.forEach((box, index) => {
                if (!showBoxes || !box) return;
        
                const confidence = frameData.confidences[index];
                if (confidence < CONFIDENCE_THRESHOLD) return;
        
                const [x1, y1, x2, y2] = box;
                if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) return;
        
                const scaleX = canvas.width / boxesData.video_info.width;
                const scaleY = canvas.height / boxesData.video_info.height;
        
                const scaledX1 = x1 * scaleX;
                const scaledY1 = y1 * scaleY;
                const scaledX2 = x2 * scaleX;
                const scaledY2 = y2 * scaleY;
        
                // Draw semi-transparent bounding box background
                ctx.fillStyle = `rgba(0, 255, 0, 0.3)`;
                ctx.fillRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
        
                // Draw border
                ctx.strokeStyle = 'rgb(0, 255, 0)';
                ctx.lineWidth = 3;
                ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
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
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [boxesData, showBoxes, getFrameData]);

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
                style={{ width: '100%', height: '100%' }}
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
            />
        </div>
    );
};

export default VideoPlayer;
