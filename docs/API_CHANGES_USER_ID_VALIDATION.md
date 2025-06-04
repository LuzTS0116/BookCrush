# API Changes: User ID Validation for Club Invitations

## Overview
Updated the club invitations API to validate by user ID instead of email, providing more secure and precise invitation handling.

## Changes Made

### 1. Request Body Update
**Before:**
```typescript
// Expected email in request body
const { email, message } = body;
```

**After:**
```typescript
// Now expects user_id in request body  
const { user_id, message } = body;

if (!user_id) {
  return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
}
```

### 2. User Lookup Logic
**Before:**
```typescript
// Looked up user by email
const existingUser = await prisma.profile.findUnique({
  where: { email },
  select: { id: true, display_name: true }
});
```

**After:**
```typescript
// Direct lookup by user ID
const inviteeUser = await prisma.profile.findUnique({
  where: { id: user_id },
  select: { id: true, display_name: true, email: true }
});

if (!inviteeUser) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 });
}
```

### 3. Membership Validation
**Before:**
```typescript
// Only checked if user existed first
if (existingUser) {
  const existingMembership = await prisma.clubMembership.findUnique({
    where: {
      user_id_club_id: {
        user_id: existingUser.id,
        club_id: clubId
      }
    }
  });
}
```

**After:**
```typescript
// Direct membership check by user_id
const existingMembership = await prisma.clubMembership.findUnique({
  where: {
    user_id_club_id: {
      user_id: user_id,
      club_id: clubId
    }
  }
});
```

### 4. Invitation Duplicate Check
**Before:**
```typescript
// Complex OR logic with email and potential user ID
const existingInvitation = await prisma.clubInvitation.findFirst({
  where: {
    club_id: clubId,
    OR: [
      { email },
      existingUser ? { invitee_id: existingUser.id } : {}
    ].filter(Boolean),
    status: 'PENDING'
  }
});
```

**After:**
```typescript
// Simple, direct check by user ID
const existingInvitation = await prisma.clubInvitation.findFirst({
  where: {
    club_id: clubId,
    invitee_id: user_id,
    status: 'PENDING'
  }
});
```

### 5. Invitation Creation
**Before:**
```typescript
// Conditional invitee_id, missing email field
{
  club_id: clubId,
  inviter_id: session.user.id,
  invitee_id: existingUser?.id || null,
  message,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}
```

**After:**
```typescript
// Always has invitee_id, email stored for reference
{
  club_id: clubId,
  inviter_id: session.user.id,
  invitee_id: user_id,
  email: inviteeUser.email, // Store email for reference
  message,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}
```

## Benefits of User ID Validation

### Security Improvements
- ✅ **No email spoofing**: Direct user ID validation prevents email-based attacks
- ✅ **Exact user matching**: No ambiguity with duplicate or similar emails
- ✅ **Referential integrity**: Proper foreign key relationships enforced

### Performance Improvements  
- ✅ **Faster lookups**: Direct ID queries instead of email searches
- ✅ **Simpler logic**: Removed complex OR conditions and filtering
- ✅ **Fewer database queries**: Streamlined validation flow

### Data Consistency
- ✅ **Always linked to users**: Invitations always have valid user references
- ✅ **Clean relationships**: Proper foreign key constraints maintained
- ✅ **Audit trail**: Clear invitation history per user

## Frontend Integration

The frontend now passes `user_id` in the request body:

```typescript
body: JSON.stringify({
  user_id: user.id,  // From selected user object
  message: inviteMessage.trim() || undefined
})
```

## Error Handling

### New Error Cases
- `400`: User ID is required (if user_id not provided)
- `404`: User not found (if user_id doesn't exist)
- `400`: User is already a member (cleaner membership check)
- `400`: Invitation already sent (simplified duplicate check)

### Maintained Error Cases
- `401`: Unauthorized (not logged in)
- `403`: Access denied (not admin/owner)
- `404`: Club not found
- `500`: Internal server error

## Database Schema Requirements

The API expects the following Prisma relationships:
- `clubInvitation.invitee_id` → `profile.id`
- `clubInvitation.club_id` → `club.id`
- `clubInvitation.inviter_id` → `profile.id`

All invitations now require a valid `invitee_id` (no more null values for this field). 