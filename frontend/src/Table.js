const videos = [
    { id: 0, location: "Location 1", threats: "Harassment", src: "videos/assault.mp4" },
    { id: 1, location: "Location 2", threats: "Assault", src: "videos/recorded1.mp4" },
    { id: 2, location: "Location 3", threats: "Battery", src: "videos/Fighting0.mp4" },
    { id: 3, location: "Location 4", threats: "Harassment", src: "videos/Fighting1.mp4" },
    { id: 4, location: "Location 5", threats: "Assault", src: "videos/Fighting2.mp4" },
    { id: 5, location: "Location 6", threats: "Battery", src: "videos/Fighting3.mp4" },
  ];
  
  
export default function Table({ setFocusedVideo, setSidebarActive }) {
    // Number of videos per row
    const videosPerRow = 3;

    return (
        <div id="tableHolder">
        <table>
            <tbody>
            {Array.from({ length: Math.ceil(videos.length / videosPerRow) }, (_, rowIndex) => (
                <tr key={rowIndex}>
                {videos
                    .slice(rowIndex * videosPerRow, rowIndex * videosPerRow + videosPerRow)
                    .map((video) => (
                    <td key={video.id}>
                        <div className="vidMask">
                        <video
                            width="320"
                            height="180"
                            autoPlay
                            muted
                            loop
                            style={{ objectFit: "cover"}}
                            onClick={(e) => {
                                setFocusedVideo(video);
                                setSidebarActive(true);
                              }}
                        >
                            <source src={video.src} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
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