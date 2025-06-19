import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

interface UserRoleData {
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

export function useUserRole(): UserRoleData {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (status === 'loading') {
        return;
      }

      if (status === 'unauthenticated') {
        setRole(null);
        setIsLoading(false);
        return;
      }

      if (!session?.user?.email) {
        setError('No user email found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/user/check-profile', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }

        const data = await response.json();
        setRole(data.role);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError((err as Error).message);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [session, status]);

  return {
    role,
    isLoading,
    error,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isModerator: role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPER_ADMIN',
  };
} 