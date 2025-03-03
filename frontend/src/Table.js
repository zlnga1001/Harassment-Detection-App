import VideoPlayer from './VideoPlayer';

const videos = [
    { id: 0, location: "Courtyard", threats: "Harassment", src: "/videos/assault.mp4" },
    { id: 1, location: "West Hallway", threats: "Assault", src: "/videos/recorded1.mp4" },
    { id: 2, location: "Dining Hall", threats: "Battery", src: "/videos/Fighting0.mp4" },
    { id: 3, location: "Lobby", threats: "Harassment", src: "/videos/Fighting1.mp4" },
    { id: 4, location: "Meeting Room 1", threats: "Assault", src: "/videos/Fighting2.mp4" },
    { id: 5, location: "Entrance", threats: "Battery", src: "/videos/Fighting3.mp4" },
  ];
  
  
  export default function Table({ setFocusedVideo, setSidebarActive, selectedVideoId }) {
    const videosPerRow = 3;

    return (
        <div id="tableHolder">
            <table style={{ width: '100%', tableLayout: 'fixed' }}>
                <tbody>
                    {Array.from({ length: Math.ceil(videos.length / videosPerRow) }, (_, rowIndex) => (
                        <tr key={rowIndex}>
                            {videos
                                .slice(rowIndex * videosPerRow, rowIndex * videosPerRow + videosPerRow)
                                .map((video) => (
                                    <td key={video.id} style={{ width: `${100 / videosPerRow}%` }}>
                                        <div 
                                            className="vidMask" 
                                            style={{
                                                border: selectedVideoId === video.id ? "3px solid rgb(74, 74, 254)" : "3px solid transparent"
                                            }}
                                        >
                                            <VideoPlayer
                                                src={video.src}
                                                autoPlay
                                                muted
                                                loop
                                                style={{ objectFit: "cover", cursor: "pointer", width: '100%', height: '100%' }}
                                                onClick={() => {
                                                    setFocusedVideo(video);
                                                    setSidebarActive(true);
                                                }}
                                            />
                                            <div className="vidText">{video.location}</div>
                                        </div>
                                    </td>
                                ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}