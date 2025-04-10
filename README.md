# Vibe Check Frame

A Farcaster Frame that lets users check in with their daily mood and get song recommendations.

## Features

- Daily mood check-in via Farcaster Frame
- Song recommendations based on mood
- Daily mood announcement at 8:00 PM Eastern
- Persistent storage with MongoDB
- Deployed on Vercel with cron jobs

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
4. Update the `.env` file with your MongoDB connection string and other settings
5. Start the development server:
   ```
   npm start
   ```

## MongoDB Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up a database user with read/write permissions
4. Get your connection string and add it to your `.env` file
5. Make sure to whitelist your IP address in the Network Access settings

## Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set up the following environment variables in Vercel:
   - `MONGODB_URI`: Your MongoDB connection string
   - `CRON_SECRET`: A secure random string for cron job authentication
   - Any other environment variables from your `.env` file

## Cron Jobs

The application uses Vercel's cron jobs to:
- Reset daily votes at 8:00 AM Eastern time
- Announce the daily mood at 8:00 PM Eastern time

## Frame Validation

For production use, consider implementing frame validation using a service like Neynar to ensure requests are coming from legitimate Farcaster clients.

## License

ISC 