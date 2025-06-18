# Admin Dashboard Documentation

## Overview

The Admin Dashboard provides comprehensive management tools for your book club platform. It includes statistics, user management, book management, feedback handling, and activity monitoring.

## Features

### 1. Dashboard Overview (`/admin`)
- **Statistics Cards**: Key metrics including user count, book count, active clubs, and pending feedback
- **Quick Actions**: Direct links to management sections
- **Recent Activity**: Overview of platform activity
- **Navigation**: Easy access to all admin sections

### 2. User Management (`/admin/users`)
- **User List**: View all registered users with their statistics
- **Search & Filter**: Find users by name, email, or username
- **User Details**: View user profiles, books, clubs, and friends
- **Edit Users**: Update user information (display name, nickname, email, bio)
- **Delete Users**: Remove users (with safety checks)
- **Statistics**: Users with books, club members, active users

### 3. Book Management (`/admin/books`)
- **Book Library**: View all books with metadata and statistics
- **Add Books**: Create new book entries with full details
- **Edit Books**: Update book information, cover URLs, genres, etc.
- **Delete Books**: Remove books (with dependency checks)
- **Statistics**: Popular books, books with reviews, club selections
- **Search**: Find books by title, author, or genre

### 4. Feedback Management (`/admin/feedback`)
- **Feedback List**: View all user feedback and support requests
- **Filter by Type**: Bug reports, feature requests, complaints, compliments
- **Filter by Status**: Pending, reviewed, in progress, resolved, dismissed
- **Update Status**: Change feedback status and add admin notes
- **Statistics**: Feedback counts by type and status

### 5. Activity Monitoring (`/admin/activity`)
- **Activity Feed**: Monitor platform activity and user engagement
- **Real-time Stats**: Today's activities and discussions
- **User Behavior**: Track reading patterns and social interactions

## API Endpoints

### Statistics
- `GET /api/admin/stats` - Get dashboard statistics

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get specific user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Book Management
- `GET /api/admin/books` - List all books
- `POST /api/admin/books` - Create new book
- `GET /api/admin/books/[id]` - Get specific book
- `PUT /api/admin/books/[id]` - Update book
- `DELETE /api/admin/books/[id]` - Delete book

### Feedback Management
- `GET /api/admin/feedback` - List all feedback
- `GET /api/admin/feedback/[id]` - Get specific feedback
- `PUT /api/admin/feedback/[id]` - Update feedback status

## Security Considerations

### Current Implementation
- **Authentication Required**: All admin endpoints require user authentication
- **TODO**: Implement proper admin role checking
- **Self-Protection**: Users cannot delete their own accounts

### Recommended Enhancements
1. **Role-Based Access Control**: Add admin roles to user schema
2. **Permission Levels**: Different admin permissions (read-only, moderator, super admin)
3. **Audit Logging**: Track admin actions for accountability
4. **Rate Limiting**: Prevent abuse of admin endpoints
5. **IP Restrictions**: Limit admin access to specific IP ranges

## Usage Instructions

### Accessing the Admin Dashboard
1. Navigate to `/admin` while logged in
2. Ensure your account has admin privileges (implement role check)
3. Use the navigation tabs to access different sections

### Managing Users
1. Go to **User Management** section
2. Use search to find specific users
3. Click actions menu (⋯) to edit or delete users
4. View user profiles by clicking "View Profile"

### Managing Books
1. Go to **Book Management** section
2. Click "Add Book" to create new entries
3. Use search and filters to find books
4. Edit book details or delete unused books
5. View book pages by clicking "View Book"

### Handling Feedback
1. Go to **Feedback Management** section
2. Filter by type (bug reports, feature requests, etc.)
3. Filter by status (pending, resolved, etc.)
4. Click "View Details" to see full feedback and respond
5. Update status and add admin notes

## Data Management

### Safe Deletion
- **Users**: Prevents deletion if user has associated data
- **Books**: Checks for user libraries, reviews, and club usage
- **Cascading**: Related data is properly handled

### Bulk Operations
- Currently not implemented
- Consider adding for future versions:
  - Bulk user actions
  - Bulk book imports
  - Bulk status updates

## Performance Considerations

### Database Queries
- Uses efficient Prisma queries with proper indexing
- Includes `_count` aggregations for statistics
- Implements pagination where needed

### Caching
- Consider implementing Redis caching for:
  - Dashboard statistics
  - User lists
  - Book metadata

## Future Enhancements

### Planned Features
1. **Club Management**: Full club administration
2. **Activity Monitoring**: Detailed analytics dashboard
3. **Content Moderation**: Review user-generated content
4. **System Settings**: Platform configuration
5. **Export/Import**: Data management tools
6. **Notification System**: Admin alerts and notifications

### Technical Improvements
1. **Real-time Updates**: WebSocket integration
2. **Advanced Search**: Elasticsearch integration
3. **Data Visualization**: Charts and graphs
4. **Mobile Optimization**: Responsive admin interface
5. **API Documentation**: Swagger/OpenAPI specs

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Ensure user is logged in and has admin role
2. **Permission Denied**: Check admin role implementation
3. **Data Not Loading**: Verify API endpoints and database connections
4. **Deletion Failures**: Check for dependent data that prevents deletion

### Error Handling
- All endpoints include proper error responses
- Client-side error messages provide user feedback
- Server logs capture detailed error information

## Support

For technical support or feature requests related to the admin dashboard:
1. Check the feedback system for existing reports
2. Create detailed bug reports with steps to reproduce
3. Include browser/system information for UI issues
4. Provide API response details for backend issues 