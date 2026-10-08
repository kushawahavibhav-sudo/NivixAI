// api/image.js  (Vercel serverless function)
// Needs the environment variable GEMINI_API_KEY (Vercel -> Settings -> Environment Variables), then redeploy.
export const config = { maxDuration: 60 }; // image generation can take 10-30s

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const prompt = String((req.body && req.body.prompt) || "").trim();
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" });
  }

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const d = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: (d.error && d.error.message) || "Gemini error " + r.status });
    }

    const parts =
      (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
    const imgPart = parts.find((p) => p.inlineData || p.inline_data);
    const inl = imgPart && (imgPart.inlineData || imgPart.inline_data);
    const text = parts.filter((p) => p.text).map((p) => p.text).join("\n");

    if (!inl) {
      const why =
        (d.promptFeedback && d.promptFeedback.blockReason) ||
        text ||
        "The model returned no image (the prompt may have been blocked)";
      return res.status(422).json({ error: why });
    }

    return res.status(200).json({
      image: `data:${inl.mimeType || inl.mime_type || "image/png"};base64,${inl.data}`,
      text,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
