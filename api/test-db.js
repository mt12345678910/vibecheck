import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    res.status(200).json({ message: 'Successfully connected to MongoDB!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  }
} 