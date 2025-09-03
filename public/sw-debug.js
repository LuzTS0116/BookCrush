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
