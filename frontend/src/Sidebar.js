import { useState } from "react";

export default function Sidebar({ videoData, sidebarActive, setSidebarActive, setSelectedVideoId }){
    
    const [buttonText, setButtonText] = useState("Report!");
    const handleReportClick = () => {
        setButtonText("Reported!"); // Change button text
        sendTelegramMessage(`${videoData.threats} detected at ${videoData.location}`);
        setTimeout(() => {
            setSidebarActive(false); // Hide sidebar after a delay
            setButtonText("Report!"); // Reset button text after hiding
        }, 1000); // Adjust delay as needed
    };

    const handleBackClick = () => {
        setSidebarActive(false);
        setSelectedVideoId(-1);
    };
    
    return(
        <aside id="sidebar">
            <div id="sidebarContent" style={{ display: sidebarActive ? "none" : "block" }}>
                <div style={{fontSize: "30px", paddingTop: "30px"}}> Click a location to report it </div>

            </div>
            <div id="sidebarContent" style={{ display: sidebarActive ? "block" : "none" }}>
                <div id="sidebarHeader" style={{ fontSize: "35px" }} >Report?</div>
                {videoData ? (
                    <div className="sidebarText" style={{ fontSize: "25px" }}>
                    <p>{videoData.threats} detected at {videoData.location} </p>
                    </div>
                ) : (
                    <p>No video selected</p>
                )}
                <button className="button" onClick={handleReportClick}>{buttonText}</button>
                <button className="button" onClick={handleBackClick}>Nope</button>

            </div>
        </aside>
    )
}

async function sendTelegramMessage(msg) {
    await fetch("http://localhost:5000/send-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    })
      .then((response) => response.json())
      .then((data) => console.log("Message sent:", data))
      .catch((error) => console.error("Error sending message:", error));
}