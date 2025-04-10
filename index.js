import 'dotenv/config';
import express from 'express';
import { sdk } from '@farcaster/frame-sdk';
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
    { mood: 'Happy', emoji: '😊', songUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, // Placeholder - Happy
    { mood: 'Down', emoji: '😢', songUrl: 'https://www.youtube.com/watch?v=o_1aF54DOp0' }, // Placeholder - Down
    { mood: 'Motivated', emoji: '😤', songUrl: 'https://www.youtube.com/watch?v=btPJPFnesV4' }, // Placeholder - Motivated
    { mood: 'Thoughtful', emoji: '🤔', songUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A' }, // Placeholder - Thoughtful
    { mood: 'Excited', emoji: '🤩', songUrl: 'https://www.youtube.com/watch?v=3GwjfUFyY6M' }  // Placeholder - Excited
];

// Middleware to parse request bodies (needed for frame actions)
app.use(express.json());

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

    // Call ready to hide the splash screen
    await sdk.actions.ready();
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

        // Respond with a frame showing the selected mood and suggested song
        const responseImageUrl = `${baseUrl}/image?text=You+chose:+${encodeURIComponent(selectedMood.emoji)}%0AEnjoy+this+tune!&t=${Date.now()}`;
        const frameHtml = `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext">
    <meta property="fc:frame:image" content="${responseImageUrl}">
    <meta property="fc:frame:button:1" content="Listen Now">
    <meta property="fc:frame:button:1:action" content="link">
    <meta property="fc:frame:button:1:target" content="${selectedMood.songUrl}">
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

// Reset data endpoint (to be called by Vercel cron job at 8:00 AM America/New_York time)
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

// Announce mood endpoint (to be called by Vercel cron job at 8:00 PM America/New_York time)
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
            // TODO: Post a cast or send notification with winningMood.emoji, winningMood.mood, and winningMood.songUrl
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
