import React from 'react';
import './VideoControls.css';

const VideoControls = ({ 
    showBoxes, 
    setShowBoxes,
    showPaths, 
    setShowPaths,
    showIds, 
    setShowIds,
    showConfidence, 
    setShowConfidence 
}) => {
    return (
        <div className="video-controls">
            <div className="control-group">
                <label>
                    <input
                        type="checkbox"
                        checked={showBoxes}
                        onChange={(e) => setShowBoxes(e.target.checked)}
                    />
                    Show Bounding Boxes
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={showPaths}
                        onChange={(e) => setShowPaths(e.target.checked)}
                    />
                    Show Movement Paths
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={showIds}
                        onChange={(e) => setShowIds(e.target.checked)}
                    />
                    Show Tracking IDs
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={showConfidence}
                        onChange={(e) => setShowConfidence(e.target.checked)}
                    />
                    Show Confidence Scores
                </label>
            </div>
        </div>
    );
};

export default VideoControls;
