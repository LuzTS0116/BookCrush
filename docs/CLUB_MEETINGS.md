# Club Meetings Feature

This document outlines the new club meetings feature that allows club owners and admins to schedule and manage book club meetings.

## Database Schema

### New Models Added

#### ClubMeeting
- `id`: Unique identifier
- `club_id`: Reference to the club
- `book_id`: Optional reference to a specific book
- `title`: Meeting title
- `description`: Optional meeting description
- `meeting_date`: When the meeting is scheduled
- `duration_minutes`: Meeting duration (default: 90 minutes)
- `location`: Meeting location (virtual or physical)
- `meeting_type`: Type of meeting (DISCUSSION, BOOK_SELECTION, AUTHOR_QA, SOCIAL, OTHER)
- `status`: Meeting status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
- `created_by`: Who created the meeting
- `created_at`, `updated_at`: Timestamps

#### ClubMeetingAttendee
- `id`: Unique identifier
- `meeting_id`: Reference to the meeting
- `user_id`: Reference to the user
- `status`: Attendance status (NOT_RESPONDED, ATTENDING, NOT_ATTENDING, MAYBE)
- `responded_at`: When the user responded
- `created_at`: Timestamp

## API Endpoints

### GET /api/meetings
- **Purpose**: Get all meetings for the current user across all their clubs
- **Auth**: Required (Supabase session)
- **Response**: List of meetings with club and book details
- **Query Parameters**: 
  - `start`: Filter by start date
  - `end`: Filter by end date

### GET /api/clubs/[id]/meetings
- **Purpose**: Get meetings for a specific club
- **Auth**: Required (must be active club member)
- **Response**: Upcoming and past meetings for the club

### POST /api/clubs/[id]/meetings
- **Purpose**: Create a new meeting
- **Auth**: Required (must be club admin or owner)
- **Body**:
  ```json
  {
    "title": "Meeting Title",
    "description": "Optional description",
    "meeting_date": "2025-01-15T19:00:00.000Z",
    "duration_minutes": 90,
    "location": "Virtual (Zoom)",
    "meeting_type": "DISCUSSION",
    "book_id": "optional-book-id"
  }
  ```

### PATCH /api/clubs/[id]/meetings/[meetingId]/attendance
- **Purpose**: Update user's attendance status for a meeting
- **Auth**: Required (must be active club member)
- **Body**:
  ```json
  {
    "status": "ATTENDING"
  }
  ```

## Frontend Components

### Calendar Page (`components/calendar-main.tsx`)
- **Features**:
  - View all meetings across user's clubs
  - Create new meetings (admin/owner only)
  - RSVP to meetings
  - Separate upcoming and past meetings
  - Dynamic form based on selected club and available books

### Meeting Creation Form
- **Club Selection**: Only shows clubs where user is admin/owner
- **Book Selection**: Dynamically loads books for selected club
- **Meeting Types**: DISCUSSION, BOOK_SELECTION, AUTHOR_QA, SOCIAL, OTHER
- **Validation**: Ensures meeting date is in the future

## Permissions

### Who Can Create Meetings
- Club owners (role: OWNER)
- Club admins (role: ADMIN)

### Who Can View Meetings
- All active club members

### Who Can RSVP
- All active club members

## Setup Instructions

1. **Update Database Schema**:
   ```bash
   npx prisma db push
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   # or run: node scripts/generate-prisma.js
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## Usage Flow

1. **As a Club Admin/Owner**:
   - Navigate to Calendar page
   - Click "Schedule Meeting"
   - Select your club from dropdown
   - Fill in meeting details
   - Optionally select a book for discussion
   - Submit to create meeting

2. **As a Club Member**:
   - Navigate to Calendar page
   - View upcoming meetings
   - Click on attendance badge to RSVP
   - View past meetings for reference

## Future Enhancements

- Email notifications for new meetings
- Meeting reminders
- Calendar integration (Google Calendar, Outlook)
- Meeting notes and recording links
- Recurring meetings
- Meeting polls for scheduling
- Integration with video conferencing platforms

## Database Migration

If you need to reset the database:
```bash
npx prisma db push --force-reset
```

This will recreate all tables including the new meeting-related tables. 