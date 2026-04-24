const express = require("express");
const cors = require("cors");
const { processData } = require("./logic");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Optional root route (for quick browser check)
app.get("/", (req, res) => {
    res.send("API is running. Use POST /bfhl");
});

// Main API route
app.post("/bfhl", (req, res) => {
    try {
        const data = req.body.data;

        // Validate input
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: "Invalid input" });
        }

        const result = processData(data);

        res.json({
            // 🔴 REPLACE THESE WITH YOUR REAL DETAILS
            user_id: "jayanthdannana_18082005",
            email_id: "jd0047l@srmist.edu.in",
            college_roll_number: "RA2311004020015",

            ...result
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});