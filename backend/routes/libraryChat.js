const express = require("express");
const { auth } = require("../middleware/auth");
const router = express.Router();

// NOTE: This route expects an environment variable OPENAI_API_KEY.
// It uses the OpenAI Chat Completions API to act as a library assistant.

router.post("/ask", auth, async (req, res) => {
  const { question, context } = req.body || {};

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "Library assistant is not configured. Please set OPENAI_API_KEY on the server.",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful university library assistant. Help students find books, understand subjects, and navigate the digital library. If you don't know something, say so honestly.",
          },
          {
            role: "user",
            content: `Student question: ${question}. Additional context (may be empty): ${
              context ? JSON.stringify(context).slice(0, 2000) : "none"
            }`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return res
        .status(502)
        .json({ error: "Library assistant is unavailable right now" });
    }

    const data = await response.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a helpful answer.";

    res.json({ answer });
  } catch (error) {
    console.error("Failed to call OpenAI", error);
    res.status(500).json({ error: "Failed to contact library assistant" });
  }
});

module.exports = router;
