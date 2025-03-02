const fs = require('fs').promises;
const path = require('path');
const { parseVideoAnalysis } = require('./videoAnalysisParser');

class VideoAnalysisStore {
    constructor() {
        this.analyses = null;
    }

    async loadAnalyses() {
        if (this.analyses) return this.analyses;

        try {
            const rawText = await fs.readFile(
                path.join(__dirname, 'video_analysis_raw.txt'),
                'utf-8'
            );
            this.analyses = parseVideoAnalysis(rawText);
            return this.analyses;
        } catch (error) {
            console.error('Error loading video analyses:', error);
            return [];
        }
    }

    async getAnalysisForVideo(videoId) {
        const analyses = await this.loadAnalyses();
        return analyses.find(a => a.videoId === videoId) || null;
    }

    async getCrimeReport(videoId) {
        const analysis = await this.getAnalysisForVideo(videoId);
        if (!analysis) return null;

        return {
            location: analysis.location,
            crimeType: analysis.crimeType,
            events: analysis.timeline.map(t => ({
                time: t.time,
                description: t.event
            }))
        };
    }
}

module.exports = new VideoAnalysisStore();
