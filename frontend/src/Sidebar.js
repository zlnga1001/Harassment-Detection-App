export default function Sidebar({ videoData, sidebarActive, setSidebarActive }){
    return(
        <aside id="sidebar">
            <div id="sidebarContent" style={{ display: sidebarActive ? "block" : "none" }}>
                <div id="sidebarHeader">Report?</div>
                {videoData ? (
                    <div className="sidebarText">
                    <p>{videoData.threats} detected at {videoData.location} </p>
                    </div>
                ) : (
                    <p>No video selected</p>
                )}
                <button className="button" onClick={() => sendTelegramMessage(`${videoData.threats} detected at ${videoData.location}`)}>Report!</button>
                <button className="button" onClick={() => setSidebarActive(false)}>Nope</button>

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