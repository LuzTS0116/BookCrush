import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { prisma } from './prisma';

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Authentication required');
  }

  const user = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { 
      id: true, 
      email: true, 
      display_name: true, 
      role: true 
    }
  });

  if (!user) {
    throw new Error('User profile not found');
  }

  return user;
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  
  if (!user.role || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new Error('Admin access required');
  }
  
  return user;
}

export async function requireModerator() {
  const user = await getAuthenticatedUser();
  
  if (!user.role || !['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new Error('Moderator access required');
  }
  
  return user;
}

export async function requireSuperAdmin() {
  const user = await getAuthenticatedUser();
  
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('Super admin access required');
  }
  
  return user;
}

export function isAdmin(role: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isModerator(role: string | null): boolean {
  return role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role: string | null): boolean {
  return role === 'SUPER_ADMIN';
}

// Utility function to refresh NextAuth session after profile completion
// This should be called from a client component after profile setup is complete
export async function refreshSessionAfterProfileSetup() {
  try {
    // Dynamic import to avoid SSR issues and ensure we're on the client
    if (typeof window === 'undefined') {
      throw new Error('This function must be called from client-side code');
    }

    // First, verify the profile is complete
    const response = await fetch('/api/user/profile-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify profile status');
    }

    const data = await response.json();
    
    if (data.profileComplete) {
      // Trigger NextAuth session refresh with the 'update' trigger
      // This will cause the JWT callback to run and update the profileComplete flag
      const { getSession } = await import('next-auth/react');
      await getSession(); // Force session refresh
      
      console.log('Session refreshed after profile completion');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing session after profile setup:', error);
    return false;
  }
} 