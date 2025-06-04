# Club Invitations Feature

This document outlines the club invitations feature that allows club owners and admins to invite new members to their book clubs.

## Database Schema

### New Models Added

#### ClubInvitation
- `id`: Unique identifier
- `club_id`: Reference to the club
- `inviter_id`: Reference to the user who sent the invitation
- `invitee_id`: Optional reference to existing user (if they have an account)
- `email`: Email address of the person being invited
- `status`: Invitation status (PENDING, ACCEPTED, DECLINED, EXPIRED)
- `message`: Optional personal message from the inviter
- `expires_at`: When the invitation expires (7 days from creation)
- `created_at`, `updated_at`: Timestamps

#### ClubInvitationStatus Enum
- `PENDING`: Invitation sent but not responded to
- `ACCEPTED`: Invitation accepted, user joined club
- `DECLINED`: Invitation declined by recipient
- `EXPIRED`: Invitation expired without response

## API Endpoints

### POST /api/clubs/[id]/invitations
- **Purpose**: Send an invitation to join a club
- **Auth**: Required (must be club admin or owner)
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "message": "Optional personal message"
  }
  ```
- **Features**:
  - Checks if user is already a member
  - Prevents duplicate invitations
  - Sets 7-day expiration
  - Works with both existing and non-existing users

### GET /api/clubs/[id]/invitations
- **Purpose**: Get pending invitations for a club
- **Auth**: Required (must be club admin or owner)
- **Response**: List of pending invitations with inviter/invitee details

### GET /api/invitations/[id]
- **Purpose**: Get invitation details for the recipient
- **Auth**: Required (must be the invitation recipient)
- **Response**: Full invitation details including club information

### PATCH /api/invitations/[id]
- **Purpose**: Accept or decline an invitation
- **Auth**: Required (must be the invitation recipient)
- **Body**:
  ```json
  {
    "action": "accept" // or "decline"
  }
  ```
- **Features**:
  - Creates club membership on acceptance
  - Updates club member count
  - Handles expired invitations

## Frontend Features

### Bulk Invites During Club Creation
- **Location**: Create Club dialog in `components/clubs-main.tsx`
- **Feature**: Input field for comma-separated email addresses
- **Behavior**: Sends invitations after club is successfully created
- **Feedback**: Shows success/failure count for bulk invites

### Individual Member Invitations
- **Location**: Club cards in My Clubs tab
- **Trigger**: "Invite Members" button (admin/owner only)
- **Dialog**: Dedicated invitation form with email and optional message
- **Features**:
  - Email validation
  - Personal message option
  - Real-time feedback

### Pending Invitations Display
- **Location**: Club cards for admins/owners
- **Features**:
  - Badge showing count of pending invitations
  - Expandable section showing invitation details
  - Shows who was invited and when
  - Visual indicators for invitation status

## User Experience Flow

### Sending Invitations

1. **During Club Creation**:
   - Fill club details
   - Add comma-separated emails in "Invite Members" field
   - Submit form
   - Invitations sent automatically after club creation

2. **For Existing Clubs**:
   - Navigate to My Clubs tab
   - Click "Invite Members" on club card (admin/owner only)
   - Enter email and optional message
   - Click "Send Invitation"

### Receiving Invitations

1. **Email Notification** (future enhancement):
   - User receives email with invitation link
   - Link directs to invitation acceptance page

2. **Direct Link Access**:
   - User can access invitation via `/invitations/[id]` URL
   - Shows club details and invitation message
   - Provides Accept/Decline buttons

3. **Invitation Response**:
   - **Accept**: User joins club automatically, membership created
   - **Decline**: Invitation marked as declined
   - **Expire**: Automatically expires after 7 days

## Permission System

### Who Can Send Invitations
- Club owners (role: OWNER)
- Club admins (role: ADMIN)

### Who Can View Pending Invitations
- Club owners and admins (for their clubs only)

### Who Can Respond to Invitations
- The specific person invited (matched by email or user ID)

## Validation & Safety Features

1. **Duplicate Prevention**:
   - Cannot invite same email twice to same club
   - Cannot invite existing members

2. **Expiration Handling**:
   - Invitations expire after 7 days
   - Expired invitations cannot be accepted

3. **Member Verification**:
   - Checks if user is already a member before creating membership
   - Atomic transactions for invitation acceptance

4. **Permission Checks**:
   - Only admins/owners can send invitations
   - Only recipients can respond to invitations

## Setup Instructions

1. **Update Database Schema**:
   ```bash
   npx prisma db push
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## Future Enhancements

### Email Integration
- Send actual email notifications with invitation links
- Email templates for different invitation types
- Reminder emails for pending invitations

### Advanced Features
- Bulk import from CSV files
- Integration with address books
- Invitation analytics for admins
- Custom invitation messages per club

### User Experience
- In-app notification system for invitations
- Invitation history and tracking
- Quick invite suggestions based on user's contacts

## Technical Notes

### Database Constraints
- Unique constraint on `[club_id, invitee_id]` prevents duplicate invitations to users
- Unique constraint on `[club_id, email]` prevents duplicate invitations to emails
- Foreign key constraints ensure data integrity

### Error Handling
- Graceful handling of expired invitations
- Clear error messages for invalid operations
- Atomic transactions for critical operations

### Performance Considerations
- Indexed queries for efficient invitation lookups
- Bulk operations for sending multiple invitations
- Lazy loading of invitation details in UI 