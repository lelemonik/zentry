import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { FontSizeProvider } from "./contexts/FontSizeContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import SmartHomePage from "./components/SmartHomePage";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { GoogleAuthRedirectHandler } from "./components/GoogleAuthRedirectHandler";
import { registerServiceWorker, setupInstallPrompt } from "./lib/pwa";
import { initOfflineDB } from "./lib/offline-db";
import { notificationScheduler } from "./lib/notification-scheduler";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Initialize offline database first (this might be causing issues)
        try {
          await initOfflineDB();
          console.log('Offline DB initialized');
        } catch (error) {
          console.warn('Offline DB initialization failed:', error);
        }
        
        // Register service worker for PWA functionality
        try {
          registerServiceWorker();
          console.log('Service worker registered');
        } catch (error) {
          console.warn('Service worker registration failed:', error);
        }
        
        // Setup PWA install prompt
        try {
          setupInstallPrompt();
          console.log('Install prompt setup');
        } catch (error) {
          console.warn('Install prompt setup failed:', error);
        }
        
        // Initialize notification system
        try {
          await notificationScheduler.initialize();
          console.log('Notification scheduler initialized');
        } catch (error) {
          console.warn('Notification scheduler initialization failed:', error);
        }

        // Setup background sync
        try {
          setupBackgroundSync();
          console.log('Background sync setup');
        } catch (error) {
          console.warn('Background sync setup failed:', error);
        }

        console.log('App initialization completed successfully');
      } catch (error) {
        console.error('App initialization failed:', error);
        // Don't throw the error, just log it so the app can still load
      }
    };

    // Add a small delay to ensure the app renders first
    setTimeout(initializeApp, 100);
  }, []);

  const setupBackgroundSync = () => {
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('App came online - triggering background sync');
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: any) => {
          if (registration.sync) {
            return registration.sync.register('background-sync');
          }
        }).catch((error) => {
          console.error('Background sync registration failed:', error);
        });
      }
    };

    const handleOffline = () => {
      console.log('App went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <LanguageProvider>
            <FontSizeProvider>
              <AuthProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <GoogleAuthRedirectHandler />
                    <Routes>
                      {/* Smart Home Route - shows Landing for guests, Home for authenticated users */}
                      <Route path="/" element={<SmartHomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />

                      
                      {/* Protected Routes */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Redirects */}
                      <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                      
                      {/* 404 Page */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </FontSizeProvider>
        </LanguageProvider>
      </PreferencesProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
