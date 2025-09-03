// Service worker registration script
if ('serviceWorker' in navigator) {
  console.log('Service worker supported, checking environment...');
  
  // Only register service worker in production or when explicitly enabled
  const shouldRegister = process.env.NODE_ENV === 'production' || 
                        process.env.NEXT_PUBLIC_ENABLE_SW === 'true';
  
  if (shouldRegister) {
    console.log('Registering service worker...');
    window.addEventListener('load', function() {
      // Try to register the service worker
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
        .then(function(registration) {
          console.log('Service worker registration successful:', registration);
          console.log('Service worker scope:', registration.scope);
          console.log('Service worker state:', registration.active ? 'active' : 'installing');
          
          // Check if service worker is actually active
          if (registration.active) {
            console.log('Service worker is active and ready');
          } else {
            console.log('Service worker is installing...');
            registration.addEventListener('activate', function() {
              console.log('Service worker activated');
            });
          }
        })
        .catch(function(error) {
          console.log('Service worker registration failed:', error);
          console.error('Error details:', error.message);
        });
    });
  } else {
    console.log('Service worker disabled in development mode');
  }
} else {
  console.log('Service worker not supported in this browser');
}
