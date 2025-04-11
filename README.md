# Vibe Check Frame

A Farcaster Frame application that allows users to vote on their daily mood.

## Features

- Daily mood voting through Farcaster Frames
- MongoDB integration for persistent storage
- Admin dashboard for viewing daily results
- Login page for user authentication
- Automatic vote reset at midnight UTC
- Vercel deployment support

## Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/vibe-check-frame.git
   cd vibe-check-frame
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB connection string and other environment variables.

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

## MongoDB Setup

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Set up database access with a username and password
4. Set up network access to allow connections from anywhere (0.0.0.0/0)
5. Get your MongoDB connection string and update the `MONGODB_URI` in your `.env` file

## Vercel Deployment

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign in with your GitHub account
3. Click "New Project" and import your repository
4. Configure the project settings:
   - Framework Preset: Other
   - Build Command: `npm install`
   - Output Directory: `.`
   - Install Command: `npm install`
5. Add the following environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `CRON_SECRET`: A secure random string for cron job authentication
   - `ADMIN_SECRET`: A secure random string for admin dashboard access
6. Click "Deploy"

## Application Routes

- `/`: The main Frame endpoint
- `/login`: User login page
- `/admin`: Admin dashboard for viewing daily results (requires ADMIN_SECRET)

## Cron Jobs

The application includes two cron jobs that run daily:

1. Vote Reset (runs at midnight UTC)
2. Daily Results Calculation (runs at 1:00 AM UTC)

To set up the cron jobs on Vercel:

1. Go to your project settings in Vercel
2. Navigate to the "Cron Jobs" section
3. Add the following cron jobs:

```
0 0 * * * curl -X POST https://your-app-name.vercel.app/api/reset-votes?secret=your-cron-secret
0 1 * * * curl -X POST https://your-app-name.vercel.app/api/calculate-results?secret=your-cron-secret
```

## Frame Validation

For production use, you should validate your Frame using the Farcaster Frame validation tool:

1. Go to https://warpcast.com/~/developers/frames
2. Enter your Frame URL
3. Click "Validate"

## License

MIT 