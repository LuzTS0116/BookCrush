"use client"

import { useState, useEffect, useRef, useCallback } from "react" // Added useEffect, useCallback
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, CalendarDays, Plus, Search, Settings, Send, MessageSquare, Clock, Loader2, Check, ArrowLeft, MapPin, Reply, Edit, Trash2, MoreVertical, ChevronDown, ChevronUp } from "lucide-react" // Added icons for replies and actions
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"; // Assuming sonner for toasts
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookSelectionDialog } from '@/components/BookSelectionDialog'
import { useRouter } from "next/navigation"
import { formatRelativeDate } from "@/lib/utils";
import { useAvatarUrl } from "@/hooks/use-profile"

// --- Discussion Item Component ---
interface DiscussionItemProps {
  discussion: Discussion;
  isReply?: boolean;
  currentUserId?: string;
  club: ClubData | null;
  avatarUrl: string | null;
  expandedDiscussions: Set<string>;
  loadingDiscussionAction: Record<string, boolean>;
  editingDiscussion: string | null;
  editContent: Record<string, string>;
  replyingTo: string | null;
  replyContent: Record<string, string>;
  onToggleExpanded: (discussionId: string) => void;
  onStartEditing: (discussionId: string, content: string) => void;
  onCancelEditing: () => void;
  onStartReplying: (discussionId: string) => void;
  onCancelReplying: () => void;
  onEditDiscussion: (discussionId: string) => void;
  onDeleteDiscussion: (discussionId: string) => void;
  onReplyToDiscussion: (discussionId: string) => void;
  onEditContentChange: (discussionId: string, content: string) => void;
  onReplyContentChange: (discussionId: string, content: string) => void;
  formatRelativeDate: (date: string) => string;
}

const DiscussionItem: React.FC<DiscussionItemProps> = ({
  discussion,
  isReply = false,
  currentUserId,
  club,
  avatarUrl,
  expandedDiscussions,
  loadingDiscussionAction,
  editingDiscussion,
  editContent,
  replyingTo,
  replyContent,
  onToggleExpanded,
  onStartEditing,
  onCancelEditing,
  onStartReplying,
  onCancelReplying,
  onEditDiscussion,
  onDeleteDiscussion,
  onReplyToDiscussion,
  onEditContentChange,
  onReplyContentChange,
  formatRelativeDate,
}) => {
  const isCurrentUser = currentUserId === discussion.user.id;
  const canEdit = isCurrentUser;
  const canDelete = isCurrentUser || club?.currentUserIsAdmin;
  const isExpanded = expandedDiscussions.has(discussion.id);
  const hasReplies = discussion.replies && discussion.replies.length > 0;
  const isLoading = loadingDiscussionAction[discussion.id];

  return (
    <div className={`${isReply ? 'ml-6 border-l-2 border-primary/20 pl-4' : ''}`}>
      <div className="flex gap-3 bg-secondary-light/5 p-3 rounded-md">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={discussion.user?.avatar_url || undefined}
            alt={discussion.user?.display_name || 'User'}
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {discussion.user?.display_name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || '??'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-medium leading-none text-sm">{discussion.user?.display_name || 'Anonymous'}</p>
              {discussion.updated_at && discussion.updated_at !== discussion.created_at && (
                <span className="text-xs text-muted-foreground italic">(edited)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-serif text-secondary-light/60">
                {discussion.created_at ? formatRelativeDate(discussion.created_at) : 'Recently'}
              </p>
              {club?.currentUserMembershipStatus === 'ACTIVE' && (canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-secondary/50">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => onStartEditing(discussion.id, discussion.content)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => onDeleteDiscussion(discussion.id)}
                        disabled={isLoading}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Discussion content or edit form */}
          {editingDiscussion === discussion.id ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent[discussion.id] || ''}
                onChange={(e) => onEditContentChange(discussion.id, e.target.value)}
                className="min-h-[80px] bg-bookWhite border-secondary-light/30 p-2"
                disabled={isLoading}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onEditDiscussion(discussion.id)}
                  disabled={isLoading || !editContent[discussion.id]?.trim()}
                  className="bg-primary hover:bg-primary-light text-secondary rounded-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEditing}
                  disabled={isLoading}
                  className="rounded-full text-bookWhite"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm font-serif font-normal mt-2">{discussion.content}</p>
          )}

          {/* Action buttons */}
          {club?.currentUserMembershipStatus === 'ACTIVE' && !isReply && (
            <div className="flex flex-row justify-end items-center gap-3 mt-3">
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpanded(discussion.id)}
                  className="h-6 px-2 text-xs bg-secondary/5 text-secondary-light/70 hover:text-secondary"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {discussion.replies!.length} {discussion.replies!.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartReplying(discussion.id)}
                disabled={isLoading}
                className="h-6 px-2 text-xs text-secondary-light/70 bg-secondary/5 hover:text-secondary"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          )}

          {/* Reply form */}
          {replyingTo === discussion.id && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Your avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">ME</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent[discussion.id] || ''}
                    onChange={(e) => onReplyContentChange(discussion.id, e.target.value)}
                    className="min-h-[60px] bg-bookWhite border-secondary-light/30 text-sm"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2 ml-8">
                <Button
                  size="sm"
                  onClick={() => onReplyToDiscussion(discussion.id)}
                  disabled={isLoading || !replyContent[discussion.id]?.trim()}
                  className="bg-primary hover:bg-primary-light text-secondary rounded-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelReplying}
                  disabled={isLoading}
                  className="rounded-full text-bookWhite bg-secondary-light/80"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {hasReplies && isExpanded && (
        <div className="mt-2 space-y-2">
          {discussion.replies!.map((reply) => (
            <DiscussionItem
              key={reply.id}
              discussion={reply}
              isReply={true}
              currentUserId={currentUserId}
              club={club}
              avatarUrl={avatarUrl}
              expandedDiscussions={expandedDiscussions}
              loadingDiscussionAction={loadingDiscussionAction}
              editingDiscussion={editingDiscussion}
              editContent={editContent}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onToggleExpanded={onToggleExpanded}
              onStartEditing={onStartEditing}
              onCancelEditing={onCancelEditing}
              onStartReplying={onStartReplying}
              onCancelReplying={onCancelReplying}
              onEditDiscussion={onEditDiscussion}
              onDeleteDiscussion={onDeleteDiscussion}
              onReplyToDiscussion={onReplyToDiscussion}
              onEditContentChange={onEditContentChange}
              onReplyContentChange={onReplyContentChange}
              formatRelativeDate={formatRelativeDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export function TruncatedCard({ text, link }:{ text: string, link: string }) {
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      // scrollHeight > clientHeight means there's hidden overflow
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [text]);

  return (
    <div className="bg-secondary/5 p-2.5 rounded-md mt-2">
      <p
        ref={contentRef}
        className="text-sm/4 text-secondary font-light line-clamp-5"
      >
        {text}
      </p>

      {isClamped && (
        <Link href={link}>
          <button
            className="mt-0.5 text-sm underline text-secondary-light text-right"
          >
            view more
          </button>
        </Link>
      )}
    </div>
  );
}

// --- Define Interfaces (copied from previous thought, ensure consistency) ---

// Define ClubMembership locally, ideally this should be in @/types/book.ts
interface ClubMembership {
  id: string; // Membership ID
  user_id: string;
  club_id: string;
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
  status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | 'BANNED';
  joined_at: string; // ISO Date string  
  user: { // Added this nested user object based on your API structure
    display_name: string;
    avatar_url?: string | null; // Optional: if your API provides user avatar
    // Add other user fields like id, initials if they are part of this nested object
  };
}

interface Discussion {
  id: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  content: string;
  created_at: string;
  updated_at?: string;
  parent_discussion_id?: string | null;
  replies?: Discussion[];
}

interface BookHistoryEntry {
  id: string;  // club_book id
  book_id: string;
  started_at: string;
  finished_at: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  rating?: number | null;  // 1-5 star rating
  discussion_notes?: string | null;  // Meeting notes
  book: {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    description: string;
  };
}

interface CurrentBookDetails {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  genres?: string[];
  description: string;
  reading_time: string | null;
  pages: number | null;
}

interface ClubMembershipRequest {
  id: string; // This is the membershipId (UUID) needed for the approve API
  userId: string; // Applicant's User ID (UUID)
  userName: string;
  userAvatar: string | null;
  userInitials: string;
  appliedAt: string; // ISO string
  status: 'PENDING' | 'ACTIVE'; // Status of this specific request
}

// Interface for users that can be invited
interface InvitableUser {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string | null;
  about?: string | null;
  initials: string;
}

// Interface for pending invitations
interface PendingInvitation {
  id: string;
  email: string;
  message?: string | null;
  created_at: string;
  expires_at: string;
  inviter: {
    id: string;
    display_name: string;
  };
  invitee?: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

// Interface for member book status
interface MemberBookStatus {
  user_id: string;
  user: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  };
  role: 'MEMBER' | 'ADMIN' | 'OWNER';
  book_status: string;
  has_book: boolean;
}

// Full Club data structure for the detail page - MUST MATCH API RESPONSE EXACTLY
interface ClubData {
  id: string; // Club ID (UUID)
  name: string;
  description: string;
  memberCount: number; // Using memberCount from your schema suggestion
  ownerId: string; // The ID of the club owner

  // Current user's specific relationship to *this* club (these come from backend)
  currentUserMembershipStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | null;
  currentUserIsAdmin: boolean; // True if current user is owner_id or an ADMIN role for this club
  memberships: ClubMembership[];
  current_book: CurrentBookDetails | null;
  book_history: BookHistoryEntry[];
  discussions: Discussion[];
  pendingMemberships?: ClubMembershipRequest[]; // Populated only if currentUserIsAdmin is true
  meetings: Array<{
    id: string;
    meeting_date: string;
    location: string;
    title?: string;
  }>; // Add meetings property
}


export default function ClubDetailsView({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const [comment, setComment] = useState("");
  const [club, setClub] = useState<ClubData | null>(null); // Club data, initially null
  const [loadingClub, setLoadingClub] = useState(true); // Loading state for initial club data fetch
  const [loadingAction, setLoadingAction] = useState(false); // Loading state for join/approve actions
  const [loadingBookAction, setLoadingBookAction] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [loadingPostComment, setLoadingPostComment] = useState(false);
  
  // Complete book state
  const [bookRating, setBookRating] = useState<string>("");
  const [discussionNotes, setDiscussionNotes] = useState("");
  
  // Not completed book state
  const [notCompletedReason, setNotCompletedReason] = useState<string>("");
  const [notCompletedNotes, setNotCompletedNotes] = useState("");

  // Invitation-related state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InvitableUser[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteeId, setInviteeId] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Member book status state
  const [memberBookStatuses, setMemberBookStatuses] = useState<MemberBookStatus[]>([]);
  const [loadingMemberStatuses, setLoadingMemberStatuses] = useState(false);

  // Discussion interaction state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [editingDiscussion, setEditingDiscussion] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, string>>({});
  const [expandedDiscussions, setExpandedDiscussions] = useState<Set<string>>(new Set());
  const [loadingDiscussionAction, setLoadingDiscussionAction] = useState<Record<string, boolean>>({});


  //wrap params with React.use() 
  const router = useRouter();
  const {id} = useParams();
  

  const {
    avatarUrl
  } = useAvatarUrl()
  
  // Function to fetch full club details from the API
  const fetchClubDetails = useCallback(async () => {
    setLoadingClub(true);
    try {
      const response = await fetch(`/api/clubs/${id}`); // Call your new API endpoint
      if (!response.ok) {
        throw new Error(`Failed to fetch club data: ${response.statusText}`);
      }
      const data: ClubData = await response.json(); // Cast to ClubData interface
      setClub(data);
      
    } catch (err: any) {
      toast.error(`Error fetching club details: ${err.message}`);
      console.error("Error fetching club details:", err);
      setClub(null); // Set to null on error
    } finally {
      setLoadingClub(false);
    }
  }, [id]);
  
  // Initial data load on component mount
  useEffect(() => {
    fetchClubDetails();
  }, [fetchClubDetails]); // Depend on memoized fetch function

  // --- Integration for JOIN API (`/app/api/clubs/join`) ---
  const handleJoinClub = async () => {
    setLoadingAction(true);
    try {
      if (!club) {
        toast.error("Club data not loaded yet.");
        return;
      }
      const response = await fetch('/api/clubs/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clubId: club.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join club.");
      }

      const result = await response.json();
      console.log("Join successful:", result);
      toast.success("Successfully applied to join the club! Your request is pending approval.");

      // After action, refetch club details to update UI state
      await fetchClubDetails();

    } catch (err: any) {
      toast.error(`Error joining club: ${err.message}`);
      console.error("Error joining club:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Integration for APPROVE API (`/app/api/clubs/approve`) ---
  const handleApproveMembership = async (membershipId: string, applicantName: string) => {
    setLoadingAction(true);
    try {
      if (!club) {
        toast.error("Club data not loaded yet.");
        return;
      }
      const response = await fetch('/api/clubs/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipId: membershipId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve membership.");
      }

      const result = await response.json();
      console.log("Approval successful:", result);
      toast.success(`Successfully approved ${applicantName}'s membership!`);

      // After action, refetch club details to update UI state (remove from pending, update member count)
      await fetchClubDetails();

    } catch (err: any) {
      toast.error(`Error approving membership: ${err.message}`);
      console.error("Error approving membership:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Function to set current book
  const handleSetCurrentBook = async (bookId: string) => {
    setLoadingBookAction(true);
    try {
      const response = await fetch(`/api/clubs/${id}/current-book`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set current book.");
      }

      toast.success("Successfully set current book!");
      await fetchClubDetails(); // Refresh club data
    } catch (err: any) {
      toast.error(`Error setting current book: ${err.message}`);
      console.error("Error setting current book:", err);
    } finally {
      setLoadingBookAction(false);
    }
  };

  // Function to delete current book
  const handleDeleteCurrentBook = async () => {
    setLoadingBookAction(true);
    try {
      const response = await fetch(`/api/clubs/${id}/current-book`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete current book.");
      }

      toast.success("Successfully deleted current book!");
      await fetchClubDetails(); // Refresh club data
    } catch (err: any) {
      toast.error(`Error deleting current book: ${err.message}`);
      console.error("Error deleting current book:", err);
    } finally {
      setLoadingBookAction(false);
      setBookDialogOpen(false);
    }
  };

  // Function to update book status
  const handleUpdateBookStatus = async (clubBookId: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED') => {
    setLoadingBookAction(true);
    try {
      const response = await fetch(`/api/clubs/${id}/books`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubBookId,
          status,
          finishedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update book status.");
      }

      toast.success(`Successfully updated book status to ${status.toLowerCase()}!`);
      await fetchClubDetails(); // Refresh club data
    } catch (err: any) {
      toast.error(`Error updating book status: ${err.message}`);
      console.error("Error updating book status:", err);
    } finally {
      setLoadingBookAction(false);
    }
  };

  // Function to complete current book with rating and notes
  const handleCompleteBook = async () => {
    if (!bookRating || !discussionNotes.trim()) {
      toast.error("Please provide both a rating and discussion notes.");
      return;
    }

    setLoadingBookAction(true);
    try {
      const response = await fetch(`/api/clubs/${id}/complete-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          rating: parseInt(bookRating),
          discussionNotes: discussionNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete book.");
      }

      const result = await response.json();
      toast.success("Book completed successfully and moved to history!");
      
      // Reset form state
      setBookRating("");
      setDiscussionNotes("");
      
      // Refresh club data
      await fetchClubDetails();
    } catch (err: any) {
      toast.error(`Error completing book: ${err.message}`);
      console.error("Error completing book:", err);
    } finally {
      setLoadingBookAction(false);
    }
  };

  // Function to mark current book as not completed
  const handleNotCompleteBook = async () => {
    if (!notCompletedReason || !notCompletedNotes.trim()) {
      toast.error("Please provide both a reason and explanation notes.");
      return;
    }

    setLoadingBookAction(true);
    try {
      // Combine reason and notes for discussionNotes
      const combinedNotes = `Reason: ${getReasonText(notCompletedReason)}\n\nNotes: ${notCompletedNotes.trim()}`;
      
      const response = await fetch(`/api/clubs/${id}/complete-book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ABANDONED',
          discussionNotes: combinedNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark book as not completed.");
      }

      const result = await response.json();
      toast.success("Book marked as not completed and moved to history!");
      
      // Reset form state
      setNotCompletedReason("");
      setNotCompletedNotes("");
      
      // Refresh club data
      await fetchClubDetails();
    } catch (err: any) {
      toast.error(`Error marking book as not completed: ${err.message}`);
      console.error("Error marking book as not completed:", err);
    } finally {
      setLoadingBookAction(false);
    }
  };

  // Helper function to get reason text
  const getReasonText = (reasonValue: string) => {
    const reasons = {
      "1": "Lost interest in the story",
      "2": "Didn't have enough time",
      "3": "Too confusing or hard to follow",
      "4": "Not in the right mood for this book",
      "5": "Planning to finish later",
      "6": "Didn't connect with the characters or style",
      "7": "Offensive or uncomfortable content",
      "8": "Too slow-paced or boring",
      "9": "Overwhelmed by other reads",
      "10": "Other"
    };
    return reasons[reasonValue as keyof typeof reasons] || "Unknown reason";
  };

  // --- NEW: Function to handle posting a comment ---
  const handlePostComment = async () => {
    if (!comment.trim()) {
      toast.info("Comment cannot be empty.");
      return;
    }
    if (!club) {
      toast.error("Club data not available. Please try again.");
      return;
    }
    if (club.currentUserMembershipStatus !== 'ACTIVE') {
      toast.error("Only active members can post comments.");
      return;
    }

    setLoadingPostComment(true);
    try {
      if (!session?.supabaseAccessToken) {
        toast.error("Please log in to post comment");
        return;
      }
      
      const response = await fetch(`/api/clubs/${club.id}/discussions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({
          text: comment,
          bookId: club.current_book?.id || null, // Send bookId if a current book exists
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post comment.");
      }

      const newDiscussion = await response.json();
      console.log("New discussion posted:", newDiscussion);
      
      // Update the club state locally instead of refetching
      setClub(prevClub => {
        if (!prevClub) return prevClub;
        
        return {
          ...prevClub,
          discussions: [
            {
              id: newDiscussion.id,
              content: newDiscussion.content,
              created_at: newDiscussion.created_at,
              updated_at: newDiscussion.updated_at,
              parent_discussion_id: null,
              user: {
                id: newDiscussion.user.id,
                display_name: newDiscussion.user.display_name,
                avatar_url: newDiscussion.user.avatar_url
              },
              replies: []
            },
            ...prevClub.discussions
          ]
        };
      });
      
      toast.success("Comment posted successfully!");
      setComment(""); // Clear the textarea

    } catch (err: any) {
      toast.error(`Error posting comment: ${err.message}`);
      console.error("Error posting comment:", err);
    } finally {
      setLoadingPostComment(false);
    }
  };

  // --- NEW: Function to search for users to invite ---
  const searchUsers = async (query: string) => {
    if (!query.trim() || !club) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await fetch(`/api/clubs/${club.id}/search-users?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search users.");
      }

      const data = await response.json();
      setSearchResults(data.users || []);

    } catch (err: any) {
      toast.error(`Error searching users: ${err.message}`);
      console.error("Error searching users:", err);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // --- NEW: Function to send invitation ---
  const handleSendInvitation = async (user: InvitableUser, userName: string) => {
    if (!club) {
      toast.error("Club data not available.");
      return;
    }

    if (!session?.supabaseAccessToken) {
      toast.error("Please log in to send invitation");
      return;
    }

    setLoadingInvite(true);
    try {
      const response = await fetch(`/api/clubs/${club.id}/invitations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          message: inviteMessage.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation.");
      }

      const result = await response.json();
      toast.success(`Invitation sent to ${userName}!`);
      
      // Clear search and close dialog
      setSearchQuery("");
      setSearchResults([]);
      setInviteMessage("");
      setInviteeId(null);
      setInviteDialogOpen(false);

      // Refresh pending invitations list
      await fetchPendingInvitations();

    } catch (err: any) {
      toast.error(`Error sending invitation: ${err.message}`);
      console.error("Error sending invitation:", err);
    } finally {
      setLoadingInvite(false);
    }
  };

  // --- NEW: Debounced search effect ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, club?.id]);

  // --- NEW: Function to fetch pending invitations ---
  const fetchPendingInvitations = useCallback(async () => {
    if (!club?.currentUserIsAdmin || !id) return;

    if (!session?.supabaseAccessToken) {
      toast.error("No session found");
      return;
    }
    
    setLoadingInvitations(true);
    try {
      const response = await fetch(`/api/clubs/${id}/invitations`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },

    });
      
      if (!response.ok) {
        throw new Error("Failed to fetch pending invitations");
      }

      const data = await response.json();
      setPendingInvitations(data.invitations || []);

    } catch (err: any) {
      console.error("Error fetching pending invitations:", err);
      setPendingInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  }, [club?.currentUserIsAdmin, id]);

  // --- NEW: Function to fetch member book statuses ---
  const fetchMemberBookStatuses = useCallback(async () => {
    if (!club?.current_book || !id || !session?.supabaseAccessToken) {
      setMemberBookStatuses([]);
      return;
    }
    
    setLoadingMemberStatuses(true);
    try {
      const response = await fetch(`/api/clubs/${id}/members/book-status`, {
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch member book statuses");
      }

      const data = await response.json();
      setMemberBookStatuses(data.memberStatuses || []);

    } catch (err: any) {
      console.error("Error fetching member book statuses:", err);
      setMemberBookStatuses([]);
    } finally {
      setLoadingMemberStatuses(false);
    }
  }, [club?.current_book, id, session?.supabaseAccessToken]);

  // Fetch pending invitations when club data loads and user is admin
  useEffect(() => {
    if (club?.currentUserIsAdmin) {
      fetchPendingInvitations();
    }
  }, [club?.currentUserIsAdmin, fetchPendingInvitations]);

  // Fetch member book statuses when club data loads
  useEffect(() => {
    if (club) {
      fetchMemberBookStatuses();
    }
  }, [club, fetchMemberBookStatuses]);

  // --- NEW: Discussion interaction functions ---
  
  // Handle reply to discussion
  const handleReplyToDiscussion = async (discussionId: string) => {
    const content = replyContent[discussionId]?.trim();
    if (!content || !club || !session?.supabaseAccessToken) {
      toast.error("Please enter a reply");
      return;
    }

    setLoadingDiscussionAction(prev => ({ ...prev, [discussionId]: true }));
    try {
      const response = await fetch(`/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post reply");
      }

      const newReply = await response.json();
      
      // Update the club state locally instead of refetching everything
      setClub(prevClub => {
        if (!prevClub) return prevClub;
        
        const updatedDiscussions = prevClub.discussions.map(discussion => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              replies: [...(discussion.replies || []), {
                id: newReply.id,
                content: newReply.content,
                created_at: newReply.created_at,
                updated_at: newReply.updated_at,
                parent_discussion_id: newReply.parent_discussion_id,
                user: {
                  id: newReply.user.id,
                  display_name: newReply.user.display_name,
                  avatar_url: newReply.user.avatar_url
                }
              }]
            };
          }
          return discussion;
        });
        
        return {
          ...prevClub,
          discussions: updatedDiscussions
        };
      });

      toast.success("Reply posted successfully!");
      setReplyContent(prev => ({ ...prev, [discussionId]: '' }));
      setReplyingTo(null);
      
      // Expand the discussion to show the new reply
      setExpandedDiscussions(prev => new Set([...prev, discussionId]));

    } catch (err: any) {
      toast.error(`Error posting reply: ${err.message}`);
      console.error("Error posting reply:", err);
    } finally {
      setLoadingDiscussionAction(prev => ({ ...prev, [discussionId]: false }));
    }
  };

  // Handle edit discussion
  const handleEditDiscussion = async (discussionId: string) => {
    const content = editContent[discussionId]?.trim();
    if (!content || !session?.supabaseAccessToken) {
      toast.error("Please enter content");
      return;
    }

    setLoadingDiscussionAction(prev => ({ ...prev, [discussionId]: true }));
    try {
      const response = await fetch(`/api/discussions/${discussionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to edit discussion");
      }

      const updatedDiscussion = await response.json();
      
      // Update the club state locally
      setClub(prevClub => {
        if (!prevClub) return prevClub;
        
        const updateDiscussionInList = (discussions: Discussion[]): Discussion[] => {
          return discussions.map(discussion => {
            if (discussion.id === discussionId) {
              return {
                ...discussion,
                content: updatedDiscussion.content,
                updated_at: updatedDiscussion.updated_at
              };
            }
            // Also check replies
            if (discussion.replies) {
              return {
                ...discussion,
                replies: updateDiscussionInList(discussion.replies)
              };
            }
            return discussion;
          });
        };
        
        return {
          ...prevClub,
          discussions: updateDiscussionInList(prevClub.discussions)
        };
      });

      toast.success("Discussion updated successfully!");
      setEditContent(prev => ({ ...prev, [discussionId]: '' }));
      setEditingDiscussion(null);

    } catch (err: any) {
      toast.error(`Error editing discussion: ${err.message}`);
      console.error("Error editing discussion:", err);
    } finally {
      setLoadingDiscussionAction(prev => ({ ...prev, [discussionId]: false }));
    }
  };

  // Handle delete discussion
  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!session?.supabaseAccessToken) {
      toast.error("Authentication required");
      return;
    }

    if (!confirm("Are you sure you want to delete this discussion? This action cannot be undone.")) {
      return;
    }

    setLoadingDiscussionAction(prev => ({ ...prev, [discussionId]: true }));
    try {
      const response = await fetch(`/api/discussions/${discussionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.supabaseAccessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete discussion");
      }

      // Update the club state locally by removing the discussion
      setClub(prevClub => {
        if (!prevClub) return prevClub;
        
        const removeDiscussionFromList = (discussions: Discussion[]): Discussion[] => {
          return discussions
            .filter(discussion => discussion.id !== discussionId)
            .map(discussion => ({
              ...discussion,
              replies: discussion.replies ? removeDiscussionFromList(discussion.replies) : []
            }));
        };
        
        return {
          ...prevClub,
          discussions: removeDiscussionFromList(prevClub.discussions)
        };
      });

      toast.success("Discussion deleted successfully!");

    } catch (err: any) {
      toast.error(`Error deleting discussion: ${err.message}`);
      console.error("Error deleting discussion:", err);
    } finally {
      setLoadingDiscussionAction(prev => ({ ...prev, [discussionId]: false }));
    }
  };

  // Toggle expanded state for discussion replies
  const toggleDiscussionExpanded = (discussionId: string) => {
    setExpandedDiscussions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId);
      } else {
        newSet.add(discussionId);
      }
      return newSet;
    });
  };

  // Start editing a discussion
  const startEditingDiscussion = (discussionId: string, currentContent: string) => {
    setEditingDiscussion(discussionId);
    setEditContent(prev => ({ ...prev, [discussionId]: currentContent }));
  };

  // Cancel editing
  const cancelEditingDiscussion = () => {
    setEditingDiscussion(null);
    setEditContent({});
  };

  // Start replying to a discussion
  const startReplyingToDiscussion = (discussionId: string) => {
    setReplyingTo(discussionId);
    setReplyContent(prev => ({ ...prev, [discussionId]: '' }));
  };

    // Cancel replying
  const cancelReplyingToDiscussion = () => {
    setReplyingTo(null);
    setReplyContent({});
  };

  // --- Loading State and Error Handling for UI ---
  if (loadingClub) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-lg text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading club details...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-lg text-red-500">
        <p>Club not found or an error occurred.</p>
        <Button onClick={fetchClubDetails} className="mt-4">Retry Load</Button>
      </div>
    );
  }

  // --- Main Render Section ---
  return (
    <div className='space-y-3 px-2 mb-16'>
      
      {/* Header Section */}
      <Card className="bg-bookWhite/90 rounded-xl overflow-hidden mt-0">
        <CardHeader className="relative p-0">
          {/* Banner */}
          <div className="relative h-32 w-full bg-gradient-to-r from-primary rounded-b-2xl to-accent">
              <img
                  src="/images/background.png"
                  alt="Banner"
                  className="object-cover w-full h-full"
              />

              {/* Back Button */}
              <button
                  onClick={() => router.back()} // Revert to browser history navigation
                  className="absolute top-3 left-3 p-2 rounded-full bg-bookWhite/80 backdrop-blur-sm hover:bg-bookWhite shadow-md"
              >
                  <ArrowLeft className="h-5 w-5 text-secondary" />
              </button>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-1 px-3 pb-2">
            <div className="">
              <div className="flex flex-row justify-between items-start mt-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl/7 break-words font-bold tracking-tight text-secondary">{club.name}</h1>
                </div>
                <div>
                  {/* Display Admin badge if current user is an admin */}
                  {club.currentUserIsAdmin && (
                    <Badge variant="outline" className="bg-secondary-light border-none">
                      Admin
                    </Badge>
                  )}
                  {/* Conditional Badges for Membership Status */}
                  {club.currentUserMembershipStatus === 'ACTIVE' && (
                    <Badge className="bg-accent-variant/80 hover:bg-accent-variant text-bookWhite ml-2">
                      Member
                    </Badge>
                  )}
                  {club.currentUserMembershipStatus === 'PENDING' && (
                    <Badge variant="secondary" className="ml-1">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-secondary font-serif font-normal mt-1">{club.description}</p>
            </div>
          </div>
        </CardHeader>
        {/* <CardContent className="pt-0">
        </CardContent> */}
      </Card>
      

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="md:col-span-2">
          <Card className="bg-bookWhite/90 py-2">
            <CardHeader className="px-3 pt-3 pb-0">
              <CardTitle className="px-0 pb-2 text-secondary">Current Book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-3 pt-1.5 pb-3">
              {club.current_book ? (
                <div className="">
                  <div className="flex flex-row gap-2 bg-secondary/5 p-2.5 rounded-md">
                    <div className="w-[100px] flex-shrink-0">                      
                      <Link href={`/books/${club.current_book.id}`}>
                        <img
                          src={club.current_book.cover_url || "/placeholder.svg"}
                          alt={`${club.current_book.title} cover` || "Book cover"}
                          className="h-full w-full rounded-md shadow-md object-cover"
                        />
                      </Link>
                    </div>
                    <div className="flex-1">
                      <Link href={`/books/${club.current_book.id}`}>
                        <h3 className="text-xl/4 font-semibold">{club.current_book.title}</h3>
                      </Link>
                      <p className="text-sm text-secondary-light/70">{club.current_book.author}</p>

                      {/* Genre Tags */}
                      {club.current_book.genres && (
                      <div className="flex flex-wrap gap-1">
                        {club.current_book.genres?.slice(0, 2).map((genre: string) => (
                          <span
                            key={genre}
                            className="bg-accent/30 text-secondary/40 text-xs/3 font-medium px-2 py-1 rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                      )}

                      {/* Pages & Time */}
                      {club.current_book.pages && (
                      <div className="flex-1">
                        <p className="text-secondary/80 font-sans font-normal text-sm inline-block">{club.current_book.pages} pages • {club.current_book.reading_time}</p>
                      </div>
                      )}
                    </div>
                  </div>
                  <TruncatedCard 
                    text={club.current_book.description}
                    link={`/books/${club.current_book.id}`}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 mb-4" />
                  <p>No book currently selected</p>
                  {club.currentUserIsAdmin && (
                    <p className="text-sm mt-2">As an admin, you can set a current book for the club.</p>
                  )}
                </div>
              )}
            </CardContent>
            {club.currentUserIsAdmin && (
              <CardFooter className="flex justify-end flex-wrap gap-2 pb-3 px-3">
                {club.current_book ? (
                  <div>
                    <Dialog onOpenChange={(open) => {
                      if (!open) {
                        // Reset form when dialog closes
                        setNotCompletedReason("");
                        setNotCompletedNotes("");
                      }
                    }}>
                      <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={loadingBookAction}
                            className="bg-secondary-light hover:bg-secondary text-bookWhite rounded-full"
                          >
                            Book Not Completed
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[85vw] rounded-2xl">
                          <Image 
                            src="/images/background.png"
                            alt="Create and Manage your Book Clubs | BookCrush"
                            width={1622}
                            height={2871}
                            className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
                          />
                          <DialogHeader>
                          <DialogTitle>Book Not Completed</DialogTitle>
                          <DialogDescription>
                              Let us know why this one didn't work out.
                          </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                          <div className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
                              <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                              <img
                                  src={club.current_book?.cover_url || "/placeholder.svg"} // Optional chaining
                                  alt={`${club.current_book?.title || 'No book'} cover`}
                                  className="max-h-full"
                              />
                              </div>
                              <div>
                              <p className="font-medium text-sm">{club.current_book?.title}</p>
                              <p className="text-xs text-muted-foreground">{club.current_book?.author}</p>
                              </div>
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="not-completed-reason">Reason for not completing</Label>
                              <Select value={notCompletedReason} onValueChange={setNotCompletedReason}>
                              <SelectTrigger id="not-completed-reason" className="font-medium">
                                  <SelectValue placeholder="Select reason" className="font-medium"/>
                              </SelectTrigger>
                              <SelectContent className="font-medium">
                                <SelectItem value="1">📖 Lost interest in the story</SelectItem>
                                <SelectItem value="2">🕒 Didn't have enough time</SelectItem>
                                <SelectItem value="3">🤯 Too confusing or hard to follow</SelectItem>
                                <SelectItem value="4">😔 Not in the right mood for this book</SelectItem>
                                <SelectItem value="5">🔁 Planning to finish later</SelectItem>
                                <SelectItem value="6">😐 Didn't connect with the characters or style</SelectItem>
                                <SelectItem value="7">❌ Offensive or uncomfortable content</SelectItem>
                                <SelectItem value="8">💤 Too slow-paced or boring</SelectItem>
                                <SelectItem value="9">📚 Overwhelmed by other reads</SelectItem>
                                <SelectItem value="10">✍️ Other (will explain below)</SelectItem>
                              </SelectContent>
                              </Select>
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="not-completed-notes">Notes or Thoughts</Label>
                              <Textarea
                              id="not-completed-notes"
                              placeholder="Summarize the reasons for this book to be not completed"
                              value={notCompletedNotes}
                              onChange={(e) => setNotCompletedNotes(e.target.value)}
                              className="bg-bookWhite font-serif font-medium text-secondary placeholder:text-secondary/50 placeholder:font-serif placeholder:italic placeholder:text-sm"
                              rows={4}
                              />
                          </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              type="submit"
                              onClick={handleNotCompleteBook}
                              disabled={loadingBookAction || !notCompletedReason || !notCompletedNotes.trim()}
                              className="bg-secondary-light hover:bg-secondary text-bookWhite rounded-full"
                            >
                              {loadingBookAction ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Book Not Completed"
                              )}
                            </Button>
                          </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog onOpenChange={(open) => {
                      if (!open) {
                        // Reset form when dialog closes
                        setBookRating("");
                        setDiscussionNotes("");
                      }
                    }}>
                      <DialogTrigger asChild>
                          <Button variant="outline" className="ml-2 text-secondary rounded-full bg-primary hover:bg-primary-dark hover:text-secondary border-none">
                          Complete Meeting
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[85vw] rounded-2xl">
                          <Image 
                            src="/images/background.png"
                            alt="Create and Manage your Book Clubs | BookCrush"
                            width={1622}
                            height={2871}
                            className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
                          />
                          <DialogHeader>
                          <DialogTitle>Complete Book Meeting</DialogTitle>
                          <DialogDescription>
                              Mark the current book as completed and add it to history.
                          </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                          <div className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
                              <div className="w-16 h-24 bg-muted/30 rounded flex items-center justify-center overflow-hidden">
                              <img
                                  src={club.current_book?.cover_url || "/placeholder.svg"} // Optional chaining
                                  alt={`${club.current_book?.title || 'No book'} cover`}
                                  className="max-h-full"
                              />
                              </div>
                              <div>
                              <p className="font-medium text-sm">{club.current_book?.title}</p>
                              <p className="text-xs text-muted-foreground">{club.current_book?.author}</p>
                              </div>
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="rating">Book Rating (1-5)</Label>
                              <Select value={bookRating} onValueChange={setBookRating}>
                              <SelectTrigger id="rating" className="font-medium">
                                  <SelectValue placeholder="Select rating" className="font-medium"/>
                              </SelectTrigger>
                              <SelectContent className="font-medium">
                                <SelectItem value="1">1 - DNF / Frustrating Read</SelectItem>
                                <SelectItem value="2">2 - Underwhelming</SelectItem>
                                <SelectItem value="3">3 - Decent, not memorable</SelectItem>
                                <SelectItem value="4">4 - Like it / Great discussion pick</SelectItem>
                                <SelectItem value="5">5 - Masterpiece / Instant favorite</SelectItem>
                              </SelectContent>
                              </Select>
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="discussion-notes">Discussion Notes</Label>
                              <Textarea
                              id="discussion-notes"
                              placeholder="Summarize the key points from your discussion"
                              value={discussionNotes}
                              onChange={(e) => setDiscussionNotes(e.target.value)}
                              className="bg-bookWhite font-serif font-medium text-secondary placeholder:font-serif placeholder:italic placeholder:text-sm"
                              rows={4}
                              />
                          </div>
                          </div>
                          <DialogFooter>
                          <Button 
                            type="submit" 
                            onClick={handleCompleteBook}
                            disabled={loadingBookAction || !bookRating || !discussionNotes.trim()}
                            className="bg-primary hover:bg-primary-light text-primary-foreground rounded-full"
                          >
                            {loadingBookAction ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Completing...
                              </>
                            ) : (
                              "Complete & Archive"
                            )}
                          </Button>
                          </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>         
                ) : (
                  <Button
                    onClick={() => setBookDialogOpen(true)}
                    disabled={loadingBookAction}
                    className="bg-primary hover:bg-primary-light text-secondary rounded-full"
                  >
                    {loadingBookAction ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-1 h-4 w-4" />
                    )}
                    {club.current_book ? 'Set New Book' : 'Set Current Book'}
                  </Button>
                )}
                <BookSelectionDialog
                  open={bookDialogOpen}
                  onOpenChange={setBookDialogOpen}
                  onBookSelect={handleSetCurrentBook}
                />
              </CardFooter>
            )}
          </Card>

          <div className="mt-3">
            <Tabs defaultValue="discussions" className="space-y-3">
              <div className="flex justify-center">
              <TabsList className="bg-secondary-light text-primary rounded-full">
                <TabsTrigger
                  value="discussions"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Current Discussions
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-bookWhite data-[state=active]:text-primary-foreground rounded-full"
                >
                  Book History
                </TabsTrigger>
              </TabsList>
              </div>

              <TabsContent value="discussions">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-xl/6 text-secondary">
                      {club.current_book ? `Discussions: ${club.current_book.title}` : "Select a Current Book"}
                    </CardTitle>
                    <CardDescription className="font-serif text-secondary font-normal text-sm/3">
                      {club.current_book
                        ? "Share your thoughts on the current book (no spoilers!)"
                        : "Select a current book to start book-specific discussions."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3">
                    {club.discussions && club.discussions.length > 0 ? (
                      <div className="space-y-3">
                        {club.discussions.map((discussion) => (
                          <DiscussionItem
                            key={discussion.id}
                            discussion={discussion}
                            currentUserId={session?.user?.id}
                            club={club}
                            avatarUrl={avatarUrl}
                            expandedDiscussions={expandedDiscussions}
                            loadingDiscussionAction={loadingDiscussionAction}
                            editingDiscussion={editingDiscussion}
                            editContent={editContent}
                            replyingTo={replyingTo}
                            replyContent={replyContent}
                            onToggleExpanded={toggleDiscussionExpanded}
                            onStartEditing={startEditingDiscussion}
                            onCancelEditing={cancelEditingDiscussion}
                            onStartReplying={startReplyingToDiscussion}
                            onCancelReplying={cancelReplyingToDiscussion}
                            onEditDiscussion={handleEditDiscussion}
                            onDeleteDiscussion={handleDeleteDiscussion}
                            onReplyToDiscussion={handleReplyToDiscussion}
                            onEditContentChange={(discussionId, content) => 
                              setEditContent(prev => ({ ...prev, [discussionId]: content }))
                            }
                            onReplyContentChange={(discussionId, content) => 
                              setReplyContent(prev => ({ ...prev, [discussionId]: content }))
                            }
                            formatRelativeDate={formatRelativeDate}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                        {club.current_book && (
                          <>
                            <p>No discussions yet for "{club.current_book.title}".</p>
                            {club.currentUserMembershipStatus === 'ACTIVE' && (
                              <p className="text-sm mt-2">Be the first to share your thoughts below!</p>
                            )}
                          </>
                        ) }
                      </div>
                    )}

                    <Separator className="my-6" />

                    {/* Comment submission section - only for ACTIVE members */}
                    {club.currentUserMembershipStatus === 'ACTIVE' ? (
                      <form onSubmit={(e) => { e.preventDefault(); handlePostComment(); }} className="flex gap-4">
                        <Avatar className="h-10 w-10">
                          {/* Replace with actual current user avatar logic if available */}
                          <AvatarImage src={avatarUrl || "placeholder.svg?height=40&width=40"} alt="Your avatar" />
                          <AvatarFallback className="bg-primary text-primary-foreground">ME</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Share your thoughts..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] bg-secondary/5 text-secondary border-none p-2 placeholder:text-secondary/35 sans-serif text-sm"
                            disabled={loadingPostComment}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                handlePostComment();
                              }
                            }}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              className="bg-primary hover:bg-primary-light rounded-full text-secondary"
                              disabled={loadingPostComment || !comment.trim()}
                            >
                              {loadingPostComment ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="mr-0 h-4 w-4" />
                              )}
                              Post Comment
                            </Button>
                          </div>        
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        {club.currentUserMembershipStatus === 'PENDING' ? (
                          <p>Your membership is pending approval. Once approved, you can join discussions.</p>
                        ) : club.currentUserMembershipStatus === 'REJECTED' || club.currentUserMembershipStatus === 'LEFT' ? (
                          <p>Your previous application was not approved or you have left the club. You can apply again if you wish.</p>
                        ) : (
                          <p>You must be an active member of this club to post comments or participate in discussions.</p>
                        )}

                        {/* Show Join Club button if user is not admin AND not already PENDING */}
                        {/* (Implies they are also not ACTIVE due to the parent conditional) */}
                        {!club.currentUserIsAdmin && club.currentUserMembershipStatus !== 'PENDING' && (
                          <Button onClick={handleJoinClub} disabled={loadingAction} className="mt-3">
                            {loadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Join Club
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-xl/6 text-secondary">Book History</CardTitle>
                    <CardDescription className="font-serif font-normal text-secondary text-sm/3">Books we've read in the past</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3">
                    <div className="space-y-3">
                      {club?.book_history?.length > 0 ? (
                        club.book_history.map((entry) => (
                          <div key={entry.id} className="flex flex-row gap-2 p-2 bg-secondary-light/10 rounded-lg">
                            <div className="w-24 h-36 bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                              <Link href={`/books/${entry.book.id}`}>
                              <img
                                src={entry.book.cover_url || "/placeholder-book.png"}
                                alt={`${entry.book.title} cover`}
                                className="max-h-full object-cover"
                              />
                              </Link>
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-row items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <Link href={`/books/${entry.book.id}`}>
                                    <h3 className="text-base font-semibold leading-none break-words">{entry.book.title}</h3>
                                  </Link>
                                  <p className="text-sm text-secondary font-serif">{entry.book.author}</p>
                                </div>
                                <div>
                                  <Badge 
                                    variant={
                                      entry.status === 'COMPLETED' ? 'secondary' :
                                      entry.status === 'ABANDONED' ? 'secondary' :
                                      'secondary'
                                    }
                                    className="inline-block w-auto mt-0"
                                  >
                                    {entry.status === 'ABANDONED' ? 'not completed' : 'completed'}
                                  </Badge>
                                </div>
                              </div>  
                              
                              <p className="text-xs font-serif text-secondary/50">
                                Started: {new Date(entry.started_at).toLocaleDateString()}
                                {entry.finished_at && ` • Finished: ${new Date(entry.finished_at).toLocaleDateString()}`}
                              </p>
                              
                                                            {entry.rating && (
                                 <p className="text-xs mt-2">
                                   Club Rating: <span className="italic font-serif font-normal">
                                     {entry.rating}/5 stars
                                   </span>
                                 </p>
                               )}
                               
                               {entry.discussion_notes && (
                                 <>
                                   <p className="text-xs mt-1 font-medium">Meeting Discussion Notes:</p>
                                   <p className="text-xs font-serif font-normal text-secondary/80 mt-0.5">
                                     {entry.discussion_notes}
                                   </p>
                                 </>
                               )}

                              {/* {club.currentUserIsAdmin && entry.status === 'IN_PROGRESS' && (
                                <div className="mt-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateBookStatus(entry.id, 'COMPLETED')}
                                    disabled={loadingBookAction}
                                  >
                                    Mark as Completed
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateBookStatus(entry.id, 'ABANDONED')}
                                    disabled={loadingBookAction}
                                    className="text-destructive"
                                  >
                                    Mark as Abandoned
                                  </Button>
                                </div>
                              )} */}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="mx-auto h-12 w-12 mb-4" />
                          <p>No books in history yet</p>
                          {club?.currentUserIsAdmin && (
                            <p className="text-sm mt-2">Start by setting a current book for the club.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div>
          <Card className="mt-3">
            <CardHeader className="px-3 pt-3 pb-0">
              <CardTitle className="text-secondary">Club Members</CardTitle>
              <CardDescription className="font-serif text-sm font-normal">{club.memberCount} members</CardDescription> {/* Updated to memberCount */}
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-4">
                {/* Dynamically display members based on club.memberCount */}

                {[...Array(Math.min(6, club.memberships.length ?? 0))].map((member, i) => {
                  // Find the member's book status from the API data
                  const memberStatus = memberBookStatuses.find(
                    status => status.user_id === club.memberships[i].user_id
                  );
                  
                  // Get role display
                  const rolePrefix = club.memberships[i].role === 'OWNER' ? 'Owner' : 
                                   club.memberships[i].role === 'ADMIN' ? 'Admin' : '';
                  
                  // Get book status display
                  const bookStatus = memberStatus?.book_status || (loadingMemberStatuses ? 'Loading...' : 'Current Book Status: Not in Library');
                  const statusDisplay = rolePrefix ? `${rolePrefix} - Current Book Status: ${bookStatus}` : `Current Book Status: ${bookStatus}`;

                  return (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={club.memberships[i].user.avatar_url || undefined} alt={club.memberships[i].user.display_name} />
                        <AvatarFallback
                          className={
                            club.memberships[i].role === 'OWNER' || club.memberships[i].role === 'ADMIN' 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-secondary text-secondary-foreground"
                          }
                        >
                          {club.memberships[i].user.display_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {club.memberships[i].user.display_name}
                        </p>
                        <p className="text-xs text-secondary font-serif font-normal">
                           {statusDisplay}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Show "View All Members" button if more than 6 members */}
                {club.memberCount > 6 && (
                  <Button variant="outline" className="w-full text-sm">
                    View All Members
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end px-3 pb-3">
              {club.currentUserIsAdmin && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary-light text-secondary rounded-full">
                        <Plus className="mr-1 h-4 w-4" /> Invite Members
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[85vw] rounded-2xl">
                      <Image 
                        src="/images/background.png"
                        alt="Create and Manage your Book Clubs | BookCrush"
                        width={1622}
                        height={2871}
                        className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
                      />
                      <DialogHeader className="pt-8">
                        <DialogTitle>Invite Members</DialogTitle>
                        <DialogDescription>
                            Great stories are meant to be shared. Got someone in mind? Send them an invite!
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search users by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-bookWhite/80 font-medium"
                          />
                        </div>

                        {/* Optional Message
                        <div className="space-y-2">
                          <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                          <Textarea
                            id="invite-message"
                            placeholder="Add a personal message to your invitation..."
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            className="bg-bookWhite/80 font-serif font-medium text-secondary placeholder:font-serif placeholder:italic placeholder:text-sm"
                            rows={3}
                          />
                        </div> */}

                        {/* add hidden id field */}
                        

                        {/* Search Results */}
                        <ScrollArea className="h-[300px] pr-1 pl-2 w-auto">
                          {loadingSearch ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">Searching users...</span>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="space-y-3 w-[70vw]">
                              {searchResults.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-secondary-light/10 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.display_name} />
                                      <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user.initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{user.display_name}</p>
                                      <p className="text-xs text-secondary font-serif font-normal truncate">{user.email}</p>
                                      {user.about && (
                                        <p className="text-xs text-muted-foreground font-serif mt-1 line-clamp-1">{user.about}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleSendInvitation(user, user.display_name)}
                                    disabled={loadingInvite}
                                    size="sm"
                                    className="bg-accent-variant/80 hover:bg-accent-variant text-white rounded-full h-8 flex-shrink-0"
                                  >
                                    {loadingInvite ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="mr-1 h-4 w-4" />
                                    )}
                                    Send Invite
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : searchQuery.trim() ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                              <p>No users found matching "{searchQuery}"</p>
                              <p className="text-xs mt-2">Try searching with a different name or email</p>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                              <p>Start typing the name of the user to send invite</p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setInviteDialogOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                            setInviteMessage("");
                            setInviteeId(null);
                          }}
                          className="rounded-full"
                        >
                          Cancel
                        </Button>
                      </DialogFooter>
                  </DialogContent>
                </Dialog>
                
              )}
            </CardFooter>
          </Card>

          {/* --- NEW: Admin section for Pending Applications --- */}
          {club.currentUserIsAdmin && club.pendingMemberships && club.pendingMemberships.length > 0 && (
            <Card className="mt-3">
              <CardHeader className="px-3 pt-3 pb-0">
                <CardTitle>Pending Applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {club.pendingMemberships.map((applicant) => (
                  <div key={applicant.id} className="flex items-center justify-between p-2 bg-secondary-light/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={applicant.userAvatar || "/placeholder.svg"} alt={applicant.userName} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {applicant.userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm/4 font-medium">{applicant.userName}</p>
                        <p className="text-xs text-secondary font-serif font-normal">Applied {new Date(applicant.appliedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleApproveMembership(applicant.id, applicant.userName)} // Pass only membershipId and name
                      disabled={loadingAction}
                      size="sm"
                      className="bg-accent-variant/80 hover:bg-accent-variant text-white rounded-full h-8"
                    >
                      {loadingAction ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* --- END NEW SECTION --- */}

          {/* --- NEW: Admin section for Pending Invitations --- */}
          {club.currentUserIsAdmin && pendingInvitations.length > 0 && (
            <Card className="mt-3">
              <CardHeader className="px-3 pt-3 pb-0">
                <CardTitle className="flex items-center justify-between">
                  Pending Invitations
                  <Badge variant="secondary" className="ml-2">
                    {pendingInvitations.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="font-serif font-normal text-sm">
                  Invitations sent but not yet responded to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {loadingInvitations ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading invitations...</span>
                  </div>
                ) : (
                  pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={invitation.invitee?.avatar_url || undefined} 
                            alt={invitation.invitee?.display_name || invitation.email} 
                          />
                          <AvatarFallback className="bg-orange-500 text-white">
                            {invitation.invitee?.display_name
                              ? invitation.invitee.display_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()
                              : invitation.email.charAt(0).toUpperCase()
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm/4 font-medium">
                            {invitation.invitee?.display_name || invitation.email}
                          </p>
                          <p className="text-xs text-secondary font-serif font-normal">
                            Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                          {invitation.message && (
                            <p className="text-xs text-muted-foreground font-serif italic mt-1 line-clamp-1">
                              "{invitation.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="text-xs text-secondary/70 bg-accent/35 border-none">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
          {/* --- END PENDING INVITATIONS SECTION --- */}

          <Card className="mt-3">
            <CardHeader className="px-3 pt-3 pb-1 flex-1">
              <CardTitle className="break-words text-xl/6">Upcoming Meeting{club.current_book && (<span>: {club.current_book?.title}</span>)}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pt-3 pb-5">
              {club.meetings[0] ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-secondary-light">
                    <CalendarDays className="text-accent-variant h-5 w-5" />
                    <span>
                      {new Date(club.meetings[0].meeting_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-light">
                    <Clock className="text-accent-variant h-5 w-5" />
                    <span>
                      {new Date(club.meetings[0].meeting_date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }).replace('AM', 'a.m.').replace('PM', 'p.m.')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-light">
                    <MapPin className="text-accent-variant h-5 w-5" />
                    <span>{club.meetings[0].location}</span>
                  </div>
                </div>
                {/* <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mt-3 rounded-full text-secondary-light h-8 border-none bg-primary">
                    View Details
                  </Button>
                </div> */}
              </div>
              ) : (
              <div>
                <div className="flex flex-col items-center justify-center">
                  <CalendarDays className="text-secondary-light/20 h-16 w-16 mb-3" />
                  <p className="text-secondary-light/30 text-center">No upcoming meeting</p>
                  <p className="text-secondary-light/30 text-center w-[80vw] leading-4">Go to calendar to set a new meeting date, time and place.</p>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="mt-5 rounded-full text-secondary-light h-8 border-none bg-accent">
                    Go to Calendar
                  </Button>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}