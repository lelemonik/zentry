# 🔥 Get Your Real Firebase Configuration

Your Firebase project `zentry-86a55` is already set up, but you need to get the real configuration values to enable Google authentication.

## 📋 Step-by-Step Instructions:

### 1. Open Firebase Console
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project: **zentry-86a55**

### 2. Get Configuration Values
1. Click on **Project Settings** (gear icon in sidebar)
2. Scroll down to **Your apps** section
3. If you see a web app (`</>` icon), click on it
4. If you don't see a web app, click **Add app** → **Web** → Register with name "Zentry Web"

### 3. Copy Configuration
You'll see a configuration object like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Copy this value
  authDomain: "zentry-86a55.firebaseapp.com",
  projectId: "zentry-86a55", 
  storageBucket: "zentry-86a55.appspot.com",
  messagingSenderId: "123456789", // Copy this value
  appId: "1:123456789:web:abc123" // Copy this value
};
```

### 4. Update Your .env File
Replace the placeholder values in `.env`:

```bash
VITE_FIREBASE_API_KEY=AIzaSyC... # Your actual API key
VITE_FIREBASE_AUTH_DOMAIN=zentry-86a55.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zentry-86a55
VITE_FIREBASE_STORAGE_BUCKET=zentry-86a55.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 # Your actual sender ID
VITE_FIREBASE_APP_ID=1:123456789:web:abc123 # Your actual app ID
```

### 5. Enable Google Authentication
1. In Firebase Console, go to **Authentication**
2. Click **Sign-in method** tab
3. Click **Google**
4. Toggle **Enable** switch to ON
5. Save changes

### 6. Add Authorized Domains (Important!)
1. Still in **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   - `localhost` (for development)
   - `zentry-86a55.web.app` (for production)
   - `zentry-86a55.firebaseapp.com` (backup)

### 7. Test the Setup
1. Save your `.env` file with real values
2. Restart your development server: `npm run dev`
3. Try the Google sign-in button
4. You should see "Firebase initialized successfully" in browser console

## 🚨 Important Notes:
- **Never commit real Firebase keys to GitHub**
- Your `.env` file is already in `.gitignore`
- Use different projects for development and production if possible
- Keep your API keys secure

## ✅ How to Verify It's Working:
- Browser console shows: "Firebase initialized successfully"
- No more "Using demo Firebase configuration" messages  
- Google sign-in opens real Google account selection
- Users can sign in with their actual Google accounts

## 🆘 Need Help?
If you need help getting these values, share a screenshot of your Firebase Console project settings page (General tab) and I can guide you through the specific steps.