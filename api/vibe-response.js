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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
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

  return new Response(JSON.stringify(response), { headers });
} 