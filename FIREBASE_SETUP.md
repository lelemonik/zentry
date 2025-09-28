# Firebase Setup Guide for Zentry

## Getting Started

Follow these steps to set up Firebase for your Zentry application:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `zentry-[your-name]` (e.g., `zentry-john`)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the sidebar
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and set your project's public-facing name

### 3. Create a Web App

1. In your Firebase project overview, click the **Web** icon (`</>`)
2. Register your app with nickname: `zentry-web`
3. **Don't** check "Also set up Firebase Hosting" (we'll use Vite's dev server)
4. Click "Register app"
5. Copy the configuration object (you'll need this next)

### 4. Configure Environment Variables

1. Copy the Firebase configuration from step 3
2. Open your `.env` file in the project root
3. Replace the placeholder values with your actual Firebase configuration:

```env
# Replace these with your actual Firebase project credentials
VITE_FIREBASE_API_KEY=AIzaSy...your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-actual-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=1:your-messaging-sender-id:web:your-app-id
```

### 5. Configure Firestore (Optional)

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select your preferred location
5. Click "Done"

### 6. Restart Development Server

After updating the `.env` file:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Security Rules (Important!)

### Firestore Rules (if using Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tasks collection - user-specific
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Notes collection - user-specific
    match /notes/{noteId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Troubleshooting

### Common Errors

1. **"auth/api-key-not-valid"**
   - Check that your API key is correct in `.env`
   - Make sure there are no extra spaces or quotes
   - Verify the project is active in Firebase Console

2. **"auth/project-not-found"**
   - Verify `VITE_FIREBASE_PROJECT_ID` matches your Firebase project ID exactly
   - Check that the project exists in Firebase Console

3. **"auth/domain-not-authorized"**
   - In Firebase Console, go to Authentication > Settings
   - Add `localhost:8081` to authorized domains

### Development vs Production

For production deployment, make sure to:
1. Set up proper security rules
2. Use environment-specific Firebase projects
3. Configure authorized domains in Firebase Console
4. Enable only necessary authentication providers

## Testing the Setup

After configuration, you should be able to:
1. Visit `http://localhost:8081`
2. Click "Sign Up" and create an account with email/password
3. Try logging in with Google (should redirect properly)
4. All authentication features should work without errors

If you see any Firebase-related errors in the browser console, check this guide again or refer to the [Firebase Documentation](https://firebase.google.com/docs/web/setup).