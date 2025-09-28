const CACHE_NAME = 'zentry-v2';
const DYNAMIC_CACHE = 'zentry-dynamic-v2';

// Core resources that should always be cached
const CORE_CACHE_RESOURCES = [
  '/',
  '/manifest.json',
  '/icon-192x192.svg',
  '/favicon.ico'
];

// Resources to cache dynamically
const CACHE_STRATEGIES = {
  // Cache JS/CSS files with network-first strategy
  assets: /\.(js|css)$/,
  // Cache images with cache-first strategy  
  images: /\.(png|jpg|jpeg|svg|gif|webp)$/,
  // Cache API responses temporarily
  api: /\/api\//
};

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Caching core resources...');
        await cache.addAll(CORE_CACHE_RESOURCES);
        console.log('Core resources cached successfully');
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Cache installation failed:', error);
      }
    })()
  );
});

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for Chrome extensions and non-http requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Strategy 1: Cache-first for images
        if (CACHE_STRATEGIES.images.test(url.pathname)) {
          return await cacheFirst(request);
        }

        // Strategy 2: Network-first for JS/CSS assets
        if (CACHE_STRATEGIES.assets.test(url.pathname)) {
          return await networkFirst(request);
        }

        // Strategy 3: Stale-while-revalidate for documents
        if (request.destination === 'document') {
          return await staleWhileRevalidate(request);
        }

        // Default: Network-first with fallback
        return await networkFirst(request);
      } catch (error) {
        console.error('Fetch error:', error);
        
        // Fallback to cache or offline page
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return offline page for document requests
        if (request.destination === 'document') {
          return await caches.match('/');
        }
        
        throw error;
      }
    })()
  );
});

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  await addToCache(DYNAMIC_CACHE, request, networkResponse.clone());
  return networkResponse;
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    await addToCache(DYNAMIC_CACHE, request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then(async (networkResponse) => {
    await addToCache(CACHE_NAME, request, networkResponse.clone());
    return networkResponse;
  }).catch(() => null);

  return cachedResponse || await networkResponsePromise;
}

// Helper function to add to cache
async function addToCache(cacheName, request, response) {
  if (response.status === 200) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  }
}

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE];

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('Service Worker activated and ready!');
    })()
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'task-sync') {
    event.waitUntil(syncTasks());
  } else if (event.tag === 'schedule-sync') {
    event.waitUntil(syncSchedules());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Syncing offline data...');
    
    // Get pending sync data from IndexedDB
    const pendingData = await getPendingSync();
    
    for (const item of pendingData) {
      try {
        // Sync each item with the server/firebase
        await syncDataItem(item);
        // Remove from pending sync after success
        await removePendingSync(item.id);
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
      }
    }
    
    console.log('Offline data sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync tasks specifically
async function syncTasks() {
  console.log('Syncing tasks...');
  // Implementation for task-specific sync
}

// Sync schedules specifically  
async function syncSchedules() {
  console.log('Syncing schedules...');
  // Implementation for schedule-specific sync
}

// Placeholder functions for IndexedDB operations
async function getPendingSync() {
  // This will be implemented with IndexedDB
  return [];
}

async function syncDataItem(item) {
  // Sync individual data items
  console.log('Syncing item:', item);
}

async function removePendingSync(id) {
  // Remove synced items from pending queue
  console.log('Removing from sync queue:', id);
}

// Enhanced notification system
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'Zentry',
    body: 'You have a notification',
    icon: '/icon-192x192.svg',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192x192.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Error parsing notification data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // If app is already open, focus it
      if (windowClients.length > 0) {
        const client = windowClients[0];
        await client.focus();
        
        // Send message to client about notification click
        client.postMessage({
          type: 'notification-click',
          data: event.notification.data
        });
      } else {
        // Open new window
        await clients.openWindow('/');
      }
    })()
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(event.data.payload);
  } else if (event.data.type === 'CANCEL_NOTIFICATION') {
    cancelScheduledNotification(event.data.payload);
  }
});

// Schedule notifications for tasks and schedules
function scheduleNotification(payload) {
  const { id, title, body, triggerTime } = payload;
  const delay = triggerTime - Date.now();
  
  if (delay > 0) {
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192x192.svg',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: { id, type: 'scheduled' },
        requireInteraction: true,
        actions: [
          {
            action: 'complete',
            title: 'Mark Complete'
          },
          {
            action: 'snooze',
            title: 'Snooze 10min'
          }
        ]
      });
    }, delay);
  }
}

// Cancel scheduled notifications
function cancelScheduledNotification(payload) {
  // Implementation for canceling scheduled notifications
  console.log('Canceling notification:', payload);
}