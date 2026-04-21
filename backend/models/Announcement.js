// backend/models/Announcement.js
const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Target audience for this announcement
  audience: {
    type: String,
    enum: ["all_members", "students_only", "staff_only"],
    default: "all_members",
  },
  // Priority drives how the UI highlights/pins the announcement
  priority: {
    type: String,
    enum: ["normal", "high", "urgent"],
    default: "normal",
  },
  // Role that authored the announcement: general_admin or librarian
  creator_role: {
    type: String,
    enum: ["general_admin", "librarian"],
    default: "general_admin",
  },
  // Optional library scope for librarian announcements
  library_id: { type: mongoose.Schema.Types.ObjectId, ref: "Library" },
  // Optional image attached to the announcement
  image_url: { type: String },
});

module.exports = mongoose.model("Announcement", announcementSchema);
