const mongoose = require("mongoose");

const ebookHighlightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ebook: { type: mongoose.Schema.Types.ObjectId, ref: "Ebook", index: true },
    text: { type: String, required: true },
    location: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EbookHighlight", ebookHighlightSchema);
