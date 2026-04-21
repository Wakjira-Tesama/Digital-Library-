// backend/models/IssueReport.js
const mongoose = require("mongoose");

const issueReportSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  desktop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Desktop" },
  category: String,
  description: String,
  created_at: { type: Date, default: Date.now },
  library_id: { type: mongoose.Schema.Types.ObjectId, ref: "Library" },
});

module.exports = mongoose.model("IssueReport", issueReportSchema);
