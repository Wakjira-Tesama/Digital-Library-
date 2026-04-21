// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  student_id: { type: String, unique: true },
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["student", "librarian", "general_admin"],
    default: "student",
  },
  library_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Library",
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
