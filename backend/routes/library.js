// backend/routes/library.js
const express = require("express");
const Library = require("../models/Library");
const { auth, requireRole } = require("../middleware/auth");
const router = express.Router();

// List all libraries (general_admin only)
router.get("/", auth, requireRole("general_admin"), async (req, res) => {
  const libraries = await Library.find();
  res.json(libraries);
});

// Get a single library by id (any authenticated user)
router.get("/:id", auth, async (req, res) => {
  try {
    const lib = await Library.findById(req.params.id);
    if (!lib) return res.status(404).json({ error: "Library not found" });
    res.json(lib);
  } catch (err) {
    res.status(400).json({ error: "Invalid library id" });
  }
});

// Add a library (general_admin only)
router.post("/", auth, requireRole("general_admin"), async (req, res) => {
  try {
    const library = new Library({ name: req.body.name });
    await library.save();
    res.status(201).json(library);
  } catch (err) {
    res.status(400).json({ error: "Library creation failed" });
  }
});

// Delete a library (general_admin only)
router.delete("/:id", auth, requireRole("general_admin"), async (req, res) => {
  await Library.findByIdAndDelete(req.params.id);
  res.json({ message: "Library deleted" });
});

module.exports = router;
