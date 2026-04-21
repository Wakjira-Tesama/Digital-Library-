const express = require("express");
const Ebook = require("../models/Ebook");
const Announcement = require("../models/Announcement");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Create or update an ebook (librarian only)
router.post("/", auth, requireRole("librarian"), async (req, res) => {
  try {
    const {
      id,
      title,
      author,
      description,
      category,
      tags,
      library_id,
      fileUrl,
      externalLink,
      coverUrl,
    } = req.body;

    const libraryForEbook = req.user?.library_id || library_id;

    const payload = {
      title,
      author,
      description,
      category,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string" && tags.trim().length
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      library: libraryForEbook,
      coverUrl,
      fileUrl,
      externalLink,
    };

    let ebook;
    if (id) {
      ebook = await Ebook.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      });
    } else {
      ebook = await Ebook.create(payload);

      // When a librarian indexes a NEW ebook, broadcast a
      // short announcement so students notice the new title.
      try {
        await Announcement.create({
          title: `New e-book: ${title}`,
          body:
            (description && description.substring(0, 220)) ||
            "Your library has added a new digital book.",
          created_by: req.user._id,
          creator_role: "librarian",
          library_id: libraryForEbook || req.user.library_id || null,
          image_url: coverUrl || null,
        });
      } catch (announceError) {
        // Do not fail the main request if announcement fails.
        // eslint-disable-next-line no-console
        console.error("Failed to create ebook announcement", announceError);
      }
    }

    res.status(id ? 200 : 201).json(ebook);
  } catch (error) {
    console.error("Failed to save ebook", error);
    res.status(400).json({ error: "Failed to save ebook" });
  }
});

// Delete ebook (librarian only)
router.delete("/:id", auth, requireRole("librarian"), async (req, res) => {
  try {
    await Ebook.findByIdAndDelete(req.params.id);
    res.json({ message: "Ebook deleted" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete ebook" });
  }
});

// List ebooks for a library (students + admins)
router.get("/", auth, async (req, res) => {
  try {
    const { library_id } = req.query;
    const libraryFilter =
      library_id ||
      (req.user && req.user.role === "student" && req.user.library_id) ||
      null;

    const query = {};
    if (libraryFilter) query.library = libraryFilter;
    const ebooks = await Ebook.find(query).sort({ createdAt: -1 });
    res.json(ebooks);
  } catch (error) {
    res.status(500).json({ error: "Failed to load ebooks" });
  }
});

// Search ebooks with ranking by relevance + popularity
router.get("/search", auth, async (req, res) => {
  try {
    const { q, library_id } = req.query;
    const libraryFilter =
      library_id ||
      (req.user && req.user.role === "student" && req.user.library_id) ||
      null;

    const query = {};
    if (libraryFilter) query.library = libraryFilter;

    let term = "";
    if (q && q.trim().length) {
      term = q.trim().toLowerCase();
      const regex = new RegExp(q.trim(), "i");
      query.$or = [
        { title: regex },
        { author: regex },
        { description: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    const ebooks = await Ebook.find(query).lean();

    const scored = ebooks
      .map((ebook) => {
        let relevance = 0;
        if (term) {
          if (ebook.title?.toLowerCase().includes(term)) relevance += 5;
          if (ebook.category?.toLowerCase().includes(term)) relevance += 3;
          if (ebook.description?.toLowerCase().includes(term)) relevance += 2;
          if (ebook.tags && Array.isArray(ebook.tags)) {
            if (
              ebook.tags.some((t) => String(t).toLowerCase().includes(term))
            ) {
              relevance += 2;
            }
          }
        }
        const popularity =
          typeof ebook.popularityScore === "number" ? ebook.popularityScore : 0;
        const score = relevance * 2 + popularity;
        return { ...ebook, score };
      })
      .sort((a, b) => b.score - a.score);

    // Identify top matches (direct hits)
    const topMatches = scored.filter((s) => s.score > 5).slice(0, 5);
    
    // Find related books (same category as the TOP result)
    let relatedBooks = [];
    if (topMatches.length > 0) {
      const topCategory = topMatches[0].category;
      const topTags = topMatches[0].tags || [];
      const topId = String(topMatches[0]._id);

      const relatedQuery = { 
        _id: { $ne: topId },
        library: libraryFilter 
      };
      
      if (topCategory) {
        relatedQuery.category = topCategory;
      }

      // Find up to 5 books in the same category that aren't in topMatches
      const candidates = await Ebook.find(relatedQuery).limit(10).lean();
      const topMatchIds = new Set(topMatches.map(m => String(m._id)));
      
      relatedBooks = candidates
        .filter(c => !topMatchIds.has(String(c._id)))
        .map(c => {
          // Calculate relationship rank
          let relationshipRank = 3; // base for same category
          if (topTags.some(t => c.tags?.includes(t))) relationshipRank += 2;
          return { ...c, relationshipRank };
        })
        .sort((a, b) => b.relationshipRank - a.relationshipRank)
        .slice(0, 5);
    }

    res.json({
      topMatches,
      relatedBooks
    });
  } catch (error) {
    console.error("Failed to search ebooks", error);
    res.status(500).json({ error: "Failed to search ebooks" });
  }
});

// Increment popularity when a student opens/reads an ebook
router.post("/:id/popularity", auth, async (req, res) => {
  try {
    const ebook = await Ebook.findByIdAndUpdate(
      req.params.id,
      { $inc: { popularityScore: 1 } },
      { new: true },
    );
    res.json(ebook);
  } catch (error) {
    res.status(400).json({ error: "Failed to update popularity" });
  }
});

module.exports = router;
