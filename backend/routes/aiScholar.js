const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Ebook = require("../models/Ebook");
const ScheduleEntry = require("../models/ScheduleEntry");
const Desktop = require("../models/Desktop");

/**
 * Helper to get Gemini client with fresh env variables
 */
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

/**
 * @route GET /api/ai/ping
 * @desc  Diagnostic health check
 */
router.get("/ping", (req, res) => {
  const g = getGenAI();
  console.log("AI Scholar Ping diagnostics received. Key present:", !!g);
  res.json({ 
    status: "online", 
    hasApiKey: !!g,
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : "none"
  });
});

/**
 * @route POST /api/ai/chat
 * @desc  Connect with AI Scholar using project book data
 */
router.post("/chat", async (req, res) => {
  const { message, history } = req.body;
  const genAI = getGenAI();

  if (!genAI) {
    console.error("AI Scholar Error: GEMINI_API_KEY missing in .env");
    return res.status(500).json({ 
      error: "Gemini API key is missing. Please add GEMINI_API_KEY to your .env file." 
    });
  }

  try {
    // 1. Fetch available books to provide context
    const ebooks = await Ebook.find().limit(50).select("title author category description popularityScore");
    
    // 2. Fetch today's available slots (Smart Study Planner logic)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const slots = await ScheduleEntry.find({ 
      date: today, 
      student_id: null 
    }).populate("desktop_id", "desktop_id").limit(10);

    // 3. Format books for the system prompt
    const bookContext = ebooks.map(b => 
      `- ${b.title} by ${b.author} [Category: ${b.category}]`
    ).join("\n");

    const slotContext = slots.map(s => 
      `- ${s.desktop_id?.desktop_id || "Terminal"}: ${s.start_time} - ${s.end_time} [ID: ${s._id}]`
    ).join("\n");

    // 4. Define the Scholar Persona with Scheduling awareness
    const systemPrompt = `
      You are the "ASTU Digital AI Scholar," a smart, professional research assistant.
      
      KNOWLEDGE BASE (BOOKS):
      ${bookContext}
      
      AVAILABLE STUDY UPLINKS (TERMINALS) FOR TODAY (${today}):
      ${slotContext || "No terminals available today. Suggest checking tomorrow."}
      
      YOUR MISSIONS:
      1. Recommend books from the inventory.
      2. If a student wants to study, look at the AVAILABLE STUDY UPLINKS.
      3. CRITICAL: When suggesting a specific slot, ALWAYS use this exact format at the beginning or end of your helpful response:
         [SLOT_SUGGESTION: { "slotId": "ID", "terminal": "NAME", "time": "TIME" }]
         This allows the student to "Fast-Track" the reservation.
      
      Example Suggestion:
      "Terminal 01 is free from 09:00 to 10:00. [SLOT_SUGGESTION: { "slotId": "65f...", "terminal": "Terminal 01", "time": "09:00 - 10:00" }]"
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 5. Prepare chat session
    console.log("Starting Gemini chat session...");
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am the ASTU Digital AI Scholar. I will assist students based on the library inventory and terminal availability provided." }] },
        ...(history || []).map(h => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        }))
      ],
    });

    console.log("Sending message to Gemini:", message);
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini response received successfully.");

    res.json({ content: text });
  } catch (error) {
    console.error("AI Scholar Error Details:", error);
    res.status(500).json({ 
      error: "AI_SYNC_FAILED", 
      message: error.message || "Failed to connect with the AI Scholar.",
      details: error.stack
    });
  }
});

module.exports = router;
