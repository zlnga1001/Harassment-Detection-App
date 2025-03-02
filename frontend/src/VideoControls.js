import React from 'react';
import './VideoControls.css';

const VideoControls = ({ showBoxes, setShowBoxes }) => {
    return (
        <div className="video-controls">
            <label>
                <input
                    type="checkbox"
                    checked={showBoxes}
                    onChange={(e) => setShowBoxes(e.target.checked)}
                />
                Show Bounding Boxes
            </label>
        </div>
    );
};

export default VideoControls;
