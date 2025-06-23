"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  type: 'BUG_REPORT' | 'FEATURE_REQUEST' | 'GENERAL_FEEDBACK' | 'COMPLAINT' | 'COMPLIMENT';
  content: string;
  status: 'PENDING' | 'REVIEWED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  admin_notes: string | null;
  admin_replied_at: string | null;
  user_notified: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedbackResponse {
  feedback: Feedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const getStatusIcon = (status: Feedback['status']) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'REVIEWED':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'IN_PROGRESS':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'RESOLVED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'DISMISSED':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: Feedback['status']) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'REVIEWED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'DISMISSED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeColor = (type: Feedback['type']) => {
  switch (type) {
    case 'BUG_REPORT':
      return 'bg-red-100 text-red-800';
    case 'FEATURE_REQUEST':
      return 'bg-purple-100 text-purple-800';
    case 'GENERAL_FEEDBACK':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLAINT':
      return 'bg-orange-100 text-orange-800';
    case 'COMPLIMENT':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatType = (type: Feedback['type']) => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export default function MyFeedback() {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchFeedback = async (page: number = 1, append: boolean = false) => {
    if (!session?.supabaseAccessToken) return;

    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      const response = await fetch(`/api/feedback/my-feedback?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data: FeedbackResponse = await response.json();

      if (append) {
        setFeedback(prev => [...prev, ...data.feedback]);
      } else {
        setFeedback(data.feedback);
      }
      
      setPagination(data.pagination);
      setError(null);
      

    } catch (err: any) {
      console.error('Error fetching feedback:', err);
      setError(err.message || 'Failed to load feedback');
      toast.error('Failed to load feedback');
    } finally {
      
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (session?.supabaseAccessToken) {
      fetchFeedback();
    }
  }, [session?.supabaseAccessToken]);

  // Function to mark feedback as viewed (called externally)
  const markFeedbackAsViewed = async () => {
    console.log("markFeedbackAsViewed function called",  feedback.length)
    if (!session?.supabaseAccessToken || feedback.length === 0) return;

    // Find feedback with unread admin replies
    const unreadFeedback = feedback.filter(f => f.admin_notes && f.admin_notes.trim() && !f.user_notified);
    
    if (unreadFeedback.length === 0) return;

    try {
      // Mark each unread feedback as viewed
      console.log("triggering markFeedbackAsViewed PATCH")
      const markPromises = unreadFeedback.map(async (feedbackItem) => {
        const response = await fetch('/api/feedback/my-feedback', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.supabaseAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feedbackId: feedbackItem.id }),
        });
        return response.ok;
      });

      await Promise.all(markPromises);
      
      // Notify other components that feedback was viewed
      console.log("marking feedback as viewed")
      window.dispatchEvent(new CustomEvent('feedbackViewed'));
    } catch (error) {
      console.error('Error marking feedback as viewed:', error);
    }
  };

  // Listen for external trigger to mark feedback as viewed
  useEffect(() => {
    const handleMarkAsViewed = () => {
      markFeedbackAsViewed();
    };
    console.log("feedback.length inside useEffect", feedback.length)
    if (feedback.length > 0 && feedback.filter(f => f.admin_notes && f.admin_notes.trim() && !f.user_notified).length > 0) {
      console.log("marking feedback as viewed inside useEffect")
      handleMarkAsViewed();
      // window.addEventListener('markFeedbackAsViewed', handleMarkAsViewed);
    }
    
    // return () => {
    //   window.removeEventListener('markFeedbackAsViewed', handleMarkAsViewed);
    // };
  }, [feedback]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      fetchFeedback(pagination.page + 1, true);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading your feedback...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchFeedback()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Feedback Submitted</h3>
        <p className="text-sm text-muted-foreground">
          You haven't submitted any feedback yet. When you do, you'll be able to track its status here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">My Feedback</h2>
        <Badge variant="secondary" className="text-xs">
          {pagination.total} total
        </Badge>
      </div>

      <div className="space-y-3">
        {feedback.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          const hasAdminReply = item.admin_notes && item.admin_notes.trim();
          const isNewReply = hasAdminReply && !item.user_notified;

          return (
            <Card key={item.id} className={`bg-bookWhite transition-all ${isNewReply ? 'ring-2 ring-accent' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(item.type)} variant="secondary">
                        {formatType(item.type)}
                      </Badge>
                      <Badge className={getStatusColor(item.status)} variant="outline">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {item.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </Badge>
                      {isNewReply && (
                        <Badge className="bg-accent text-bookWhite">
                          New Reply
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                      Submitted {new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Feedback Content */}
                  <div>
                    <h4 className="text-sm font-medium text-secondary mb-1">Your Feedback:</h4>
                    <p className={`text-sm text-secondary/80 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {item.content}
                    </p>
                  </div>

                  {/* Admin Reply */}
                  {hasAdminReply && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium text-secondary">Admin Response:</h4>
                        {item.admin_replied_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.admin_replied_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <div className="bg-secondary/5 rounded-lg p-3">
                        <p className="text-sm text-secondary/80">
                          {item.admin_notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="rounded-full"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 