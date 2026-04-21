// backend/models/Library.js
const mongoose = require("mongoose");

const librarySchema = new mongoose.Schema({
  name: { type: String, unique: true },
});

module.exports = mongoose.model("Library", librarySchema);
