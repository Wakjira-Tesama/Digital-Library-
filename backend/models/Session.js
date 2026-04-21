// backend/models/Session.js
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  desktop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Desktop" },
  start_time: { type: Date, default: Date.now },
  end_time: Date,
  is_active: { type: Boolean, default: true },
  duration_minutes: { type: Number, default: 60 },
});

module.exports = mongoose.model("Session", sessionSchema);
