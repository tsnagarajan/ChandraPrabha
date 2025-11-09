const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/log-chart", (req, res) => {
  const logPath = path.join(__dirname, "logs", "chart-usage.json");

  const newEntry = {
    timestamp: new Date().toISOString(),
    data: req.body,
  };

  console.log("Received chart input:", req.body); // ✅ Add this line


  if (!fs.existsSync(path.dirname(logPath))) {
    fs.mkdirSync(path.dirname(logPath));
  }

  let existingLogs = [];
  if (fs.existsSync(logPath)) {
    existingLogs = JSON.parse(fs.readFileSync(logPath, "utf8"));
  }

  existingLogs.push(newEntry);
  fs.writeFileSync(logPath, JSON.stringify(existingLogs, null, 2));

  res.status(200).json({ message: "Logged successfully" });
});

app.listen(3001, () => {
  console.log("Logging server running on port 3001");
});