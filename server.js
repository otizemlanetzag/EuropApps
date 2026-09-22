import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return res.status(500).json({error:"MISTRAL_API_KEY is not configured. Copy .env.example to .env and add your key."});
  const {prompt, model="mistral-small-latest"} = req.body || {};
  if (!prompt || typeof prompt !== "string") return res.status(400).json({error:"A prompt is required."});

  const system = "You are EuropApps, an AI app creator. Turn the user's idea into a practical web app starter. Return valid JSON with exactly these keys: name, description, features, files. features is an array of strings. files is an array of objects with path and content. Prefer a small self-contained HTML/CSS/JS app unless another stack is requested. Make generated code runnable.";

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method:"POST",
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        model, temperature:0.2, response_format:{type:"json_object"},
        messages:[{role:"system",content:system},{role:"user",content:prompt}]
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({error:data?.message || data?.error?.message || "Mistral API request failed."});
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({error:"Mistral returned no content."});
    try { return res.json(JSON.parse(content)); }
    catch { return res.status(502).json({error:"Mistral returned invalid JSON.",raw:content}); }
  } catch (error) {
    return res.status(500).json({error:error.message || "Server error."});
  }
});

app.listen(PORT, () => console.log("EuropApps running on http://localhost:"+PORT));
