// Service worker registration script
if ('serviceWorker' in navigator) {
  console.log('Service worker supported, checking environment...');
  
  // Only register service worker in production or when explicitly enabled
  const shouldRegister = process.env.NODE_ENV === 'production' || 
                        process.env.NEXT_PUBLIC_ENABLE_SW === 'true';
  
  if (shouldRegister) {
    console.log('Registering service worker...');
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('Service worker registration successful:', registration);
          console.log('Service worker scope:', registration.scope);
          console.log('Service worker state:', registration.active ? 'active' : 'installing');
        })
        .catch(function(error) {
          console.log('Service worker registration failed:', error);
        });
    });
  } else {
    console.log('Service worker disabled in development mode');
  }
} else {
  console.log('Service worker not supported in this browser');
}
