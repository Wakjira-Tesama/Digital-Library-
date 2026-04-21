const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth, requireRole } = require("../middleware/auth");

const User = require("../models/User");
const Library = require("../models/Library");
const Desktop = require("../models/Desktop");
const Session = require("../models/Session");
const IssueReport = require("../models/IssueReport");
const ScheduleEntry = require("../models/ScheduleEntry");
const Announcement = require("../models/Announcement");
const AdminChatMessage = require("../models/AdminChatMessage");
const Ebook = require("../models/Ebook");

const router = express.Router();
// In-memory upload instance for small form payloads (no files persisted)
const upload = multer();

// Disk storage for chat attachments and announcement images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.join(__dirname, "..", "uploads");
    let subDir = "misc";
    if (file.fieldname === "chat_file") subDir = "chat";
    if (file.fieldname === "announcement_image") subDir = "announcements";

    const dest = path.join(baseDir, subDir);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileUpload = multer({ storage });

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "1d" },
  );
}

async function seedDefaults() {
  const count = await Library.countDocuments();
  if (count === 0) {
    await Library.insertMany([
      { name: "Applied Library" },
      { name: "Central Library" },
      { name: "Engineering Library" },
    ]);
  }
  // General admin account
  const adminEmail = "admin@astu.edu.et";
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const password = await bcrypt.hash("adminpassword", 10);
    await User.create({
      student_id: "ADMIN-001",
      name: "System Admin",
      email: adminEmail,
      password,
      role: "general_admin",
    });
  }

  // Librarian accounts for initial libraries ONLY when a library
  // has no librarian yet. This avoids overwriting librarian
  // accounts that were explicitly created by the general admin.
  const libs = await Library.find();
  const librarianPasswordPlain = "Lib@1234";
  const librarianPassword = await bcrypt.hash(librarianPasswordPlain, 10);

  for (const lib of libs) {
    const existingLibrarian = await User.findOne({
      role: "librarian",
      library_id: lib._id,
    });

    if (!existingLibrarian) {
      const base = lib.name.split(" ")[0].toLowerCase();
      const email = `${base}.librarian@astu.edu.et`;

      await User.create({
        student_id: `LIB-${base.toUpperCase()}-001`,
        name: `${lib.name} Librarian`,
        email,
        password: librarianPassword,
        role: "librarian",
        library_id: lib._id,
      });
    }
  }

  // Seed a few desktops per library if none exist yet
  for (const lib of libs) {
    const existingDesktop = await Desktop.findOne({ library_id: lib._id });
    if (existingDesktop) continue;

    const prefix = lib.name.split(" ")[0].toUpperCase().slice(0, 3);
    const desktopsToCreate = [];
    for (let i = 1; i <= 5; i += 1) {
      const index = String(i).padStart(2, "0");
      desktopsToCreate.push({
        desktop_id: `${prefix}-${index}`,
        ip_address: `10.0.${i}.10`,
        mac_address: `00:11:22:33:44:${index}`,
        status: "available",
        library_id: lib._id,
      });
    }
    await Desktop.insertMany(desktopsToCreate);
  }

  // Seed a small set of demo ebooks for the first library so that
  // students immediately see content in the E-book dashboard. This
  // only runs when there are no ebooks yet.
  const ebookCount = await Ebook.countDocuments();
  if (ebookCount === 0 && libs.length > 0) {
    const primaryLib = libs[0];
    await Ebook.insertMany([
      {
        title: "Organic Chemistry Basics",
        author: "A. Student",
        description:
          "Foundational topics in organic chemistry with clear explanations and diagrams.",
        category: "Chemistry",
        tags: ["chemistry", "organic", "first year"],
        library: primaryLib._id,
        coverUrl: "/covers/organic-chemistry.svg",
      },
      {
        title: "Calculus Fundamentals",
        author: "J. Scholar",
        description:
          "Limits, derivatives, and integrals with plenty of worked examples.",
        category: "Mathematics",
        tags: ["calculus", "analysis"],
        library: primaryLib._id,
        coverUrl: "/covers/calculus.svg",
      },
      {
        title: "Algorithms and Data Structures",
        author: "C. Developer",
        description:
          "An introduction to classic algorithms and data structures in a practical way.",
        category: "Computer Science",
        tags: ["algorithms", "data structures", "programming"],
        library: primaryLib._id,
        coverUrl: "/covers/algorithms.svg",
      },
      {
        title: "Physics for Engineers",
        author: "D. Researcher",
        description:
          "Mechanics, waves, and electromagnetism with applications to engineering.",
        category: "Physics",
        tags: ["physics", "mechanics", "engineering"],
        library: primaryLib._id,
        coverUrl: "/covers/physics.svg",
      },
      {
        title: "Linear Algebra Essentials",
        author: "L. Analyst",
        description:
          "Vectors, matrices, eigenvalues, and applications to data science.",
        category: "Mathematics",
        tags: ["linear algebra", "matrices"],
        library: primaryLib._id,
        coverUrl: "/covers/linear-algebra.svg",
      },
      {
        title: "Programming with Python",
        author: "P. Engineer",
        description:
          "Gentle introduction to Python with examples from scientific computing.",
        category: "Programming",
        tags: ["python", "coding", "intro"],
        library: primaryLib._id,
        coverUrl: "/covers/python.svg",
      },
    ]);
  }
}

router.get("/health", async (req, res) => {
  try {
    await seedDefaults();
    res.json({ ok: true, db: "connected" });
  } catch {
    res.json({ ok: true, db: "disconnected" });
  }
});

// Python-compatible login endpoint: /token with form-data username/password
router.post("/token", upload.none(), async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Ensure default admin, librarians, and desktops exist before login
  try {
    await seedDefaults();
  } catch (e) {
    // If seeding fails, still attempt login with whatever data exists
    // but log the error for debugging.
    // eslint-disable-next-line no-console
    console.error("seedDefaults failed during /token login", e);
  }

  const user = await User.findOne({
    $or: [{ email: username }, { student_id: username }],
  });
  if (!user)
    return res
      .status(401)
      .json({ detail: "User not found for given email/ID" });

  const valid = await bcrypt.compare(password || "", user.password || "");
  if (!valid)
    return res
      .status(401)
      .json({ detail: "Password is incorrect for this account" });

  const access_token = signToken(user);
  res.json({ access_token, token_type: "bearer", role: user.role });
});

// Python-compatible endpoint: /me
router.get("/me", auth, async (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    student_id: u.student_id,
    name: u.name,
    email: u.email,
    role: u.role,
    is_admin: u.role === "general_admin" || u.role === "librarian",
    library_id: u.library_id,
  });
});

// Python-compatible endpoint: /students/ (multipart from frontend register)
router.post("/students/", upload.any(), async (req, res) => {
  try {
    const { student_id, name, email } = req.body;
    if (!student_id || !name || !email)
      return res.status(400).json({ detail: "Missing required fields" });

    // Require that an ID image is uploaded, but rely on
    // the frontend to have already verified the match.
    const idFile =
      (req.files || []).find((f) => f.fieldname === "id_image") ||
      (req.files || [])[0];

    if (!idFile || !idFile.buffer) {
      return res
        .status(400)
        .json({ detail: "ID image is required for registration" });
    }

    const exists = await User.findOne({ $or: [{ email }, { student_id }] });
    if (exists) return res.status(409).json({ detail: "User already exists" });

    const password = await bcrypt.hash("studentpassword", 10);
    const user = await User.create({
      student_id,
      name,
      email,
      password,
      role: "student",
    });

    res.status(201).json({
      id: user._id,
      student_id: user.student_id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_admin: false,
      library_id: user.library_id,
    });
  } catch (err) {
    console.error("Student registration failed", err);
    // Surface more precise error messages when possible
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ detail: "User already exists (duplicate ID or email)" });
    }
    res.status(500).json({ detail: err?.message || "Registration failed" });
  }
});

router.get("/students/", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }
  const users = await User.find();
  res.json(
    users.map((u) => ({
      id: u._id,
      student_id: u.student_id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_admin: u.role === "general_admin" || u.role === "librarian",
      library_id: u.library_id,
    })),
  );
});

// Python-compatible endpoint: /students/login with form-data student_id,email
router.post("/students/login", upload.none(), async (req, res) => {
  const { student_id, email } = req.body;
  const user = await User.findOne({ student_id, email, role: "student" });
  if (!user)
    return res.status(401).json({ detail: "Invalid student credentials" });
  const access_token = signToken(user);
  res.json({ access_token, token_type: "bearer", role: user.role });
});

// ID verification compatibility endpoint (kept simple; frontend does OCR)
router.post("/students/verify-id", upload.any(), async (req, res) => {
  const { student_id } = req.body;
  if (!student_id)
    return res.status(400).json({ detail: "student_id is required" });
  res.json({ matches: true, extracted_id: student_id });
});

// General admin endpoints compatibility
router.get(
  "/admin/libraries",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    const libs = await Library.find();
    res.json(libs.map((l) => ({ id: l._id, name: l.name })));
  },
);

router.post(
  "/admin/libraries",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    let lib;
    try {
      const {
        name,
        librarian_name,
        librarian_email,
        librarian_password,
        librarian_student_id,
      } = req.body;

      if (!name) {
        return res.status(400).json({ detail: "Library name is required" });
      }

      lib = await Library.create({ name });

      // Optionally create a linked librarian account when
      // the general admin provides credentials.
      let librarian = null;
      if (librarian_email && librarian_password) {
        const hashed = await bcrypt.hash(librarian_password, 10);
        const base = name.split(" ")[0].toUpperCase();
        const studentIdFallback = `LIB-${base}-001`;

        librarian = await User.create({
          name: librarian_name || `${name} Librarian`,
          email: librarian_email,
          student_id: librarian_student_id || studentIdFallback,
          password: hashed,
          role: "librarian",
          library_id: lib._id,
        });
      }

      return res.status(201).json({
        id: lib._id,
        name: lib.name,
        librarian: librarian
          ? {
              id: librarian._id,
              student_id: librarian.student_id,
              name: librarian.name,
              email: librarian.email,
              role: librarian.role,
              library_id: librarian.library_id,
            }
          : null,
      });
    } catch (err) {
      // If librarian creation failed after library creation,
      // roll back the library to keep data consistent.
      if (lib && lib._id) {
        try {
          await Library.findByIdAndDelete(lib._id);
        } catch (cleanupErr) {
          // eslint-disable-next-line no-console
          console.error("Failed to roll back library after error", cleanupErr);
        }
      }
      // eslint-disable-next-line no-console
      console.error("Library (and librarian) creation failed", err);
      res.status(400).json({
        detail: err?.message || "Library creation failed",
      });
    }
  },
);

router.delete(
  "/admin/libraries/:library_id",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    await Library.findByIdAndDelete(req.params.library_id);
    res.json({ detail: "Library deleted" });
  },
);

router.get(
  "/admin/librarians",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    const users = await User.find({ role: "librarian" });
    res.json(
      users.map((u) => ({
        id: u._id,
        student_id: u.student_id,
        name: u.name,
        email: u.email,
        role: u.role,
        is_admin: true,
        library_id: u.library_id,
      })),
    );
  },
);

router.post(
  "/admin/librarians",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    try {
      const { name, email, student_id, password, library_id } = req.body;
      const hashed = await bcrypt.hash(password || "libpassword", 10);
      const u = await User.create({
        name,
        email,
        student_id,
        password: hashed,
        role: "librarian",
        library_id,
      });
      res.status(201).json({
        id: u._id,
        student_id: u.student_id,
        name: u.name,
        email: u.email,
        role: u.role,
        is_admin: true,
        library_id: u.library_id,
      });
    } catch {
      res.status(400).json({ detail: "Failed to add librarian" });
    }
  },
);

router.get("/libraries", async (req, res) => {
  try {
    const libs = await Library.find();
    res.json(libs.map((l) => ({ id: l._id, name: l.name })));
  } catch (err) {
    console.error("Failed to load libraries", err);
    res
      .status(500)
      .json({ detail: err?.message || "Failed to load libraries" });
  }
});

router.get("/libraries/:id", async (req, res) => {
  const l = await Library.findById(req.params.id);
  if (!l) return res.status(404).json({ detail: "Library not found" });
  res.json({ id: l._id, name: l.name });
});

router.get("/desktops/", auth, async (req, res) => {
  const library_id = req.query.library_id || req.user.library_id || null;
  const filter = library_id ? { library_id } : {};
  const items = await Desktop.find(filter);
  res.json(
    items.map((d) => ({
      id: d._id,
      desktop_id: d.desktop_id,
      ip_address: d.ip_address,
      mac_address: d.mac_address,
      status: d.status,
      library_id: d.library_id,
    })),
  );
});

router.get("/desktops/overview", auth, async (req, res) => {
  const library_id = req.query.library_id || req.user.library_id || null;
  const filter = library_id ? { library_id } : {};
  const items = await Desktop.find(filter);
  const schedule = await ScheduleEntry.find(library_id ? { library_id } : {});
  res.json({ desktops: items, schedule });
});

router.post("/desktops/", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Librarian access required" });
  }
  try {
    const payload = { ...req.body };
    // Automatically generate mac_address if missing
    if (!payload.mac_address) {
      const randomMac = "XX:XX:XX:XX:XX:XX".replace(/X/g, () => 
        "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16))
      );
      payload.mac_address = randomMac;
    }
    if (req.user.role === "librarian") payload.library_id = req.user.library_id;
    const d = await Desktop.create(payload);
    res.status(201).json({
      id: d._id,
      desktop_id: d.desktop_id,
      ip_address: d.ip_address,
      mac_address: d.mac_address,
      status: d.status,
      library_id: d.library_id,
    });
  } catch (err) {
    console.error("Failed to add desktop", err);
    res.status(400).json({ detail: "Failed to add desktop", error: err.message });
  }
});

router.delete("/desktops/:id", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Librarian access required" });
  }
  await Desktop.findByIdAndDelete(req.params.id);
  res.json({ detail: "Desktop deleted" });
});

// Python-compatible endpoint: PATCH /desktops/{id}/status
router.patch("/desktops/:id/status", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Librarian access required" });
  }

  const { status } = req.body || {};
  const allowed = ["available", "busy", "offline", "maintenance"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ detail: "Invalid status value" });
  }

  const desktop = await Desktop.findById(req.params.id);
  if (!desktop) return res.status(404).json({ detail: "Desktop not found" });

  // Librarians may only update desktops in their own library
  if (
    req.user.role === "librarian" &&
    desktop.library_id &&
    String(desktop.library_id) !== String(req.user.library_id)
  ) {
    return res.status(403).json({ detail: "Not authorized" });
  }

  desktop.status = status;
  await desktop.save();
  return res.json({
    id: desktop._id,
    desktop_id: desktop.desktop_id,
    ip_address: desktop.ip_address,
    mac_address: desktop.mac_address,
    status: desktop.status,
    library_id: desktop.library_id,
  });
});

router.get("/schedule", auth, async (req, res) => {
  const library_id = req.query.library_id || req.user.library_id || null;
  const day = req.query.day;
  const filter = {
    ...(library_id ? { library_id } : {}),
    ...(day ? { date: day } : {}),
  };
  const rows = await ScheduleEntry.find(filter);
  res.json(
    rows.map((r) => ({
      id: r._id,
      desktop_id: r.desktop_id,
      date: r.date,
      start_time: r.start_time,
      end_time: r.end_time,
      student_id: r.student_id,
      name: r.name,
      mark: r.mark,
    })),
  );
});

router.post("/schedule/register", auth, upload.none(), async (req, res) => {
  try {
    const { desktop_id, date, start_time, end_time, student_id, name } =
      req.body;
    if (!desktop_id || !date || !start_time || !end_time) {
      return res.status(400).json({ detail: "Missing schedule fields" });
    }

    const desktop = await Desktop.findById(desktop_id);
    if (!desktop) return res.status(404).json({ detail: "Desktop not found" });

    const existing = await ScheduleEntry.findOne({
      desktop_id,
      date,
      start_time,
      end_time,
    });
    if (existing && existing.student_id) {
      return res.status(409).json({ detail: "Time slot already reserved" });
    }

    const payload = {
      desktop_id,
      date,
      start_time,
      end_time,
      student_id: student_id || req.user.student_id,
      name: name || req.user.name,
      mark: null,
      library_id: desktop.library_id || req.user.library_id || null,
    };

    let saved;
    if (existing) {
      saved = await ScheduleEntry.findByIdAndUpdate(existing._id, payload, {
        new: true,
      });
    } else {
      saved = await ScheduleEntry.create(payload);
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error("Schedule registration failed", err);
    res
      .status(500)
      .json({ detail: err?.message || "Failed to register time slot" });
  }
});

router.post("/schedule/entry", auth, async (req, res) => {
  const { desktop_id, date, start_time, end_time, student_id, name, mark } =
    req.body;
  if (!desktop_id || !date || !start_time || !end_time) {
    return res.status(400).json({ detail: "Missing schedule fields" });
  }

  const desktop = await Desktop.findById(desktop_id);
  if (!desktop) return res.status(404).json({ detail: "Desktop not found" });

  const payload = {
    desktop_id,
    date,
    start_time,
    end_time,
    student_id: student_id || null,
    name: name || null,
    mark: mark || null,
    library_id: desktop.library_id || null,
  };

  const existing = await ScheduleEntry.findOne({
    desktop_id,
    date,
    start_time,
    end_time,
  });
  const saved = existing
    ? await ScheduleEntry.findByIdAndUpdate(existing._id, payload, {
        new: true,
      })
    : await ScheduleEntry.create(payload);

  res.status(201).json(saved);
});

router.get("/sessions/me", auth, async (req, res) => {
  const s = await Session.findOne({
    student_id: req.user._id,
    is_active: true,
  }).sort({ start_time: -1 });
  if (!s) return res.json(null);
  res.json({
    id: s._id,
    student_id: s.student_id,
    desktop_id: s.desktop_id,
    start_time: s.start_time,
    end_time: s.end_time,
    is_active: s.is_active,
    duration_minutes: s.duration_minutes,
  });
});

router.get("/sessions/active", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }
  const list = await Session.find({ is_active: true });
  res.json(
    list.map((s) => ({
      id: s._id,
      student_id: s.student_id,
      desktop_id: s.desktop_id,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active,
      duration_minutes: s.duration_minutes,
    })),
  );
});

// Public announcements - visible on home page without login
router.get("/announcements", async (req, res) => {
  try {
    const items = await Announcement.find().sort({ created_at: -1 }).limit(20);
    res.json(
      items.map((a) => ({
        id: a._id,
        title: a.title,
        body: a.body,
        created_at: a.created_at,
        audience: a.audience || "all_members",
        priority: a.priority || "normal",
        creator_role: a.creator_role,
        library_id: a.library_id,
        image_url: a.image_url || null,
      })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to load announcements", err);
    res
      .status(500)
      .json({ detail: err?.message || "Failed to load announcements" });
  }
});

// Upload image for announcements (admin or librarian)
router.post(
  "/admin/announcements/upload",
  auth,
  fileUpload.single("announcement_image"),
  async (req, res) => {
    if (!["general_admin", "librarian"].includes(req.user.role)) {
      return res.status(403).json({ detail: "Authorized personnel only" });
    }

    if (!req.file) {
      return res.status(400).json({ detail: "Image file is required" });
    }

    const relativePath = `/uploads/announcements/${req.file.filename}`;
    return res.status(201).json({
      url: relativePath,
      name: req.file.originalname,
      mime_type: req.file.mimetype,
    });
  },
);

// Admin + Librarian can post announcements that show on the home page
router.post("/admin/announcements", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }

  try {
    const { title, body, image_url, library_id, audience, priority } = req.body;
    if (!title || !body) {
      return res.status(400).json({ detail: "Title and body are required" });
    }

    const normalizedAudience = String(audience || "all_members").toLowerCase();
    const normalizedPriority = String(priority || "normal").toLowerCase();
    const allowedAudience = ["all_members", "students_only", "staff_only"];
    const allowedPriority = ["normal", "high", "urgent"];

    const selectedLibraryId =
      req.user.role === "librarian"
        ? req.user.library_id || null
        : library_id || null;

    const a = await Announcement.create({
      title,
      body,
      created_by: req.user._id,
      audience: allowedAudience.includes(normalizedAudience)
        ? normalizedAudience
        : "all_members",
      priority: allowedPriority.includes(normalizedPriority)
        ? normalizedPriority
        : "normal",
      creator_role:
        req.user.role === "librarian" ? "librarian" : "general_admin",
      library_id: selectedLibraryId,
      image_url: image_url || null,
    });

    res.status(201).json({
      id: a._id,
      title: a.title,
      body: a.body,
      created_at: a.created_at,
      audience: a.audience || "all_members",
      priority: a.priority || "normal",
      creator_role: a.creator_role,
      library_id: a.library_id,
      image_url: a.image_url || null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to create announcement", err);
    res
      .status(400)
      .json({ detail: err?.message || "Failed to create announcement" });
  }
});

// Upload attachments for admin chat (admin or librarian)
router.post(
  "/admin/chat/upload",
  auth,
  fileUpload.single("chat_file"),
  async (req, res) => {
    if (!["general_admin", "librarian"].includes(req.user.role)) {
      return res.status(403).json({ detail: "Authorized personnel only" });
    }

    if (!req.file) {
      return res.status(400).json({ detail: "File is required" });
    }

    const relativePath = `/uploads/chat/${req.file.filename}`;
    return res.status(201).json({
      url: relativePath,
      name: req.file.originalname,
      mime_type: req.file.mimetype,
    });
  },
);

router.delete(
  "/admin/announcements/:id",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    try {
      await Announcement.findByIdAndDelete(req.params.id);
      res.json({ detail: "Announcement deleted" });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete announcement", err);
      res
        .status(400)
        .json({ detail: err?.message || "Failed to delete announcement" });
    }
  },
);

// Simple chat between librarians and general admin
router.get("/admin/chat/messages", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }
  let filter = {};

  if (req.user.role === "librarian" && req.user.library_id) {
    // Librarian: private 1:1 chat with general admin for their library
    const libId = req.user.library_id;
    filter = {
      $or: [
        { from_role: "librarian", library_id: libId },
        { target_role: "librarian", target_library_id: libId },
      ],
    };
  }

  if (req.user.role === "general_admin") {
    const libId = req.query.library_id;
    if (!libId) {
      // No library selected yet; return empty list
      return res.json([]);
    }
    filter = {
      $or: [
        { from_role: "librarian", library_id: libId },
        { target_role: "librarian", target_library_id: libId },
      ],
    };
  }

  try {
    const items = await AdminChatMessage.find(filter)
      .sort({ created_at: 1 })
      .limit(100);
    res.json(
      items.map((m) => ({
        id: m._id,
        from_name: m.from_name,
        from_role: m.from_role,
        library_id: m.library_id,
        category: m.category,
        message: m.message,
        status: m.status,
        attachment_url: m.attachment_url || null,
        attachment_name: m.attachment_name || null,
        attachment_type: m.attachment_type || null,
        created_at: m.created_at,
      })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to load admin chat messages", err);
    res
      .status(500)
      .json({ detail: err?.message || "Failed to load chat messages" });
  }
});

router.post("/admin/chat/messages", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }
  const {
    message,
    category,
    target_library_id,
    attachment_url,
    attachment_name,
    attachment_type,
  } = req.body;

  if ((!message || !message.trim()) && !attachment_url) {
    return res
      .status(400)
      .json({ detail: "Message text or attachment is required" });
  }

  if (req.user.role === "general_admin" && !target_library_id) {
    return res
      .status(400)
      .json({ detail: "target_library_id is required for admin messages" });
  }

  try {
    const isLibrarian = req.user.role === "librarian";
    const doc = await AdminChatMessage.create({
      from: req.user._id,
      from_name: req.user.name,
      from_role: req.user.role,
      library_id: req.user.library_id || null,
      category: category || "General",
      status: "open",
      message: message ? message.trim() : "",
      target_role: isLibrarian ? "general_admin" : "librarian",
      target_library_id: isLibrarian
        ? null
        : target_library_id || req.body.target_library_id || null,
      attachment_url: attachment_url || null,
      attachment_name: attachment_name || null,
      attachment_type: attachment_type || null,
    });

    res.status(201).json({
      id: doc._id,
      from_name: doc.from_name,
      from_role: doc.from_role,
      library_id: doc.library_id,
      category: doc.category,
      message: doc.message,
      status: doc.status,
      attachment_url: doc.attachment_url || null,
      attachment_name: doc.attachment_name || null,
      attachment_type: doc.attachment_type || null,
      created_at: doc.created_at,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to create admin chat message", err);
    res.status(400).json({ detail: err?.message || "Failed to send message" });
  }
});

// General admin can update the status of a reported item
router.patch(
  "/admin/chat/messages/:id/status",
  auth,
  requireRole("general_admin"),
  async (req, res) => {
    const { status } = req.body;
    const allowed = ["open", "approved", "in_progress", "resolved", "info"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ detail: "Invalid status value" });
    }

    try {
      const doc = await AdminChatMessage.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true },
      );
      if (!doc) {
        return res.status(404).json({ detail: "Message not found" });
      }
      res.json({
        id: doc._id,
        from_name: doc.from_name,
        from_role: doc.from_role,
        library_id: doc.library_id,
        category: doc.category,
        message: doc.message,
        status: doc.status,
        created_at: doc.created_at,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to update chat message status", err);
      res
        .status(400)
        .json({ detail: err?.message || "Failed to update status" });
    }
  },
);

router.post("/sessions/:session_id/end", auth, async (req, res) => {
  const s = await Session.findById(req.params.session_id);
  if (!s) return res.status(404).json({ detail: "Session not found" });

  const isOwner = String(s.student_id) === String(req.user._id);
  const isAdmin = ["general_admin", "librarian"].includes(req.user.role);
  if (!isOwner && !isAdmin)
    return res.status(403).json({ detail: "Not authorized" });

  s.is_active = false;
  s.end_time = new Date();
  await s.save();
  res.json({
    id: s._id,
    student_id: s.student_id,
    desktop_id: s.desktop_id,
    start_time: s.start_time,
    end_time: s.end_time,
    is_active: s.is_active,
    duration_minutes: s.duration_minutes,
  });
});

router.get("/analytics/stats", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }

  const library_id = req.query.library_id || req.user.library_id || null;
  const filter = library_id ? { library_id } : {};

  const totalDesktops = await Desktop.countDocuments(filter);
  const availableDesktops = await Desktop.countDocuments({
    ...filter,
    status: "available",
  });
  const busyDesktops = await Desktop.countDocuments({
    ...filter,
    status: "busy",
  });
  const offlineDesktops = await Desktop.countDocuments({
    ...filter,
    status: "offline",
  });

  const totalSessions = await Session.countDocuments();
  const activeSessions = await Session.countDocuments({ is_active: true });

  res.json({
    desktops: {
      total: totalDesktops,
      available: availableDesktops,
      busy: busyDesktops,
      offline: offlineDesktops,
    },
    sessions: {
      total: totalSessions,
      active: activeSessions,
    },
  });
});

router.get("/issues", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }
  const library_id = req.query.library_id || req.user.library_id || null;
  const list = await IssueReport.find(library_id ? { library_id } : {});
  res.json(
    list.map((i) => ({
      id: i._id,
      student_id: i.student_id,
      desktop_id: i.desktop_id,
      description: i.description,
      category: i.category || null,
      created_at: i.created_at,
      library_id: i.library_id,
    })),
  );
});

router.delete("/issues/:id", auth, async (req, res) => {
  if (!["general_admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({ detail: "Authorized personnel only" });
  }
  await IssueReport.findByIdAndDelete(req.params.id);
  res.json({ detail: "Issue resolved and deleted" });
});

router.post("/issues/report", auth, async (req, res) => {
  const desktop = req.body.desktop_id
    ? await Desktop.findById(req.body.desktop_id)
    : null;
  const issue = await IssueReport.create({
    student_id: req.user._id,
    desktop_id: req.body.desktop_id || null,
    description: req.body.description || "No description provided",
    category: req.body.category || null,
    library_id:
      req.body.library_id || desktop?.library_id || req.user.library_id || null,
  });

  res.status(201).json({
    id: issue._id,
    student_id: issue.student_id,
    desktop_id: issue.desktop_id,
    description: issue.description,
    category: issue.category || null,
    created_at: issue.created_at,
    library_id: issue.library_id,
  });
});

module.exports = router;
