// backend/routes/issue.js
const express = require("express");
const IssueReport = require("../models/IssueReport");
const { auth } = require("../middleware/auth");
const router = express.Router();

// List issues (general_admin or librarian)
router.get("/", auth, async (req, res) => {
  const role = req.user.role;
  let filter = {};
  if (role === "librarian") filter.library_id = req.user.library_id;
  const issues = await IssueReport.find(filter);
  res.json(issues);
});

// Report an issue (any logged-in user)
router.post("/report", auth, async (req, res) => {
  try {
    const { library_id, ...rest } = req.body;
    const report = new IssueReport({ 
      ...rest, 
      student_id: req.user._id,
      library_id: library_id || req.user.library_id 
    });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: "Issue report failed" });
  }
});

module.exports = router;
