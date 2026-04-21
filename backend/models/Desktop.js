// backend/models/Desktop.js
const mongoose = require("mongoose");

const desktopSchema = new mongoose.Schema({
  desktop_id: { type: String, unique: true },
  ip_address: String,
  mac_address: String,
  status: { type: String, default: "offline" },
  library_id: { type: mongoose.Schema.Types.ObjectId, ref: "Library" },
  last_heartbeat: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Desktop", desktopSchema);
