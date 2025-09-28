// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if Firebase credentials are properly configured
const isFirebaseConfigured = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID'
  ];
  
  return requiredEnvVars.every(envVar => {
    const value = import.meta.env[envVar];
    return value && 
           value !== 'your-firebase-api-key' && 
           value !== 'your-project-id' &&
           value !== 'your-actual-api-key-here' &&
           value !== 'your-sender-id-here' &&
           value !== 'your-app-id-here' &&
           !value.includes('Demo') &&
           !value.includes('demo');
  });
};

// Check if running on localhost
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zentry-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zentry-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zentry-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo123456789abc"
};

// Check if we're using demo/placeholder values
const isDemoConfig = firebaseConfig.apiKey === 'demo-api-key' || 
                    firebaseConfig.projectId === 'zentry-demo' ||
                    firebaseConfig.apiKey.includes('Demo') ||
                    firebaseConfig.apiKey.includes('demo') ||
                    firebaseConfig.apiKey === 'your-actual-api-key-here' ||
                    !isFirebaseConfigured();

// Log Firebase configuration status
console.log('🔥 Firebase Configuration Status:', {
  configured: isFirebaseConfigured(),
  isDemoConfig,
  isLocalhost: typeof window !== 'undefined' ? isLocalhost() : false,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'Not set',
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
});

// Show localhost warning
if (typeof window !== 'undefined' && isLocalhost() && !isDemoConfig) {
  console.warn('⚠️  LOCALHOST DEVELOPMENT WARNING:');
  console.warn('You are running on localhost with real Firebase credentials.');
  console.warn('If you encounter auth/network-request-failed errors:');
  console.warn('1. Use the deployed version at https://zentry-86a55.web.app');
  console.warn('2. Or add "localhost" to Firebase Console → Authentication → Authorized domains');
  console.warn('3. Or run: firebase emulators:start for local development');
}

// Additional debug info
console.log('🌍 Environment Variables:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

// Initialize Firebase
let app;
try {
  if (isDemoConfig) {
    console.warn('🔥 Using demo Firebase configuration. Authentication features will use mock service.');
    console.warn('📖 To set up real Firebase, see FIREBASE_SETUP.md');
    // Create a minimal app instance for demo mode
    app = { options: firebaseConfig } as any;
  } else {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.warn('🔄 Falling back to demo mode');
  app = { options: firebaseConfig } as any;
}

// Initialize Firebase Auth and get a reference to the service
export const auth = isDemoConfig ? null : getAuth(app);

// Configure auth persistence (this is the default but making it explicit)
if (auth && !isDemoConfig) {
  // Firebase Auth automatically persists to localStorage by default
  console.log('🔐 Firebase Auth persistence: LOCAL (automatic)');
}

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
if (!isDemoConfig) {
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });
}

// Initialize Firestore
export const db = isDemoConfig ? null : getFirestore(app);

// Export configuration status for other modules to use
export const isUsingDemoConfig = isDemoConfig;

// Utility function to handle Firebase network errors
export const handleFirebaseNetworkError = (error: any, context: string = '') => {
  if (error.code === 'auth/network-request-failed') {
    const isOnLocalhost = typeof window !== 'undefined' && isLocalhost();
    
    console.error(`🌐 Firebase Network Error in ${context}:`, error);
    
    if (isOnLocalhost && !isDemoConfig) {
      const errorMessage = `
🚨 Firebase Network Error on Localhost

You're trying to use Firebase authentication on localhost, but the domain is not authorized.

Quick Solutions:
1. 🌐 Use the deployed app: https://zentry-86a55.web.app
2. 🔧 Add localhost to Firebase Console:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add "localhost" to the list
3. 🧪 Use Firebase Emulator: Run "firebase emulators:start" for local development

For now, the app will use offline-only mode with local storage.
      `.trim();
      
      // Show user-friendly notification with auto-redirect option
      if (typeof window !== 'undefined') {
        console.warn(errorMessage);
        
        // Create a simple notification div with redirect option
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ff6b6b;
          color: white;
          padding: 16px;
          border-radius: 8px;
          max-width: 400px;
          z-index: 10000;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const redirectBtn = document.createElement('button');
        redirectBtn.textContent = '🚀 Go to Working Version';
        redirectBtn.style.cssText = `
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 8px;
          font-size: 12px;
        `;
        redirectBtn.onclick = () => {
          window.open('https://zentry-86a55.web.app', '_blank');
        };
        
        notification.innerHTML = `
          <strong>🌐 Firebase Network Error</strong><br>
          Localhost not authorized. Use deployed version:<br>
        `;
        notification.appendChild(redirectBtn);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 15000);
      }
      
      throw new Error('Firebase network error on localhost. Please use the deployed version at https://zentry-86a55.web.app or configure Firebase for localhost development.');
    } else {
      throw new Error(`Network connection error. Please check your internet connection and try again. ${context}`);
    }
  } else {
    throw error;
  }
};

export default app;