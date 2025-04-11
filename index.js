module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
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
      post_url: "https://vibecheck-eight.vercel.app/api/vibe"
    };
    
    res.json(frame);
  } else if (req.method === 'POST') {
    const response = {
      version: "vNext",
      name: "Vibe Check Response",
      image: "https://placekitten.com/600/400",
      buttons: [
        { label: "Thanks for your vibe! 🌟", action: "post" }
      ]
    };
    
    res.json(response);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
