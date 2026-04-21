// routes/user.js
const express = require("express");
const router = express.Router();

// In-memory user store (replace with DB in production)
let users = [];

// Get all users
router.get("/", (req, res) => {
  res.json(users);
});

// Create a new user
router.post("/", (req, res) => {
  const user = req.body;
  user.id = users.length + 1;
  users.push(user);
  res.status(201).json(user);
});

// Get user by ID
router.get("/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Update user
router.put("/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

// Delete user
router.delete("/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
