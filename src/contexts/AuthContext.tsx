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
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    // Use redirect method (more reliable than popup)
    await signInWithRedirect(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
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
    let isMounted = true;
    
    // Handle redirect result from Google sign-in
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && isMounted) {
          // User successfully signed in via redirect
          console.log('User signed in via redirect:', result.user.email);
          // Navigation will be handled by the auth state change
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
      }
    };

    // Set up auth state listener with persistence
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', user ? user.email : 'No user');
      
      try {
        if (user) {
          // User is signed in
          setCurrentUser(user);
          
          // Save user state to localStorage for faster loading on refresh
          localStorage.setItem('authUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }));
          
          // Navigate to dashboard if on login pages
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/') {
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          }
        } else {
          // User is signed out
          setCurrentUser(null);
          localStorage.removeItem('authUser');
          
          // Redirect to landing page if on protected routes
          const currentPath = window.location.pathname;
          const protectedRoutes = ['/dashboard'];
          if (protectedRoutes.includes(currentPath)) {
            window.location.href = '/';
          }
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
      unsubscribe();
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