// routes/desktop.js
const express = require("express");
const router = express.Router();

// In-memory desktop store (replace with DB in production)
let desktops = [];

// Get all desktops
router.get("/", (req, res) => {
  res.json(desktops);
});

// Create a new desktop
router.post("/", (req, res) => {
  const desktop = req.body;
  desktop.id = desktops.length + 1;
  desktops.push(desktop);
  res.status(201).json(desktop);
});

// Get desktop by ID
router.get("/:id", (req, res) => {
  const desktop = desktops.find((d) => d.id === parseInt(req.params.id));
  if (!desktop) return res.status(404).json({ error: "Desktop not found" });
  res.json(desktop);
});

// Update desktop
router.put("/:id", (req, res) => {
  const idx = desktops.findIndex((d) => d.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Desktop not found" });
  desktops[idx] = { ...desktops[idx], ...req.body };
  res.json(desktops[idx]);
});

// Delete desktop
router.delete("/:id", (req, res) => {
  const idx = desktops.findIndex((d) => d.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Desktop not found" });
  desktops.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
