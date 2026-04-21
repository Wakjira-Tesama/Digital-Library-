const mongoose = require("mongoose");

const ebookProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ebook: { type: mongoose.Schema.Types.ObjectId, ref: "Ebook", index: true },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    currentChapter: { type: String },
    lastOpenedAt: { type: Date, default: Date.now },
    totalMinutesRead: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ebookProgressSchema.index({ user: 1, ebook: 1 }, { unique: true });

module.exports = mongoose.model("EbookProgress", ebookProgressSchema);
