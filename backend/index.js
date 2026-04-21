const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files (chat attachments, announcement images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the new Node.js backend!" });
});

// Frontend compatibility routes (same path contract as previous Python backend)
app.use(require("./routes/legacy"));

// API routes (to be expanded)
// Auth routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/desktops", require("./routes/desktop"));
app.use("/api/sessions", require("./routes/session"));

// Library, analytics, and issue routes
app.use("/api/libraries", require("./routes/library"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/issues", require("./routes/issue"));
app.use("/api/ebooks", require("./routes/ebook"));
app.use("/api/library-chat", require("./routes/libraryChat"));
app.use("/api/ebook-user", require("./routes/ebookUser"));
app.use("/api/ai", require("./routes/aiScholar"));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Node.js backend running on port ${PORT}`);
});
