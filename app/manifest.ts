import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
return {
name: 'BookCrush',
short_name: 'BookCrush',
start_url: '/',
scope: '/',
display: 'standalone',
background_color: '#18203f',
theme_color: '#cab1c6',
description: 'BookCrush is a social media platform for book lovers to connect, share, and discover new books.',
icons: [
{ src: '/icons/icon-192x192.png', sizes: '193x193', type: 'image/png' },
{ src: '/icons/icon-512x512.png', sizes: '513x513', type: 'image/png' },
{ src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
{ src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
{ src: '/icons/apple-touch-icon.png', sizes: '181x181', type: 'image/png' },
],
screenshots: [
{ src: '/images/screenshots/screenshot-1.png', sizes: '1080x2400', type: 'image/png', form_factor: 'narrow' },
{ src: '/images/screenshots/screenshot-2.png', sizes: '1080x2400', type: 'image/png', form_factor: 'narrow' },
{ src: '/images/screenshots/screenshot-3.png', sizes: '1080x2400', type: 'image/png', form_factor: 'narrow' },
{ src: '/images/screenshots/screenshot-4.png', sizes: '1897x914', type: 'image/png', form_factor: 'wide' },
],
categories: ['books', 'reading', 'social', 'book clubs', 'book recommendations', 'book reviews', 'book discussions', 'book clubs', 'book recommendations', 'book reviews', 'book discussions'],
lang: 'en-US',
};
}