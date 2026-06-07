# Workout Tracker

Personal fitness tracking app. Logs workouts, cardio, nutrition, body measurements, and more.

## Deploy to Vercel (15 minutes, free)

### Step 1: Create a GitHub account (if you don't have one)
1. Go to [github.com](https://github.com) and sign up
2. Verify your email

### Step 2: Upload this code to GitHub
1. On github.com, click **+** in top-right → **New repository**
2. Name it `workout-tracker` (or anything)
3. Click **Create repository**
4. On the next page, click **uploading an existing file**
5. Drag this entire folder's contents into the upload area
6. Click **Commit changes**

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. Click **Add New** → **Project**
3. Find your `workout-tracker` repository → click **Import**
4. Leave all defaults as-is → click **Deploy**
5. Wait ~60 seconds
6. Vercel gives you a URL like `workout-tracker-xyz.vercel.app`

### Step 4: Add to iPhone home screen
1. Open the Vercel URL in Safari on your iPhone
2. Tap the **Share** button (square with up-arrow at the bottom)
3. Scroll down → tap **Add to Home Screen**
4. Name it "Workout" → tap **Add**

### Step 5: Use forever
- The icon launches the app fullscreen like a native app
- Your data is stored in localStorage and **persists permanently** because the app lives on its own domain (no Safari ITP issues)
- No login required, ever
- Free forever (Vercel free tier handles way more traffic than you'll ever generate)

## Updating the app

When you want to make changes:
1. Edit `src/App.jsx` in your GitHub repo (or upload a new version)
2. Vercel auto-redeploys within 30 seconds
3. Refresh the app on your phone

## Data backup

- Use the in-app **TOOLS → BACKUP** feature to download a JSON file weekly
- Restore via **TOOLS → BACKUP → ⬆ RESTORE FROM FILE** if needed
