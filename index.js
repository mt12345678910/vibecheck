import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  const frame = {
    version: "vNext",
    name: "Vibe Check",
    image: "https://placekitten.com/600/400",
    buttons: [
      { label: "🌞", action: "post" },
      { label: "😴", action: "post" },
      { label: "😩", action: "post" },
      { label: "💀", action: "post" },
      { label: "🌀", action: "post" }
    ],
    post_url: "https://your-vercel-app.com/vibe-response"
  };

  res.json(frame);
});

app.listen(port, () => {
  console.log(`Vibe Check Frame running at http://localhost:${port}`);
});
