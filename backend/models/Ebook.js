const mongoose = require("mongoose");

const ebookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    description: { type: String, trim: true },
    category: { type: String, index: true, trim: true },
    tags: [{ type: String, index: true }],
    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true,
      index: true,
    },
    // Optional cover image for nicer student dashboard cards
    coverUrl: { type: String },
    fileUrl: { type: String },
    externalLink: { type: String },
    popularityScore: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ebook", ebookSchema);
