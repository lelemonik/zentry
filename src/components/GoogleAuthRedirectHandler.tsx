import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component to handle Google authentication redirects
 * Should be placed in the main App component to handle redirects globally
 */
export const GoogleAuthRedirectHandler = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only handle redirects when auth loading is complete
    if (!loading) {
      // Check if we just completed a Google auth redirect
      const urlParams = new URLSearchParams(window.location.search);
      const authRedirect = urlParams.get('authRedirect');
      const error = urlParams.get('error');

      if (error) {
        // Handle authentication errors from redirect
        console.error('Authentication error from redirect:', error);
        localStorage.setItem('authRedirectError', decodeURIComponent(error));
        
        // Clean URL and redirect to appropriate page
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to login page to show the error
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          navigate('/login');
        }
        return;
      }

      if (authRedirect && currentUser) {
        // Successfully authenticated via redirect
        console.log('✅ Google authentication redirect successful');
        
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
      } else if (authRedirect && !currentUser) {
        // Redirect occurred but no user (possible error)
        console.warn('⚠️ Google authentication redirect without user');
        localStorage.setItem('authRedirectError', 'Authentication completed but no user was found. Please try again.');
        
        // Clean URL and redirect to login
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/login');
      }
    }
  }, [currentUser, loading, navigate]);

  return null; // This component doesn't render anything
};

/**
 * Hook to handle Google authentication state and redirects
 * Can be used in login/signup pages for additional redirect handling
 */
export const useGoogleAuthRedirect = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleSuccessfulAuth = () => {
    if (currentUser && !loading) {
      console.log('✅ User authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  };

  const checkForRedirectError = () => {
    const redirectError = localStorage.getItem('authRedirectError');
    if (redirectError) {
      localStorage.removeItem('authRedirectError');
      return redirectError;
    }
    return null;
  };

  return {
    currentUser,
    loading,
    handleSuccessfulAuth,
    checkForRedirectError
  };
};