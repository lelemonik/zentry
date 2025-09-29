import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, isUsingDemoConfig, handleFirebaseNetworkError } from '@/lib/firebase';

import { universalSync } from '@/lib/universal-sync';
import { dataPreloader } from '@/lib/data-preloader';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: (usePopup?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize with cached user data for faster loading
  useEffect(() => {
    const cachedUser = localStorage.getItem('authUser');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        console.log('Loading cached user data:', userData.email);
        // Note: This is just for faster UI, actual auth state will be verified by Firebase
      } catch (error) {
        console.error('Error parsing cached user data:', error);
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  const register = async (email: string, password: string, displayName?: string) => {
    try {
      if (!auth) {
        throw new Error('Firebase is not properly configured.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (!auth) {
        throw new Error('Firebase is not properly configured.');
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific authentication errors
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled. Please contact support.');
        case 'auth/too-many-requests':
          throw new Error('Too many failed login attempts. Please try again later.');
        case 'auth/invalid-email':
          throw new Error('Please enter a valid email address.');
        default:
          throw error;
      }
    }
  };

  const loginWithGoogle = async (usePopup: boolean = false) => {
    try {
      if (!auth) {
        throw new Error('Firebase is not properly configured.');
      }
      
      console.log('🔄 Starting Firebase Google authentication...');
      
      if (usePopup) {
        // Try popup method first (better UX but can be blocked)
        console.log('🔄 Attempting popup authentication...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log('✅ Google popup authentication successful:', result.user.email);
        return result;
      } else {
        // Use redirect method (more reliable but takes user away from page)
        console.log('🔄 Using redirect authentication...');
        await signInWithRedirect(auth, googleProvider);
        console.log('✅ Google redirect initiated');
        return;
      }
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      
      // Handle specific Firebase Auth errors
      switch (error.code) {
        case 'auth/popup-blocked':
          console.log('🔄 Popup blocked, falling back to redirect...');
          if (usePopup && auth) {
            // Fallback to redirect if popup was blocked
            try {
              await signInWithRedirect(auth, googleProvider);
              return;
            } catch (redirectError: any) {
              throw new Error('Authentication failed. Please try again or check your popup blocker settings.');
            }
          }
          throw new Error('Popup was blocked. Please allow popups or try again.');
        case 'auth/popup-closed-by-user':
          throw new Error('Authentication was cancelled. Please try again.');
        case 'auth/unauthorized-domain':
          throw new Error('This domain is not authorized for Google Sign-In. Please check Firebase console settings.');
        case 'auth/operation-not-allowed':
          throw new Error('Google Sign-In is not enabled. Please check Firebase console settings.');
        case 'auth/cancelled-popup-request':
          throw new Error('Authentication request was cancelled. Please try again.');
        case 'auth/network-request-failed':
          handleFirebaseNetworkError(error, 'Google Sign-In');
          break;
        case 'auth/too-many-requests':
          throw new Error('Too many failed attempts. Please wait a few minutes and try again.');
        default:
          console.error('Unhandled authentication error:', error);
          throw new Error(error.message || 'Authentication failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      const userId = currentUser?.uid;
      
      if (auth) {
        await signOut(auth);
      }
      
      // Clear user data from universal sync
      if (userId) {
        await universalSync.clearUserData(userId);
      }
      
      // Clear local state
      setCurrentUser(null);
      localStorage.removeItem('authUser');
      
      console.log('✅ User logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setCurrentUser(null);
      localStorage.removeItem('authUser');
    }
  };

  const updateUserProfile = async (profile: { displayName?: string; photoURL?: string }) => {
    if (currentUser) {
      await updateProfile(currentUser, profile);
      // Update the cached user data
      const updatedUser = { ...currentUser, ...profile };
      localStorage.setItem('authUser', JSON.stringify({
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        emailVerified: updatedUser.emailVerified,
      }));
    }
  };



  useEffect(() => {
    if (!auth) {
      console.log('🔄 Firebase not configured, setting loading to false');
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Handle redirect result from Google sign-in (must be called before auth state listener)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && isMounted) {
          // User successfully signed in via redirect
          console.log('✅ User signed in via Google redirect:', result.user.email);
          console.log('📧 Display name:', result.user.displayName);
          console.log('🖼️ Photo URL:', result.user.photoURL);
          // Auth state change listener will handle the rest
        }
      } catch (error: any) {
        console.error('❌ Redirect sign-in error:', error);
        if (error.code && isMounted) {
          localStorage.setItem('authError', JSON.stringify({
            code: error.code,
            message: error.message,
            timestamp: Date.now()
          }));
        }
      }
    };

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      try {
        if (user) {
          console.log('👤 Firebase user authenticated:', user.email);
          setCurrentUser(user);
          
          // Cache user data for faster subsequent loads
          localStorage.setItem('authUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
          }));
          
          console.log('👤 User data cached to localStorage');
          
          // Preload all user data for faster component loading
          try {
            console.log('🚀 Starting data preload for faster component loading...');
            dataPreloader.preloadUserData(user.uid);
          } catch (error) {
            console.error('Error preloading user data:', error);
          }
        } else {
          console.log('👤 No authenticated user');
          setCurrentUser(null);
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    // Handle redirect result after setting up the listener
    handleRedirectResult();

    // Cleanup
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};