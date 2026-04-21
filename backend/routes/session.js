// routes/session.js
const express = require("express");
const router = express.Router();

// In-memory session store (replace with DB in production)
let sessions = [];

// Get all sessions
router.get("/", (req, res) => {
  res.json(sessions);
});

// Create a new session
router.post("/", (req, res) => {
  const session = req.body;
  session.id = sessions.length + 1;
  sessions.push(session);
  res.status(201).json(session);
});

// Get session by ID
router.get("/:id", (req, res) => {
  const session = sessions.find((s) => s.id === parseInt(req.params.id));
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

// Update session
router.put("/:id", (req, res) => {
  const idx = sessions.findIndex((s) => s.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Session not found" });
  sessions[idx] = { ...sessions[idx], ...req.body };
  res.json(sessions[idx]);
});

// Delete session
router.delete("/:id", (req, res) => {
  const idx = sessions.findIndex((s) => s.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Session not found" });
  sessions.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
