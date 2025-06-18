# Security Guide for CRUD Operations

This document outlines essential security measures implemented and recommended for all CRUD operations in the book club application.

## 🔐 Current Security Implementation

### 1. **Authentication & Authorization**
All API endpoints require authentication via NextAuth sessions:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
```

### 2. **Rate Limiting** (Implemented in Feedback API)
```typescript
// Example: 5 requests per 15 minutes for feedback
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const checkRateLimit = (userId: string) => {
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;
  // ... rate limiting logic
};
```

### 3. **Input Validation & Sanitization**
```typescript
const validateContent = (content: string) => {
  // Length validation
  if (content.length > 2000) return { isValid: false, error: 'Too long' };
  
  // XSS prevention patterns
  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) return { isValid: false, error: 'Invalid content' };
  }
  
  return { isValid: true };
};

// HTML escaping
const sanitized = content
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .trim();
```

## 🛡️ Security Measures by Operation Type

### **Book Operations**
**Endpoints**: `/api/books/*`, `/api/books/[id]/*`

**Current Security**:
- ✅ Authentication required
- ✅ Prisma disconnect in finally blocks
- ✅ Input validation for book data

**Recommended Additions**:
```typescript
// Rate limiting for book creation
const BOOK_CREATION_LIMIT = 10; // per hour per user

// File upload validation
const validateBookFile = (file: File) => {
  const allowedTypes = ['application/epub+zip', 'application/pdf'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
};

// Content moderation for book descriptions
const moderateContent = async (content: string) => {
  // Check against prohibited content patterns
  const prohibitedPatterns = [
    /spam/i, /inappropriate content/i
  ];
  
  return !prohibitedPatterns.some(pattern => pattern.test(content));
};
```

### **Club Operations**
**Endpoints**: `/api/clubs/*`, `/api/clubs/[id]/*`

**Current Security**:
- ✅ Authentication required
- ✅ Role-based access control (owner, admin, member)
- ✅ Club membership validation

**Recommended Additions**:
```typescript
// Club creation limits
const CLUB_CREATION_LIMIT = 3; // per day per user

// Club name validation
const validateClubName = (name: string) => {
  if (name.length < 3 || name.length > 50) {
    return { isValid: false, error: 'Name must be 3-50 characters' };
  }
  
  // Check for inappropriate content
  const inappropriateWords = ['spam', 'test123']; // Add more
  if (inappropriateWords.some(word => name.toLowerCase().includes(word))) {
    return { isValid: false, error: 'Inappropriate club name' };
  }
  
  return { isValid: true };
};

// Permission checks
const checkClubPermission = async (userId: string, clubId: string, requiredRole: ClubRole) => {
  const membership = await prisma.clubMembership.findFirst({
    where: { user_id: userId, club_id: clubId, status: 'ACTIVE' }
  });
  
  if (!membership) throw new Error('Access denied');
  
  const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
  if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
    throw new Error('Insufficient permissions');
  }
};
```

### **User Profile Operations**
**Endpoints**: `/api/profile/*`

**Current Security**:
- ✅ Authentication required
- ✅ User can only modify their own profile
- ✅ File upload validation for avatars

**Recommended Additions**:
```typescript
// Profile update rate limiting
const PROFILE_UPDATE_LIMIT = 10; // per hour

// Avatar upload security
const validateAvatar = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid image type');
  }
  
  if (file.size > maxSize) {
    throw new Error('Image too large');
  }
  
  // Additional: Check image dimensions
  // Additional: Scan for malicious content
};

// Sensitive data protection
const sanitizeProfileData = (data: any) => {
  // Remove sensitive fields that shouldn't be updated via API
  const { id, created_at, email, ...sanitized } = data;
  return sanitized;
};
```

### **Social Features (Friends, Reactions)**
**Endpoints**: `/api/friends/*`, `/api/reactions/*`

**Current Security**:
- ✅ Authentication required
- ✅ Relationship validation (can't friend yourself)
- ✅ Duplicate prevention

**Recommended Additions**:
```typescript
// Friend request limits
const FRIEND_REQUEST_LIMIT = 20; // per day

// Spam prevention
const checkSpamBehavior = async (userId: string) => {
  const recentRequests = await prisma.friendRequest.count({
    where: {
      senderId: userId,
      sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  
  if (recentRequests > FRIEND_REQUEST_LIMIT) {
    throw new Error('Daily friend request limit exceeded');
  }
};

// Block/report functionality
const checkBlockedUsers = async (userId: string, targetId: string) => {
  // Check if users have blocked each other
  const blocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blocker_id: userId, blocked_id: targetId },
        { blocker_id: targetId, blocked_id: userId }
      ]
    }
  });
  
  if (blocked) throw new Error('User interaction not allowed');
};
```

## 🔒 Additional Security Recommendations

### 1. **Database Security**
```typescript
// Use transactions for related operations
await prisma.$transaction(async (tx) => {
  // Multiple related operations
  const club = await tx.club.create({...});
  await tx.clubMembership.create({...});
  await tx.activityLog.create({...});
});

// Use select to limit exposed data
const user = await prisma.profile.findUnique({
  where: { id: userId },
  select: {
    id: true,
    display_name: true,
    avatar_url: true,
    // Don't include sensitive fields like email by default
  }
});
```

### 2. **File Upload Security**
```typescript
// Comprehensive file validation
const validateUpload = async (file: File, type: 'avatar' | 'book' | 'document') => {
  const configs = {
    avatar: {
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
    },
    book: {
      allowedTypes: ['application/epub+zip', 'application/pdf'],
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedExtensions: ['.epub', '.pdf']
    }
  };
  
  const config = configs[type];
  
  // Type validation
  if (!config.allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Size validation
  if (file.size > config.maxSize) {
    throw new Error('File too large');
  }
  
  // Extension validation
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!config.allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension');
  }
  
  // Additional: Virus scanning in production
  // Additional: Content analysis
};
```

### 3. **API Rate Limiting Strategy**
```typescript
// Different limits for different operations
const RATE_LIMITS = {
  // High-frequency operations
  reactions: { requests: 100, window: 60 * 1000 }, // 100/minute
  
  // Medium-frequency operations
  messages: { requests: 50, window: 60 * 1000 }, // 50/minute
  
  // Low-frequency operations
  club_creation: { requests: 3, window: 24 * 60 * 60 * 1000 }, // 3/day
  book_upload: { requests: 10, window: 60 * 60 * 1000 }, // 10/hour
  
  // Very low-frequency operations
  feedback: { requests: 5, window: 15 * 60 * 1000 }, // 5/15min
  profile_update: { requests: 10, window: 60 * 60 * 1000 }, // 10/hour
};
```

### 4. **Logging & Monitoring**
```typescript
// Security event logging
const logSecurityEvent = (event: string, userId: string, details: any) => {
  console.log(`[SECURITY] ${event}`, {
    userId,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    ...details
  });
  
  // In production: Send to monitoring service
  // Examples: DataDog, Sentry, CloudWatch
};

// Usage examples
logSecurityEvent('RATE_LIMIT_EXCEEDED', userId, { endpoint: '/api/feedback' });
logSecurityEvent('SUSPICIOUS_CONTENT', userId, { content: sanitizedContent });
logSecurityEvent('UNAUTHORIZED_ACCESS', userId, { resource: clubId });
```

### 5. **Environment & Configuration Security**
```typescript
// Environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

// Secure configuration
const CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15min
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
};
```

## 🚨 Security Checklist for New Endpoints

Before deploying any new CRUD endpoint, ensure:

- [ ] **Authentication**: Session validation implemented
- [ ] **Authorization**: User permissions checked
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Rate Limiting**: Appropriate limits set
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Logging**: Security events logged
- [ ] **Database**: Prisma disconnect in finally blocks
- [ ] **Transactions**: Related operations wrapped in transactions
- [ ] **File Uploads**: Proper validation if applicable
- [ ] **Content Moderation**: Inappropriate content filtering

## 🔍 Monitoring & Alerting

Set up alerts for:
- Multiple failed authentication attempts
- Rate limit violations
- Suspicious content uploads
- Unusual user behavior patterns
- Database connection issues
- File upload anomalies

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [File Upload Security](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) 