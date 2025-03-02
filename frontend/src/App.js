import './App.css';
import Table from "./Table";
import Sidebar from "./Sidebar";
import { useState } from "react";

function App() {
  const [focusedVideo, setFocusedVideo] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  return (
    <div className="container">
      <h1 style={{ color: "white", fontWeight: 400 }}>
        <img src="logoWhite.png" alt="EyeGuard Logo" style={{ height: "25px", width: "25px" }} />
        EyeGuard
      </h1>
      <div className="bodyContainer">
        <Table
          setFocusedVideo={(video) => {
            setFocusedVideo(video);
            setSelectedVideoId(video.id); // Track selected video
          }}
          setSidebarActive={setSidebarActive}
          selectedVideoId={selectedVideoId}
        />
        <Sidebar
          videoData={focusedVideo}
          sidebarActive={sidebarActive}
          setSidebarActive={setSidebarActive}
          setSelectedVideoId={setSelectedVideoId}
        />
      </div>
    </div>
  );
}

export default App;