// Service Worker Registration
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Notification Permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Show Notification
export const showNotification = (title: string, options?: NotificationOptions & { vibrate?: number[] }) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/icon-192x192.svg',
      badge: '/favicon.ico',
      ...options
    };
    
    const notification = new Notification(title, defaultOptions);
    
    // Handle vibration separately for mobile devices
    if ('vibrate' in navigator && options?.vibrate) {
      navigator.vibrate(options.vibrate);
    }
    
    return notification;
  }
  return null;
};

// Schedule Notification (for task reminders)
export const scheduleNotification = (title: string, message: string, delay: number) => {
  setTimeout(() => {
    showNotification(title, {
      body: message,
      tag: 'task-reminder'
    });
  }, delay);
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// PWA Install Prompt
export const setupInstallPrompt = () => {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }
          deferredPrompt = null;
        });
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
};