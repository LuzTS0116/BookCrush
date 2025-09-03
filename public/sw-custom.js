// Custom service worker for push notifications
// This will be merged with the auto-generated next-pwa service worker

// Handle push notifications
self.addEventListener('push', function(event) {
    console.log('Push event received:', event);
    console.log('Event data:', event.data);
    
    if (event.data) {
      try {
        // Try to parse as JSON first
        const data = event.data.json();
        console.log('Push data (JSON):', data);
        
        const options = {
          body: data.body,
          icon: data.icon || '', // Don't set fallback icon
          badge: data.badge || '', // Don't set fallback badge
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
      } catch (error) {
        // If JSON parsing fails, try to get text content
        console.log('JSON parsing failed, trying text:', error);
        
        let messageText = 'New notification';
        try {
          messageText = event.data.text();
          console.log('Push data (plain text):', messageText);
        } catch (textError) {
          console.log('Text parsing also failed:', textError);
        }
        
        const options = {
          body: messageText,
          icon: '/icons/icon-192x192.png', // No icon for plain text notifications
          badge: '', // No badge for plain text notifications
          data: {},
          actions: [],
          requireInteraction: false,
          silent: false,
          tag: 'default',
          vibrate: [200, 100, 200]
        };
    
        event.waitUntil(
          self.registration.showNotification('New Notification', options)
        );
      }
    } else {
      // No data, show a default notification
      console.log('No push data, showing default notification');
      
      const options = {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png', // No icon for default notifications
        badge: '', // No badge for default notifications
        data: {},
        actions: [],
        requireInteraction: false,
        silent: false,
        tag: 'default',
        vibrate: [200, 100, 200]
      };
  
      event.waitUntil(
        self.registration.showNotification('New Notification', options)
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