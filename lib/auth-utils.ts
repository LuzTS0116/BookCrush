import { PrismaClient } from '@prisma/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
  display_name: string;
}

/**
 * Get authenticated user with role information
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return null;
    }

    // Get user profile with role
    const profile = await prisma.profile.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        display_name: true,
        role: true,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email || undefined,
      display_name: profile.display_name,
      role: profile.role as UserRole,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Check if user has admin permissions (ADMIN or SUPER_ADMIN)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if user has moderator permissions (MODERATOR, ADMIN, or SUPER_ADMIN)
 */
export function isModerator(role: UserRole): boolean {
  return role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if user has super admin permissions
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Role hierarchy levels for comparison
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/**
 * Check if user has at least the required role level
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

/**
 * Middleware function to check admin access
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!isAdmin(user.role)) {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Middleware function to check moderator access
 */
export async function requireModerator(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!isModerator(user.role)) {
    throw new Error('Moderator access required');
  }
  
  return user;
}

/**
 * Middleware function to check super admin access
 */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!isSuperAdmin(user.role)) {
    throw new Error('Super admin access required');
  }
  
  return user;
} 