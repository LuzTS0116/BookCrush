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
  const { data: session } = useSession();
  const [hasUnreadReplies, setHasUnreadReplies] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = async () => {
    if (!session?.user || !(session as any).supabaseAccessToken) return;

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
    }
  };

  useEffect(() => {
    if (session?.user && (session as any).supabaseAccessToken) {
      checkForUpdates();
    }
  }, [session?.user, (session as any).supabaseAccessToken]);

  // Listen for feedback viewed events to refresh notifications
  useEffect(() => {
    const handleFeedbackViewed = () => {
      checkForUpdates();
    };

    window.addEventListener('feedbackViewed', handleFeedbackViewed);
    return () => {
      window.removeEventListener('feedbackViewed', handleFeedbackViewed);
    };
  }, []);

  return {
    hasUnreadReplies,
    unreadCount,
    isLoading,
    error,
    checkForUpdates,
  };
} 