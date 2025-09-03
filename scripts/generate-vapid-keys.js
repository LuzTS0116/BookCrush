const webpush = require('web-push')

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys()

console.log('VAPID Keys generated:')
console.log('')
console.log('Add these to your .env file:')
console.log('')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_EMAIL=admin@bookcrush.com`)
console.log('')
console.log('Public Key (for client):', vapidKeys.publicKey)
console.log('Private Key (for server):', vapidKeys.privateKey)
