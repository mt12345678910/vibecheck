export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

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
    post_url: "https://vibecheck-eight.vercel.app/api/vibe-response"
  };

  res.status(200).json(frame);
} 