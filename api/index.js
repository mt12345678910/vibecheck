export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
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

  return new Response(JSON.stringify(frame), { headers });
} 