# Admin Role Implementation Guide

## Overview

This implementation adds a comprehensive role-based access control system to your book club platform, restricting admin dashboard access to users with appropriate permissions.

## User Roles

The system supports four role levels with hierarchical permissions:

1. **USER** (default) - Regular platform users
2. **MODERATOR** - Can moderate content and discussions
3. **ADMIN** - Can manage books, users, and platform content
4. **SUPER_ADMIN** - Full platform access including admin dashboard

## Role Hierarchy

Each higher role inherits all permissions from lower roles:
- SUPER_ADMIN > ADMIN > MODERATOR > USER

## Admin Dashboard Access

The admin dashboard (`/admin`) is restricted to **SUPER_ADMIN** users only. This provides:

### Dashboard Features
- Platform statistics (users, books, clubs, activity)
- User management interface
- Book management interface  
- Club management interface
- Feedback management interface
- Activity monitoring

### Access Control
- **Frontend**: Uses `useUserRole()` hook to check permissions
- **Backend**: Uses `requireSuperAdmin()` middleware for API protection
- **Navigation**: Admin dashboard link appears in user menu for super admins only

## Implementation Steps

### 1. Database Schema Changes

The Prisma schema has been updated to include:
- `UserRole` enum with four role levels
- `role` field added to the `Profile` model with default value `USER`

### 2. Apply Database Migration

Run the SQL migration to add the role system to your database:

```bash
# Apply the migration
psql -d your_database_name -f add_user_roles_migration.sql

# Or if using Prisma migrations
npx prisma db push
```

### 3. Regenerate Prisma Client

After schema changes, regenerate the Prisma client:

```bash
npx prisma generate
```

### 4. Authentication Utilities

A new `lib/auth-utils.ts` file provides:
- `getAuthenticatedUser()` - Gets user with role information
- `requireAdmin()` - Middleware to require admin access
- `requireModerator()` - Middleware to require moderator access
- `requireSuperAdmin()` - Middleware to require super admin access
- Role checking functions: `isAdmin()`, `isModerator()`, `isSuperAdmin()`

### 5. API Route Protection

All admin API routes have been updated to use `requireAdmin()`:
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/users` - User management
- `/api/admin/books` - Book management  
- `/api/admin/feedback` - Feedback management

### 6. Frontend Protection

The admin dashboard page (`/app/admin/page.tsx`) now:
- Checks for 403 (Forbidden) responses
- Shows appropriate error messages for non-admin users
- Redirects unauthorized users

## Assigning Admin Roles

### Method 1: Using the Script

Use the provided script to assign roles:

```bash
# Assign super admin role
npx tsx scripts/assign-admin-role.ts user@example.com SUPER_ADMIN

# Assign admin role  
npx tsx scripts/assign-admin-role.ts user@example.com ADMIN

# Assign moderator role
npx tsx scripts/assign-admin-role.ts user@example.com MODERATOR

# List all admin users
npx tsx scripts/assign-admin-role.ts --list
```

### Method 2: Direct Database Update

```sql
-- Make a user an admin
UPDATE "public"."profiles" 
SET "role" = 'ADMIN' 
WHERE "email" = 'user@example.com';

-- Make a user a super admin
UPDATE "public"."profiles" 
SET "role" = 'SUPER_ADMIN' 
WHERE "email" = 'admin@example.com';
```

### Method 3: Prisma Studio

1. Open Prisma Studio: `npx prisma studio`
2. Navigate to the `Profile` table
3. Find the user and update their `role` field

## Security Features

### Current Protections
- **Authentication Required**: All admin endpoints require valid session
- **Role-Based Access**: Only ADMIN and SUPER_ADMIN can access admin features
- **Self-Protection**: Admins cannot delete their own accounts
- **Error Handling**: Proper 401/403 status codes for unauthorized access

### HTTP Status Codes
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User authenticated but lacks admin role
- `500 Internal Server Error` - Server-side errors

## Testing the Implementation

### 1. Test Non-Admin Access
1. Log in as a regular user
2. Try to access `/admin`
3. Should see "Admin access required" error

### 2. Test Admin Access
1. Assign admin role to a user
2. Log in as that user
3. Should have full access to admin dashboard

### 3. Test API Endpoints
```bash
# Should return 403 for non-admin users
curl -H "Authorization: Bearer <user-token>" /api/admin/stats

# Should return 200 for admin users
curl -H "Authorization: Bearer <admin-token>" /api/admin/stats
```

## File Changes Made

### New Files
- `lib/auth-utils.ts` - Authentication and role checking utilities
- `scripts/assign-admin-role.ts` - Script to assign admin roles
- `add_user_roles_migration.sql` - Database migration
- `ADMIN_ROLE_IMPLEMENTATION.md` - This documentation

### Modified Files
- `prisma/schema.prisma` - Added UserRole enum and role field
- `app/api/admin/stats/route.ts` - Added role checking
- `app/api/admin/users/route.ts` - Added role checking
- `app/api/admin/users/[id]/route.ts` - Added role checking
- `app/api/admin/books/route.ts` - Added role checking
- `app/api/admin/books/[id]/route.ts` - Added role checking
- `app/api/admin/feedback/route.ts` - Added role checking
- `app/api/admin/feedback/[id]/route.ts` - Added role checking
- `app/admin/page.tsx` - Added admin access error handling

## Role Permissions

| Feature | USER | MODERATOR | ADMIN | SUPER_ADMIN |
|---------|------|-----------|-------|-------------|
| Platform Use | ✅ | ✅ | ✅ | ✅ |
| Content Moderation | ❌ | ✅ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ✅ |

## Future Enhancements

### Planned Features
1. **Granular Permissions** - More specific permission controls
2. **Role Management UI** - Admin interface to manage user roles
3. **Audit Logging** - Track admin actions
4. **Session Management** - Admin session controls
5. **IP Restrictions** - Limit admin access by IP

### Moderator Features (Future)
- Content moderation interface
- User report management
- Discussion moderation tools

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npx prisma generate` after schema changes

2. **Role field not found**
   - Ensure database migration was applied
   - Check that Prisma client was regenerated

3. **Still getting access denied**
   - Verify user role was updated in database
   - Check browser session/cookies
   - Confirm API endpoints are using new auth utils

4. **Script errors**
   - Ensure tsx is installed: `npm install -g tsx`
   - Check database connection
   - Verify user email exists

### Debugging

```bash
# Check current user roles
npx prisma studio

# Test API endpoint directly
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Cookie: your-session-cookie"

# Check server logs for authentication errors
```

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify database schema matches the updated Prisma schema
3. Ensure all environment variables are properly set
4. Test with a fresh browser session

## Security Considerations

- **Environment**: Never expose admin credentials in code
- **Sessions**: Consider shorter session timeouts for admin users
- **Monitoring**: Log all admin actions for audit trails
- **Backup**: Ensure admin role assignments are backed up
- **Recovery**: Have a plan for super admin account recovery 