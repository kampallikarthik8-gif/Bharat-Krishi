import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with 10MB limit for image uploads/base64
  app.use(express.json({ limit: "10mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Ephemeral key/token fetch for live audio connections
  app.get("/api/gemini/token", (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
    }
    res.json({ token: apiKey });
  });

  // Server-side Gemini proxy endpoint
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
      }

      const { model = "gemini-3.6-flash", contents, config } = req.body;
      if (!contents) {
        return res.status(400).json({ error: "Missing 'contents' in request body." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      res.json({
        text: response.text,
        candidates: response.candidates,
      });
    } catch (error: any) {
      console.error("[Server Gemini Proxy Error]", error);
      const isQuota = error?.status === 429 || 
                      error?.message?.includes("RESOURCE_EXHAUSTED") || 
                      error?.message?.includes("spending cap") || 
                      error?.message?.includes("quota");
      res.status(isQuota ? 429 : 500).json({
        error: error?.message || "Failed to generate AI response.",
        status: error?.status || (isQuota ? 429 : 500),
        quotaExceeded: isQuota
      });
    }
  });

  // Server-side Gemini Chat proxy endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
      }

      const { model = "gemini-3.6-flash", message, systemInstruction } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing 'message' in request body." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const chat = ai.chats.create({
        model,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const response = await chat.sendMessage({ message });

      res.json({
        text: response.text,
        candidates: response.candidates,
      });
    } catch (error: any) {
      console.error("[Server Gemini Chat Proxy Error]", error);
      const isQuota = error?.status === 429 || 
                      error?.message?.includes("RESOURCE_EXHAUSTED") || 
                      error?.message?.includes("spending cap") || 
                      error?.message?.includes("quota");
      res.status(isQuota ? 429 : 500).json({
        error: error?.message || "Failed to send chat message.",
        status: error?.status || (isQuota ? 429 : 500),
        quotaExceeded: isQuota
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Bharat Kisan Server] Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Bharat Kisan Server] Failed to start:", err);
  process.exit(1);
});
