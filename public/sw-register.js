// Service worker registration script
if ('serviceWorker' in navigator) {
  console.log('Service worker supported, attempting registration...');
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
  console.log('Service worker not supported in this browser');
}
