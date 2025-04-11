import 'dotenv/config';
import express from 'express';
import { 
  saveVote, 
  getVotesForDate, 
  resetVotesForDate, 
  getCurrentDateString,
  connectToDatabase
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Define mood data
const moods = [
    { mood: 'Happy', emoji: '😊' },
    { mood: 'Down', emoji: '😢' },
    { mood: 'Motivated', emoji: '😤' },
    { mood: 'Thoughtful', emoji: '🤔' },
    { mood: 'Excited', emoji: '🤩' }
];

// Middleware to parse request bodies (needed for frame actions)
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

// Test MongoDB connection route
app.get('/test-db', async (req, res) => {
  try {
    const db = await connectToDatabase();
    res.json({ message: 'Successfully connected to MongoDB!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  }
});

// Function to get the base URL
const getBaseUrl = (req) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    if (process.env.BASE_URL) {
        return process.env.BASE_URL.replace(/\/$/, '');
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
    }
    return `${protocol}://${host}`;
};

// Login route
app.get('/login', (req, res) => {
    const baseUrl = getBaseUrl(req);
    const frameImageUrl = `${baseUrl}/image?text=Welcome+to+Vibe+Check!%0A%0APlease+login+to+continue&t=${Date.now()}`;
    
    const frameHtml = `<!DOCTYPE html>
<html>
<head>
    <meta property="og:title" content="Vibe Check - Login">
    <meta property="fc:frame" content="vNext">
    <meta property="fc:frame:image" content="${frameImageUrl}">
    <meta property="fc:frame:button:1" content="Login with Farcaster">
    <meta property="fc:frame:button:1:action" content="post">
    <meta property="fc:frame:button:1:target" content="${baseUrl}/">
    <meta property="fc:frame:button:2" content="Learn More">
    <meta property="fc:frame:button:2:action" content="link">
    <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/channels/vibe-check">
</head>
<body>Vibe Check Frame Login</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(frameHtml);
});

// Route for the initial frame (GET)
app.get('/', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    const frameImageUrl = `${baseUrl}/image?text=Vibe+Check!%0A%0AChoose+your+mood&t=${Date.now()}`;
    const postUrl = `${baseUrl}/action`;

    let frameHtml = `<!DOCTYPE html>
<html>
<head>
    <meta property="og:title" content="Vibe Check">
    <meta property="fc:frame" content="vNext">
    <meta property="fc:frame:image" content="${frameImageUrl}">
    <meta property="fc:frame:post_url" content="${postUrl}">`;

    moods.forEach((mood, index) => {
        frameHtml += `
    <meta property="fc:frame:button:${index + 1}" content="${mood.emoji} ${mood.mood}">`;
    });

    frameHtml += `
</head>
<body>Vibe Check Frame Server</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(frameHtml);
});

// Action route (POST)
app.post('/action', async (req, res) => {
    const baseUrl = getBaseUrl(req);
    try {
        // TODO: Add validation for the incoming frame message (e.g., using Neynar)
        const { untrustedData } = req.body;
        const buttonIndex = untrustedData?.buttonIndex;
        const fid = untrustedData?.fid;

        if (!buttonIndex || !fid || buttonIndex < 1 || buttonIndex > moods.length) {
            return res.status(400).send('Invalid request data');
        }

        const selectedMoodIndex = buttonIndex - 1; // Adjust to 0-based index
        const selectedMood = moods[selectedMoodIndex];

        // Save the vote to the database
        await saveVote(fid, selectedMoodIndex);
        
        // Get current votes for display (optional)
        const currentDate = getCurrentDateString();
        const todayVotes = await getVotesForDate(currentDate);
        console.log(`Today's votes (${currentDate}):`, todayVotes);

        // Respond with a frame showing the selected mood
        const responseImageUrl = `${baseUrl}/image?text=You+chose:+${encodeURIComponent(selectedMood.emoji)}%0AThanks+for+voting!&t=${Date.now()}`;
        const frameHtml = `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext">
    <meta property="fc:frame:image" content="${responseImageUrl}">
    <meta property="fc:frame:button:1" content="View Results">
    <meta property="fc:frame:button:1:action" content="link">
    <meta property="fc:frame:button:1:target" content="${baseUrl}/admin?secret=${process.env.ADMIN_SECRET}">
    <meta property="fc:frame:button:2" content="Try Again">
    <meta property="fc:frame:button:2:action" content="post">
    <meta property="fc:frame:button:2:target" content="${baseUrl}/"> 
</head>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(frameHtml);

    } catch (error) {
        console.error("Error handling action:", error);
        res.status(500).send('Internal Server Error');
    }
});

// Image generation route
app.get('/image', (req, res) => {
    const text = req.query.text || 'Vibe Check!';
    const imageUrl = `https://placehold.co/600x400/17101F/FFFFFF/?text=${encodeURIComponent(text.replace(/\n/g, '%0A'))}`;
    res.setHeader('Content-Type', 'image/png');
    res.redirect(302, imageUrl);
});

// --- Helper Functions ---
async function calculateDailyResults() {
    const currentDate = getCurrentDateString();
    const votes = await getVotesForDate(currentDate);
    
    const results = {};
    moods.forEach((_, index) => { results[index] = 0; }); // Initialize counts
    
    for (const vote of votes) {
        const moodIndex = vote.moodIndex;
        if (results[moodIndex] !== undefined) {
            results[moodIndex]++;
        }
    }
    
    return results;
}

// --- Vercel Cron Job Endpoints ---
// These endpoints will be called by Vercel's cron job system

// Reset data endpoint (to be called by Vercel cron job at midnight UTC)
app.get('/api/cron/reset', async (req, res) => {
    // Verify the request is from Vercel's cron system
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const currentDate = getCurrentDateString();
        console.log(`Resetting votes for date: ${currentDate}`);
        
        // Reset votes for the current date
        const result = await resetVotesForDate(currentDate);
        
        res.status(200).json({ 
            success: true, 
            message: `Daily data reset successfully for ${currentDate}`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error resetting daily data:", error);
        res.status(500).json({ error: 'Failed to reset daily data' });
    }
});

// Announce mood endpoint (to be called by Vercel cron job at 8:00 PM UTC)
app.get('/api/cron/announce', async (req, res) => {
    // Verify the request is from Vercel's cron system
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const finalResults = await calculateDailyResults();
        console.log("Final Daily Results:", finalResults);

        let winningMoodIndex = -1;
        let maxVotes = -1;

        for (const moodIndex in finalResults) {
            if (finalResults[moodIndex] > maxVotes) {
                maxVotes = finalResults[moodIndex];
                winningMoodIndex = parseInt(moodIndex, 10);
            }
        }

        if (winningMoodIndex !== -1) {
            const winningMood = moods[winningMoodIndex];
            console.log(`Today's mood is: ${winningMood.emoji} ${winningMood.mood} with ${maxVotes} votes.`);
            // TODO: Post a cast or send notification with winningMood.emoji, winningMood.mood
        } else {
            console.log("No votes recorded today.");
            // TODO: Post a default message?
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Daily mood announced successfully',
            winningMood: winningMoodIndex !== -1 ? moods[winningMoodIndex] : null,
            voteCount: maxVotes
        });
    } catch (error) {
        console.error("Error announcing daily mood:", error);
        res.status(500).json({ error: 'Failed to announce daily mood' });
    }
});

// Admin dashboard route
app.get('/admin', async (req, res) => {
    // In a real application, you would add authentication here
    // For now, we'll use a simple secret key check
    const adminSecret = req.query.secret;
    if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(401).send('Unauthorized');
    }
    
    try {
        const currentDate = getCurrentDateString();
        const votes = await getVotesForDate(currentDate);
        const results = await calculateDailyResults();
        
        // Count total votes
        const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);
        
        // Find the winning mood
        let winningMoodIndex = -1;
        let maxVotes = -1;
        
        for (const moodIndex in results) {
            if (results[moodIndex] > maxVotes) {
                maxVotes = results[moodIndex];
                winningMoodIndex = parseInt(moodIndex, 10);
            }
        }
        
        const winningMood = winningMoodIndex !== -1 ? moods[winningMoodIndex] : null;
        
        // Create HTML for the admin dashboard
        const dashboardHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Vibe Check Admin Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .stats {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .mood-bar {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .mood-name {
            width: 100px;
            font-weight: bold;
        }
        .bar-container {
            flex-grow: 1;
            background-color: #eee;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
        }
        .bar {
            height: 100%;
            background-color: #4CAF50;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            transition: width 0.3s ease;
        }
        .winner {
            background-color: #FF9800;
        }
        .total {
            text-align: center;
            font-size: 18px;
            margin-top: 20px;
        }
        .date {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>Vibe Check Admin Dashboard</h1>
    <div class="date">Date: ${currentDate}</div>
    
    <div class="stats">
        <h2>Today's Mood Results</h2>
        ${Object.entries(results).map(([index, count]) => {
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isWinner = parseInt(index) === winningMoodIndex;
            return `
            <div class="mood-bar">
                <div class="mood-name">${moods[index].emoji} ${moods[index].mood}</div>
                <div class="bar-container">
                    <div class="bar ${isWinner ? 'winner' : ''}" style="width: ${percentage}%">
                        ${count} (${percentage}%)
                    </div>
                </div>
            </div>
            `;
        }).join('')}
        
        <div class="total">
            Total Votes: ${totalVotes}
            ${winningMood ? `<br>Winning Mood: ${winningMood.emoji} ${winningMood.mood}` : ''}
        </div>
    </div>
    
    <div class="stats">
        <h2>Recent Votes</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">FID</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Mood</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Time</th>
                </tr>
            </thead>
            <tbody>
                ${votes.slice(0, 20).map(vote => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${vote.fid}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${moods[vote.moodIndex].emoji} ${moods[vote.moodIndex].mood}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(vote.updatedAt).toLocaleString()}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(dashboardHtml);
    } catch (error) {
        console.error("Error generating admin dashboard:", error);
        res.status(500).send('Internal Server Error');
    }
});

// --- Server Start ---
// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
    // Connect to the database before starting the server
    connectToDatabase()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Vibe Check server listening on port ${PORT}`);
            });
        })
        .catch(err => {
            console.error('Failed to connect to the database:', err);
            process.exit(1);
        });
}

// Export the Express app for Vercel
export default app;
