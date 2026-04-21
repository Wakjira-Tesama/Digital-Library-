// backend/routes/analytics.js
const express = require("express");
const Desktop = require("../models/Desktop");
const Session = require("../models/Session");
const EbookProgress = require("../models/EbookProgress");
const { auth, requireRole } = require("../middleware/auth");
const router = express.Router();

// Get stats (general_admin or librarian)
router.get("/stats", auth, async (req, res) => {
  const role = req.user.role;
  let libraryId = req.query.library_id;
  if (role === "librarian") libraryId = req.user.library_id;

  const desktopFilter = libraryId ? { library_id: libraryId } : {};
  const desktops = await Desktop.find(desktopFilter).select("_id status");
  const totalDesktops = desktops.length;

  const desktopCounts = desktops.reduce(
    (acc, d) => {
      const status = String(d.status || "offline").toLowerCase();
      if (status === "available") acc.available += 1;
      else if (status === "busy") acc.busy += 1;
      else if (status === "maintenance") acc.maintenance += 1;
      else acc.offline += 1;
      return acc;
    },
    { available: 0, busy: 0, maintenance: 0, offline: 0 },
  );

  const sessionFilter = desktops.length
    ? { desktop_id: { $in: desktops.map((d) => d._id) } }
    : libraryId
      ? { desktop_id: { $in: [] } }
      : {};

  const totalSessions = await Session.countDocuments(sessionFilter);
  const activeSessions = await Session.countDocuments({
    ...sessionFilter,
    is_active: true,
  });

  res.json({
    desktops: {
      total: totalDesktops,
      ...desktopCounts,
    },
    sessions: { total: totalSessions, active: activeSessions },
  });
});

// Top read books (general admin only)
// Computes ranking from EbookProgress.totalMinutesRead across all libraries.
router.get(
  "/top-read-books",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    try {
      const limit = Math.max(
        1,
        Math.min(20, Number.parseInt(req.query.limit || "5", 10) || 5),
      );

      const rows = await EbookProgress.aggregate([
        {
          $group: {
            _id: "$ebook",
            readers: { $sum: 1 },
            totalMinutes: { $sum: "$totalMinutesRead" },
            avgProgress: { $avg: "$progressPercent" },
            lastOpenedAt: { $max: "$lastOpenedAt" },
          },
        },
        { $sort: { totalMinutes: -1, readers: -1, lastOpenedAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "ebooks",
            localField: "_id",
            foreignField: "_id",
            as: "ebook",
          },
        },
        { $unwind: { path: "$ebook", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            ebook_id: "$_id",
            title: "$ebook.title",
            author: "$ebook.author",
            library_id: "$ebook.library",
            readers: 1,
            totalMinutes: 1,
            avgProgress: { $round: ["$avgProgress", 1] },
            lastOpenedAt: 1,
          },
        },
      ]);

      return res.json(rows);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to compute top read books", err);
      return res
        .status(500)
        .json({ detail: err?.message || "Failed to compute top read books" });
    }
  },
);

module.exports = router;
