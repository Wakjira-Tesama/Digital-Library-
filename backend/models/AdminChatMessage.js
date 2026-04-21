// backend/models/AdminChatMessage.js
const mongoose = require("mongoose");

const adminChatMessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  from_name: { type: String, required: true },
  from_role: {
    type: String,
    enum: ["general_admin", "librarian"],
    required: true,
  },
  library_id: { type: mongoose.Schema.Types.ObjectId, ref: "Library" },
  category: { type: String, default: "General" },
  message: { type: String, default: "" },
  // Optional routing info so chats are private between
  // general admin and a specific librarian/library
  target_role: {
    type: String,
    enum: ["general_admin", "librarian"],
  },
  target_library_id: { type: mongoose.Schema.Types.ObjectId, ref: "Library" },
  // Optional attachment metadata for files/images
  attachment_url: { type: String },
  attachment_name: { type: String },
  attachment_type: { type: String },
  status: {
    type: String,
    enum: ["open", "approved", "in_progress", "resolved", "info"],
    default: "open",
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AdminChatMessage", adminChatMessageSchema);
