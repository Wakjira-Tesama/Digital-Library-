const express = require("express");
const { auth } = require("../middleware/auth");
const EbookProgress = require("../models/EbookProgress");
const EbookShelf = require("../models/EbookShelf");
const EbookHighlight = require("../models/EbookHighlight");

const router = express.Router();

// Upsert basic progress when a student reads an ebook
router.post("/progress", auth, async (req, res) => {
  try {
    const { ebook_id, progressPercent, currentChapter, minutesRead } =
      req.body || {};
    if (!ebook_id) {
      return res.status(400).json({ error: "ebook_id is required" });
    }
    const update = {
      lastOpenedAt: new Date(),
    };
    if (typeof progressPercent === "number") {
      update.progressPercent = Math.max(0, Math.min(100, progressPercent));
    }
    if (typeof currentChapter === "string") {
      update.currentChapter = currentChapter;
    }
    if (typeof minutesRead === "number" && minutesRead > 0) {
      update.$inc = { totalMinutesRead: minutesRead };
    }

    const progress = await EbookProgress.findOneAndUpdate(
      { user: req.user._id, ebook: ebook_id },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json(progress);
  } catch (error) {
    console.error("Failed to update ebook progress", error);
    res.status(500).json({ error: "Failed to update ebook progress" });
  }
});

// Get all progress entries for the current user
router.get("/progress", auth, async (req, res) => {
  try {
    const progress = await EbookProgress.find({ user: req.user._id })
      .populate("ebook")
      .sort({ lastOpenedAt: -1 });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: "Failed to load progress" });
  }
});

// Shelf endpoints
router.get("/shelf", auth, async (req, res) => {
  try {
    const items = await EbookShelf.find({ user: req.user._id })
      .populate("ebook")
      .sort({ addedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to load shelf" });
  }
});

router.post("/shelf", auth, async (req, res) => {
  try {
    const { ebook_id } = req.body || {};
    if (!ebook_id) {
      return res.status(400).json({ error: "ebook_id is required" });
    }
    const item = await EbookShelf.findOneAndUpdate(
      { user: req.user._id, ebook: ebook_id },
      { user: req.user._id, ebook: ebook_id, addedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const populated = await item.populate("ebook");
    res.status(201).json(populated);
  } catch (error) {
    console.error("Failed to add to shelf", error);
    res.status(500).json({ error: "Failed to add to shelf" });
  }
});

router.delete("/shelf/:ebookId", auth, async (req, res) => {
  try {
    await EbookShelf.findOneAndDelete({
      user: req.user._id,
      ebook: req.params.ebookId,
    });
    res.json({ message: "Removed from shelf" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from shelf" });
  }
});

// Highlights endpoints
router.get("/highlights", auth, async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.ebook_id) filter.ebook = req.query.ebook_id;
    const items = await EbookHighlight.find(filter)
      .populate("ebook")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to load highlights" });
  }
});

router.post("/highlights", auth, async (req, res) => {
  try {
    const { ebook_id, text, location } = req.body || {};
    if (!ebook_id || !text) {
      return res.status(400).json({ error: "ebook_id and text are required" });
    }
    const item = await EbookHighlight.create({
      user: req.user._id,
      ebook: ebook_id,
      text,
      location,
    });
    const populated = await item.populate("ebook");
    res.status(201).json(populated);
  } catch (error) {
    console.error("Failed to save highlight", error);
    res.status(500).json({ error: "Failed to save highlight" });
  }
});

router.delete("/highlights/:id", auth, async (req, res) => {
  try {
    await EbookHighlight.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    res.json({ message: "Highlight deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete highlight" });
  }
});

// Stats + currently reading for the student dashboard
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const [progress, shelfCount, highlightCount] = await Promise.all([
      EbookProgress.find({ user: userId })
        .populate("ebook")
        .sort({ lastOpenedAt: -1 }),
      EbookShelf.countDocuments({ user: userId }),
      EbookHighlight.countDocuments({ user: userId }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalBooks = progress.length;
    const completedBooks = progress.filter(
      (p) => (p.progressPercent || 0) >= 100,
    ).length;
    const monthlyCompleted = progress.filter(
      (p) => p.lastOpenedAt && p.lastOpenedAt >= monthStart,
    ).length;
    const readingMinutesThisWeek = progress
      .filter((p) => p.lastOpenedAt && p.lastOpenedAt >= weekAgo)
      .reduce((sum, p) => sum + (p.totalMinutesRead || 0), 0);

    const earliestRecent = progress[progress.length - 1]?.lastOpenedAt;
    let readingStreakDays = 0;
    if (earliestRecent) {
      const diffMs = now.getTime() - earliestRecent.getTime();
      readingStreakDays = Math.max(
        1,
        Math.min(30, Math.round(diffMs / (1000 * 60 * 60 * 24))),
      );
    }

    const monthlyGoal = 8; // static goal for now

    const currentlyReading = progress.find(
      (p) => (p.progressPercent || 0) < 100,
    );

    res.json({
      totalBooks,
      completedBooks,
      monthlyGoal,
      monthlyCompleted,
      readingMinutesThisWeek,
      readingStreakDays,
      shelfCount,
      highlightCount,
      currentlyReading,
    });
  } catch (error) {
    console.error("Failed to compute ebook stats", error);
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

module.exports = router;
