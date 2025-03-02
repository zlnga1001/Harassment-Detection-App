function parseVideoAnalysis(rawText) {
    const analyses = rawText.split('================================================================================');
    const results = [];

    for (const analysis of analyses) {
        if (!analysis.trim()) continue;

        const lines = analysis.trim().split('\n');
        const videoMatch = lines[1]?.match(/# Analysis for: (.+)\.mp4/);
        if (!videoMatch) continue;

        const videoId = videoMatch[1];
        let location = '';
        let crimeType = '';
        let timeline = [];

        // Parse through lines to extract information
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Extract location
            if (line.includes('Location:')) {
                const nextLine = lines[i + 1]?.trim();
                if (nextLine && !nextLine.startsWith('#')) {
                    location = nextLine;
                }
            }

            // Extract crime information
            if (line.includes('crime occurred')) {
                const crimeMatch = lines[i].match(/crime is \*\*([^*]+)\*\*/);
                if (crimeMatch) {
                    crimeType = crimeMatch[1].trim();
                }
            }

            // Extract timeline events
            if (line.match(/^\*\*\d+:\d+/)) {
                const timeMatch = line.match(/\*\*(\d+:\d+)\*\*/);
                const eventMatch = line.match(/\*\*:\s*(.+)/);
                if (timeMatch && eventMatch) {
                    timeline.push({
                        time: timeMatch[1],
                        event: eventMatch[1].trim()
                    });
                }
            }
        }

        if (videoId) {
            results.push({
                videoId,
                location,
                crimeType: crimeType || 'Unknown',
                timeline
            });
        }
    }

    return results;
}

module.exports = { parseVideoAnalysis };
