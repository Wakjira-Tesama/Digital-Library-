// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { student_id, name, email, password, role, library_id } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { student_id }] });
    if (existing) return res.status(409).json({ error: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      student_id,
      name,
      email,
      password: hashed,
      role,
      library_id,
    });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" },
    );
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
