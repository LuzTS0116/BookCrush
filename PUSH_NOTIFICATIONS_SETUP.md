# Push Notifications Setup Guide

This guide explains how to set up push notifications for book recommendations in BookCrush.

## Prerequisites

1. **VAPID Keys**: You need to generate VAPID keys for push notifications
2. **HTTPS**: Push notifications require HTTPS (except for localhost)
3. **Service Worker**: The app uses a custom service worker for handling notifications

## Setup Steps

### 1. Generate VAPID Keys

Run the VAPID key generation script:

```bash
node scripts/generate-vapid-keys.js
```

This will output the public and private keys you need to add to your environment variables.

### 2. Environment Variables

Add these to your `.env` file:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=your-email@example.com

# App URL (for internal API calls)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Database Migration

The push notification system requires a new database table. Run the migration:

```bash
npx prisma migrate dev --name add_push_subscriptions
```

### 4. Install Dependencies

Make sure you have the required dependencies:

```bash
npm install web-push
npm install @types/web-push --save-dev
```

## How It Works

### 1. User Subscription

Users can enable push notifications through the `NotificationSettings` component:

```tsx
import { NotificationSettings } from '@/components/NotificationSettings'

// In your settings page
<NotificationSettings />
```

### 2. Hook Usage

The `useRecommendationNotifications` hook now includes push notification functionality:

```tsx
import { useRecommendationNotifications } from '@/hooks/use-recommendation-notifications'

const { pushNotifications } = useRecommendationNotifications()

// Check if supported
if (pushNotifications.isSupported) {
  // Subscribe to notifications
  await pushNotifications.subscribe()
  
  // Unsubscribe
  await pushNotifications.unsubscribe()
}
```

### 3. Automatic Notifications

When a user sends a book recommendation, the system automatically:

1. Creates the recommendation in the database
2. Sends a push notification to the recipient
3. Shows a notification with the book title and sender's name

### 4. Service Worker

The custom service worker (`public/sw-custom.js`) handles:

- Push event reception
- Notification display
- Click handling (opens the app to the books page)
- Background sync

## API Endpoints

### POST `/api/push/subscribe`
Registers a user's push subscription for recommendations.

**Body:**
```json
{
  "subscription": {
    "endpoint": "...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "type": "recommendation"
}
```

### POST `/api/push/unsubscribe`
Removes a user's push subscription.

### POST `/api/push/send`
Sends push notifications to users (called internally when recommendations are created).

## Testing

1. **Local Development**: Push notifications work on localhost without HTTPS
2. **Production**: Requires HTTPS
3. **Browser Support**: Check `pushNotifications.isSupported` before enabling

## Troubleshooting

### Common Issues

1. **"Push notifications not supported"**
   - Check if the browser supports Service Workers and Push API
   - Ensure HTTPS is enabled (except for localhost)

2. **"Notification permission denied"**
   - User must grant notification permission
   - Check browser notification settings

3. **"Failed to register subscription"**
   - Verify VAPID keys are correct
   - Check environment variables
   - Ensure database migration is complete

4. **Notifications not showing**
   - Check service worker registration
   - Verify notification payload format
   - Check browser notification settings

### Debug Mode

Enable debug logging by checking the browser console for:
- Service worker registration status
- Push event reception
- Notification display attempts

## Security Notes

- VAPID private key should never be exposed to the client
- Always validate user authentication before sending notifications
- Sanitize notification content to prevent XSS
- Use HTTPS in production for secure communication
