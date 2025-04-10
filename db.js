import { MongoClient } from 'mongodb';

// MongoDB connection URI
const uri = process.env.MONGODB_URI;
const dbName = 'vibecheck';

// Create a MongoDB client
const client = new MongoClient(uri);

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db(dbName);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Get the database instance
async function getDb() {
  return await connectToDatabase();
}

// Close the MongoDB connection
async function closeConnection() {
  try {
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}

// Vote operations
async function saveVote(fid, moodIndex) {
  const db = await getDb();
  const votesCollection = db.collection('votes');
  
  // Use upsert to either insert a new vote or update an existing one
  const result = await votesCollection.updateOne(
    { fid, date: getCurrentDateString() },
    { $set: { moodIndex, updatedAt: new Date() } },
    { upsert: true }
  );
  
  return result;
}

async function getVotesForDate(dateString) {
  const db = await getDb();
  const votesCollection = db.collection('votes');
  
  const votes = await votesCollection.find({ date: dateString }).toArray();
  return votes;
}

async function resetVotesForDate(dateString) {
  const db = await getDb();
  const votesCollection = db.collection('votes');
  
  const result = await votesCollection.deleteMany({ date: dateString });
  return result;
}

// Helper function to get current date string in YYYY-MM-DD format
function getCurrentDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export {
  connectToDatabase,
  getDb,
  closeConnection,
  saveVote,
  getVotesForDate,
  resetVotesForDate,
  getCurrentDateString
}; 