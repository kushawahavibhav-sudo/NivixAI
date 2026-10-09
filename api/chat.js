// api/chat.js  (Vercel serverless function, proxies to Groq)
export const config = { maxDuration: 60 };

// Keep in sync with the MODELS list in index.html
const ALLOWED = new Set([
  "openai/gpt-oss-20b",
  "meta-llama/llama-prompt-guard-2-22m",
  "qwen/qwen3.8-27b",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set on the server" });
  }
  const { model, messages, temperature, max_tokens, stream } = req.body || {};
  if (!ALLOWED.has(model)) return res.status(400).json({ error: "Model not allowed" });
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Missing messages" });
  }
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 2),
        max_tokens: Math.min(Number(max_tokens) || 1024, 4096),
        ...(stream ? { stream: true } : {}),
      }),
    });

    // Stream SSE through when requested
    if (stream && r.ok && r.body) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } finally {
        res.end();
      }
      return;
    }

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(r.status).json({ error: (d.error && d.error.message) || "Groq error " + r.status });
    }
    return res.status(200).json(d); // same shape the frontend already expects (choices[0].message.content)
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
