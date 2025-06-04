# Club Invitation System - User ID Based

## Summary
The club invitation system has been updated to use user ID validation instead of email-only validation while maintaining the existing UI configuration.

## Key Changes Made

### 1. Function Signature Update
```typescript
// Before
const handleSendInvitation = async (userName: string) => { ... }

// After  
const handleSendInvitation = async (user: InvitableUser, userName: string) => { ... }
```

### 2. API Request Body
```typescript
// Now sends user_id for validation
body: JSON.stringify({
  user_id: user.id,  // Hidden ID field captured from user object
  message: inviteMessage.trim() || undefined
}),
```

### 3. Button Implementation
```typescript
// Send Invite button now passes full user object
<Button
  onClick={() => handleSendInvitation(user, user.display_name)}
  disabled={loadingInvite}
  // ... other props
>
  Send Invite
</Button>
```

## How It Works

1. **User searches** for people to invite by name/email
2. **Search results display** with user cards showing name, email, avatar
3. **Admin clicks "Send Invite"** on a specific user card  
4. **System captures user.id** from the clicked user object
5. **API validates user_id** instead of email for precise matching
6. **Invitation created** with proper user reference
7. **UI updates** with success message and refreshed pending invitations

## Benefits

- ✅ **More secure**: Direct user ID validation
- ✅ **More precise**: No ambiguity with email matching  
- ✅ **Same UX**: Existing UI flow preserved
- ✅ **Better validation**: API can verify user exists by ID
- ✅ **Clean data**: Proper foreign key relationships

## State Management

The `inviteeId` state variable is used internally but the user ID is captured directly from the user object when the button is clicked, maintaining a clean and simple UI flow.

```typescript
// State variables (existing)
const [inviteeId, setInviteeId] = useState<string | null>(null);

// User ID captured on button click (no manual selection needed)
onClick={() => handleSendInvitation(user, user.display_name)}
```

This approach provides the best of both worlds: secure user ID validation with a simple, intuitive UI. 