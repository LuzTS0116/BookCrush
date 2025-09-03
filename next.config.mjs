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
  disable: isDev, // Explicitly disable in development
  register: !isDev, // Only auto-register in production
  skipWaiting: true,
  buildExcludes: [/app-build-manifest.json$/],
  fallbacks: { document: '/offline' },
  runtimeCaching,
  //sw: '/sw.js',
  // IMPORTANT: pass Workbox options directly, not under "workboxOptions"
  importScripts: isDev ? [] : ['/sw-custom.js'], // Only import custom SW in production
  // Vercel-specific options
  reloadOnOnline: false,
  sw: isDev ? undefined : '/sw.js', // Explicitly set SW path for production
  })(nextConfig)
