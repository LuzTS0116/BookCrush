// Service worker registration script
if ('serviceWorker' in navigator) {
  console.log('Service worker supported, checking environment...');
  
  // Force registration in production (Vercel sets NODE_ENV to production)
  const shouldRegister = true; // Always try to register on Vercel
  
  if (shouldRegister) {
    console.log('Registering service worker...');
    
    // Register immediately and also on load
    const registerSW = () => {
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
    };
    
    // Try to register immediately
    registerSW();
    
    // Also register on load as backup
    window.addEventListener('load', registerSW);
    
    // And register on DOMContentLoaded as another backup
    document.addEventListener('DOMContentLoaded', registerSW);
  } else {
    console.log('Service worker disabled in development mode');
  }
} else {
  console.log('Service worker not supported in this browser');
}
