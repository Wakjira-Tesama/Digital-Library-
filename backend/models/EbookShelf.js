const mongoose = require("mongoose");

const ebookShelfSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ebook: { type: mongoose.Schema.Types.ObjectId, ref: "Ebook", index: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ebookShelfSchema.index({ user: 1, ebook: 1 }, { unique: true });

module.exports = mongoose.model("EbookShelf", ebookShelfSchema);
