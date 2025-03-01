import './App.css';
import Table from "./Table";
import Sidebar from "./Sidebar";
import { useState } from "react";

function App() {
  const [focusedVideo, setFocusedVideo] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);
  return (
    <div className="container">
      <h1>Title</h1>
      <div className="bodyContainer">
        <Table setFocusedVideo={setFocusedVideo} setSidebarActive={setSidebarActive} />
        <Sidebar videoData={focusedVideo} sidebarActive={sidebarActive} />
      </div>
    </div>
  );
}

export default App;
