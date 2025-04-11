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

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // TODO: Add MongoDB integration here
  const response = {
    version: "vNext",
    name: "Vibe Check Response",
    image: "https://placekitten.com/600/400",
    buttons: [
      { label: "Thanks for your vibe! 🌟", action: "post" }
    ]
  };

  res.status(200).json(response);
} 