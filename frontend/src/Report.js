import React, { useState, useEffect } from 'react';
import './Report.css';

const Report = ({ videoId }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await fetch(`/api/reports/${videoId}`);
                if (!response.ok) throw new Error('Failed to fetch report');
                const data = await response.json();
                setReport(data);
            } catch (error) {
                console.error('Error fetching report:', error);
            } finally {
                setLoading(false);
            }
        };

        if (videoId) {
            fetchReport();
        }
    }, [videoId]);

    if (loading) return <div className="report-loading">Loading report...</div>;
    if (!report) return null;

    return (
        <div className="report-container">
            <h3 className="report-title">Incident Report</h3>
            
            {report.crimeType && (
                <div className="report-section">
                    <h4>Type of Incident</h4>
                    <p className="report-crime-type">{report.crimeType}</p>
                </div>
            )}
            
            {report.location && (
                <div className="report-section">
                    <h4>Location</h4>
                    <p className="report-location">{report.location}</p>
                </div>
            )}
            
            {report.events && report.events.length > 0 && (
                <div className="report-section">
                    <h4>Timeline</h4>
                    <div className="report-timeline">
                        {report.events.map((event, index) => (
                            <div key={index} className="timeline-event">
                                <span className="event-time">{event.time}</span>
                                <span className="event-description">{event.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Report;
