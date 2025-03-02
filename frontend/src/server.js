const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const TELEGRAM_BOT_TOKEN = "7675796772:AAGx111MK6EIKI55hb3CmKhnua6bMBUE8-0";
const CHAT_ID = "-4634190648";

app.post("/send-telegram", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default; // Dynamic import
    const message = req.body.message || "A video button was clicked!";

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        disable_notification: false, 
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

const PORT = 5400;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
