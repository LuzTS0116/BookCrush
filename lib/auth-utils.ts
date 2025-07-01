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

// Note: The refreshSessionAfterProfileSetup function has been removed
// Profile session updates are now handled directly in the profile-setup page
// using NextAuth's useSession().update() function 