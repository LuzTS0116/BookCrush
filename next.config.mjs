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

const isDev = process.env.NODE_ENV === 'development';

export default withPWA({
  dest: 'public',
  disable: false, // Always enable PWA on Vercel
  register: true, // Always auto-register
  skipWaiting: true,
  buildExcludes: [/app-build-manifest.json$/],
  fallbacks: { document: '/offline' },
  runtimeCaching,
  //sw: '/sw.js',
  // IMPORTANT: pass Workbox options directly, not under "workboxOptions"
  importScripts: ['/sw-custom.js'], // Always import custom SW
  // Vercel-specific options
  reloadOnOnline: false,
  sw: '/sw.js', // Always set SW path
  })(nextConfig)
