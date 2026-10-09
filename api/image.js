// api/image.js  (Vercel serverless function, Cloudflare Workers AI / Flux)
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const prompt = String((req.body && req.body.prompt) || "").trim().slice(0, 2000);
  if (!prompt) return res.status(400).json({ error: { message: "Missing prompt" } });

  const { CLOUDFLARE_ACCOUNT_ID: acc, CLOUDFLARE_API_TOKEN: token } = process.env;
  if (!acc || !token) {
    return res.status(500).json({ error: { message: "Cloudflare keys are not set on the server" } });
  }

  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, steps: 4 }),
      }
    );

    const data = await r.json().catch(() => ({}));

    if (!r.ok || !data.result || !data.result.image) {
      const msg =
        (data.errors && data.errors[0] && data.errors[0].message) ||
        "Image generation failed (HTTP " + r.status + ")";
      return res.status(r.ok ? 502 : r.status).json({ error: { message: msg } });
    }

    return res.status(200).json({
      image: `data:image/jpeg;base64,${data.result.image}`,
      text: "",
    });
  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
