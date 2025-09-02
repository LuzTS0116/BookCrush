/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const runtimeCaching = [
{

urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
handler: 'CacheFirst',
options: {
cacheName: 'google-fonts',
expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
},
},
{
urlPattern: ({ request }) => request.destination === 'image',
handler: 'StaleWhileRevalidate',
options: { cacheName: 'images', expiration: { maxEntries: 200 } },
},
{
urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
handler: 'NetworkFirst',
options: {
cacheName: 'api',
networkTimeoutSeconds: 5,
expiration: { maxEntries: 100, maxAgeSeconds: 60 * 10 },
},
},
];

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withPWA({
  dest: 'public', // emits /sw.js
  disable: process.env.NODE_ENV === 'development',
  register: false, // auto-register SW
  skipWaiting: true, // take control immediately
  fallbacks: { document: '/offline ' }, // offline HTML fallback
  runtimeCaching,
  sw: '/sw-custom.js', // Use our custom service worker
  })(nextConfig);
