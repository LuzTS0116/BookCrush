import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FeedbackNotifications {
  hasUnreadReplies: boolean;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  checkForUpdates: () => Promise<void>;
}

export function useFeedbackNotifications(): FeedbackNotifications {
  const { data: session, status: sessionStatus } = useSession();
  const [hasUnreadReplies, setHasUnreadReplies] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);

  const checkForUpdates = async () => {
    // Comprehensive session validation - bail early if any condition fails
    if (!session) {
      // console.log('checkForUpdates: session is null, skipping');
      return;
    }

    if (sessionStatus !== 'authenticated') {
      // console.log('checkForUpdates: session not ready, status:', sessionStatus);
      return;
    }
    
    if (!session?.user || !(session as any).supabaseAccessToken) {
      // console.log('checkForUpdates: missing user or token');
      return;
    }

    // Prevent multiple concurrent API calls
    if (isCheckingForUpdates) {
      return;
    }

    setIsCheckingForUpdates(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback/my-feedback?limit=50', {
        headers: {
          'Authorization': `Bearer ${(session as any).supabaseAccessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check feedback notifications');
      }

      const data = await response.json();
      
      // Count feedback with admin replies that user hasn't been notified about
      const unreadReplies = data.feedback.filter((f: any) => 
        f.admin_notes && f.admin_notes.trim() && !f.user_notified
      ).length;

      setUnreadCount(unreadReplies);
      setHasUnreadReplies(unreadReplies > 0);

    } catch (err: any) {
      console.error('Error checking feedback notifications:', err);
      setError(err.message || 'Failed to check notifications');
    } finally {
      setIsLoading(false);
      setIsCheckingForUpdates(false);
    }
  };

  useEffect(() => {
    // Add additional null check before proceeding
    if (!session) {
      return;
    }

    // Only check for updates when session is authenticated and tokens are available
    if (sessionStatus === 'authenticated' && session?.user && (session as any).supabaseAccessToken) {
      checkForUpdates();
    }
    
    // Reset state when user is not authenticated
    if (sessionStatus === 'unauthenticated') {
      setHasUnreadReplies(false);
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
      setIsCheckingForUpdates(false);
    }
  }, [sessionStatus, session, (session as any)?.supabaseAccessToken]);

  // Listen for feedback viewed events to refresh notifications
  useEffect(() => {
    const handleFeedbackViewed = () => {
      // console.log("feedbackViewed event triggered")
      // Only call checkForUpdates if session is ready and authenticated
      if (sessionStatus === 'authenticated' && session?.user && (session as any)?.supabaseAccessToken) {
        checkForUpdates();
      }
    };

    window.addEventListener('feedbackViewed', handleFeedbackViewed);
    return () => {
      window.removeEventListener('feedbackViewed', handleFeedbackViewed);
    };
  }, [sessionStatus, session]);

  return {
    hasUnreadReplies: sessionStatus === 'authenticated' ? hasUnreadReplies : false,
    unreadCount: sessionStatus === 'authenticated' ? unreadCount : 0,
    isLoading: sessionStatus === 'loading' ? true : isLoading,
    error: sessionStatus === 'authenticated' ? error : null,
    checkForUpdates,
  };
} 