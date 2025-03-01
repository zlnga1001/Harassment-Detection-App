import './App.css';
import Table from "./Table";
import Sidebar from "./Sidebar";
import { useState } from "react";

function App() {
  const [focusedVideo, setFocusedVideo] = useState(null);
  const [sidebarActive, setSidebarActive] = useState(false);
  return (
    <div className="container">
      <h1>EyeGuard</h1>
      <div className="bodyContainer">
        <Table setFocusedVideo={setFocusedVideo} setSidebarActive={setSidebarActive} />
        <Sidebar videoData={focusedVideo} sidebarActive={sidebarActive} setSidebarActive={setSidebarActive}/>
      </div>
    </div>
  );
}

export default App;
