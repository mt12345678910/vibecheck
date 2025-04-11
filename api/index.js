import express from 'express';
import { connectToDatabase } from '../db.js';

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy' });
});

// Test MongoDB connection route
app.get('/test-db', async (req, res) => {
  try {
    const db = await connectToDatabase();
    res.status(200).json({ message: 'Successfully connected to MongoDB!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  }
});

// Export the Express app
export default app; 