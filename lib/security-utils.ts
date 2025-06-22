import { NextRequest } from 'next/server';

// Rate limiting: In production, replace with Redis
const rateLimitMaps = new Map<string, Map<string, { count: number; resetTime: number }>>();

interface RateLimitConfig {
  requests: number;
  window: number; // milliseconds
}

// Rate limit configurations for different operations
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // High-frequency operations
  reactions: { requests: 100, window: 60 * 1000 }, // 100/minute
  
  // Medium-frequency operations
  messages: { requests: 50, window: 60 * 1000 }, // 50/minute
  
  // Low-frequency operations
  club_creation: { requests: 3, window: 24 * 60 * 60 * 1000 }, // 3/day
  book_creation: { requests: 10, window: 60 * 60 * 1000 }, // 10/hour
  book_upload: { requests: 10, window: 60 * 60 * 1000 }, // 10/hour
  
  // Very low-frequency operations
  feedback: { requests: 5, window: 15 * 60 * 1000 }, // 5/15min
  profile_update: { requests: 10, window: 60 * 60 * 1000 }, // 10/hour
  friend_request: { requests: 20, window: 24 * 60 * 60 * 1000 }, // 20/day
};

export const checkRateLimit = (
  userId: string, 
  operation: string, 
  config?: RateLimitConfig
): { allowed: boolean; error?: string } => {
  const rateLimitConfig = config || RATE_LIMITS[operation];
  
  if (!rateLimitConfig) {
    console.warn(`No rate limit config found for operation: ${operation}`);
    return { allowed: true };
  }

  const now = Date.now();
  const { requests: maxRequests, window: windowMs } = rateLimitConfig;

  // Get or create rate limit map for this operation
  if (!rateLimitMaps.has(operation)) {
    rateLimitMaps.set(operation, new Map());
  }
  
  const operationMap = rateLimitMaps.get(operation)!;
  const userLimit = operationMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    operationMap.set(userId, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (userLimit.count >= maxRequests) {
    return { 
      allowed: false, 
      error: `Rate limit exceeded for ${operation}. Please wait before trying again.` 
    };
  }

  // Increment count
  userLimit.count++;
  return { allowed: true };
};

// Content validation and sanitization
export const validateContent = (
  content: string, 
  options: {
    minLength?: number;
    maxLength?: number;
    allowHtml?: boolean;
    fieldName?: string;
  } = {}
): { isValid: boolean; error?: string } => {
  const { 
    minLength = 1, 
    maxLength = 2000, 
    allowHtml = false, 
    fieldName = 'Content' 
  } = options;

  // Basic validation
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  // Length validation
  if (content.trim().length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
  }

  if (content.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }

  // XSS prevention patterns
  if (!allowHtml) {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return { isValid: false, error: 'Invalid content detected' };
      }
    }
  }

  return { isValid: true };
};

// Content sanitization for HTML text content (preserves quotes for readability)
export const sanitizeContent = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')    // Must be first to avoid double-encoding
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Keep quotes as-is for better readability in book titles/descriptions
    // Quotes are not dangerous in HTML text content and are common in literary works
    // Only encode quotes when used in HTML attributes (handled separately)
    .trim();
};

// Content sanitization for HTML attributes (encodes quotes for safety)
export const sanitizeForAttribute = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')    // Must be first to avoid double-encoding
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

// Content moderation
export const moderateContent = (content: string): { isAppropriate: boolean; reason?: string } => {
  // Basic inappropriate content patterns
  const inappropriatePatterns = [
    /spam/i,
    /test123/i,
    /fuck|shit|damn/i, // Add more as needed
    /\b(viagra|casino|lottery)\b/i,
  ];

  for (const pattern of inappropriatePatterns) {
    if (pattern.test(content)) {
      return { isAppropriate: false, reason: 'Content contains inappropriate language' };
    }
  }

  // Check for excessive repetition (spam indicator)
  const words = content.toLowerCase().split(/\s+/);
  const wordCount = new Map<string, number>();
  
  for (const word of words) {
    if (word.length > 2) { // Only check words longer than 2 characters
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  }

  // If any word appears more than 5 times, consider it spam
  for (const [word, count] of wordCount.entries()) {
    if (count > 5) {
      return { isAppropriate: false, reason: 'Content appears to be spam' };
    }
  }

  return { isAppropriate: true };
};

// File upload validation
export const validateFileUpload = (
  file: File, 
  type: 'avatar' | 'book' | 'document'
): { isValid: boolean; error?: string } => {
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
    },
    document: {
      allowedTypes: ['application/pdf', 'text/plain'],
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['.pdf', '.txt']
    }
  };

  const config = configs[type];
  
  // Type validation
  if (!config.allowedTypes.includes(file.type)) {
    return { isValid: false, error: `Invalid file type. Allowed: ${config.allowedTypes.join(', ')}` };
  }

  // Size validation
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return { isValid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` };
  }

  // Extension validation
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!config.allowedExtensions.includes(extension)) {
    return { isValid: false, error: `Invalid file extension. Allowed: ${config.allowedExtensions.join(', ')}` };
  }

  return { isValid: true };
};

// Security event logging
export const logSecurityEvent = (
  event: string, 
  userId: string, 
  details: any, 
  request?: NextRequest
) => {
  const logData = {
    event,
    userId,
    timestamp: new Date().toISOString(),
    userAgent: request?.headers.get('user-agent'),
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
    ...details
  };

  console.log(`[SECURITY] ${event}`, logData);
  
  // In production: Send to monitoring service
  // Examples: DataDog, Sentry, CloudWatch
  // await sendToMonitoringService(logData);
};

// Permission validation helpers
export const validateClubPermission = async (
  prisma: any,
  userId: string, 
  clubId: string, 
  requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER'
): Promise<{ hasPermission: boolean; error?: string }> => {
  try {
    const membership = await prisma.clubMembership.findFirst({
      where: { 
        user_id: userId, 
        club_id: clubId, 
        status: 'ACTIVE' 
      }
    });

    if (!membership) {
      return { hasPermission: false, error: 'Access denied: Not a member of this club' };
    }

    const roleHierarchy: { [key: string]: number } = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    const memberRole = membership.role as string;
    
    if (roleHierarchy[memberRole] < roleHierarchy[requiredRole]) {
      return { hasPermission: false, error: 'Insufficient permissions' };
    }

    return { hasPermission: true };
  } catch (error) {
    console.error('Error checking club permission:', error);
    return { hasPermission: false, error: 'Permission check failed' };
  }
};

// Input sanitization for different data types
export const sanitizeInput = {
  clubName: (name: string): { sanitized: string; isValid: boolean; error?: string } => {
    const trimmed = name.trim();
    
    if (trimmed.length < 3 || trimmed.length > 50) {
      return { sanitized: '', isValid: false, error: 'Club name must be 3-50 characters' };
    }

    // Check moderation
    const moderation = moderateContent(trimmed);
    if (!moderation.isAppropriate) {
      return { sanitized: '', isValid: false, error: moderation.reason };
    }

    return { sanitized: trimmed, isValid: true };
  },

  bookTitle: (title: string): { sanitized: string; isValid: boolean; error?: string } => {
    const trimmed = title.trim();
    
    if (trimmed.length < 1 || trimmed.length > 200) {
      return { sanitized: '', isValid: false, error: 'Book title must be 1-200 characters' };
    }

    return { sanitized: sanitizeContent(trimmed), isValid: true };
  },

  description: (desc: string): { sanitized: string; isValid: boolean; error?: string } => {
    const validation = validateContent(desc, { maxLength: 2000, fieldName: 'Description' });
    if (!validation.isValid) {
      return { sanitized: '', isValid: false, error: validation.error };
    }

    // const moderation = moderateContent(desc);
    // if (!moderation.isAppropriate) {
    //   return { sanitized: '', isValid: false, error: moderation.reason };
    // }

    return { sanitized: sanitizeContent(desc), isValid: true };
  }
}; 