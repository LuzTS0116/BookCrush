// Custom service worker for push notifications
// This will be merged with the auto-generated next-pwa service worker

// Handle push notifications
self.addEventListener('push', function(event) {
    console.log('Push event received:', event);
    
    if (event.data) {
      const data = event.data.json();
      console.log('Push data:', data);
      
      const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-192x192.png',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: false,
        silent: false,
        tag: data.tag || 'default',
        vibrate: [200, 100, 200]
      };
  
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    }
  });
  
  // Handle notification clicks
  self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
      // Default action or 'view' action
      const urlToOpen = event.notification.data?.url || '/';
      
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
          // Check if there's already a window/tab open with the target URL
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If no window/tab is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
    }
  });
  
  // Handle notification close
  self.addEventListener('notificationclose', function(event) {
    console.log('Notification closed:', event);
  });
  
  // Service worker installation
  self.addEventListener('install', function(event) {
    console.log('Service worker installing...');
    self.skipWaiting();
  });
  
  // Service worker activation
  self.addEventListener('activate', function(event) {
    console.log('Service worker activating...');
    event.waitUntil(self.clients.claim());
  });
  
  // Handle background sync (if needed in the future)
  self.addEventListener('sync', function(event) {
    console.log('Background sync event:', event);
  });