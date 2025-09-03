// Debug script to check service worker status
// Add this to your browser console on Vercel to debug service worker issues

function debugServiceWorker() {
  console.log('=== Service Worker Debug ===');
  
  // Check if service worker is supported
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported');
    return;
  }
  
  console.log('Service Worker supported');
  
  // Check notification permission
  console.log('Notification permission:', Notification.permission);
  
  // Check if service worker file exists
  fetch('/sw.js')
    .then(response => {
      console.log('Service Worker file status:', response.status);
      console.log('Service Worker file headers:', response.headers);
      return response.text();
    })
    .then(text => {
      console.log('Service Worker file size:', text.length);
      console.log('Service Worker file preview:', text.substring(0, 200) + '...');
    })
    .catch(error => {
      console.error('Service Worker file not found:', error);
    });
  
  // Check current service worker registration
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      console.log('Current registrations:', registrations);
      if (registrations.length > 0) {
        registrations.forEach((registration, index) => {
          console.log(`Registration ${index}:`, {
            scope: registration.scope,
            active: registration.active,
            installing: registration.installing,
            waiting: registration.waiting
          });
          
          // Test notification display
          if (registration.active && Notification.permission === 'granted') {
            console.log('Testing notification display...');
            registration.showNotification('Debug Test', {
              body: 'This is a test notification from debug script',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              tag: 'debug-test',
              requireInteraction: true
            });
          }
        });
      } else {
        console.log('No service worker registrations found');
      }
    })
    .catch(error => {
      console.error('Error getting registrations:', error);
    });
}

// Run the debug function
debugServiceWorker();
