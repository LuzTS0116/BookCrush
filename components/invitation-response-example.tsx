"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, X, Calendar, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ClubInvitationDetails {
  id: string;
  club: {
    id: string;
    name: string;
    description: string;
    memberCount?: number;
  };
  inviter: {
    id: string;
    display_name: string;
  };
  message?: string | null;
  created_at: string;
  expires_at: string;
}

interface InvitationResponseProps {
  invitation: ClubInvitationDetails;
  onResponse?: (action: 'accept' | 'decline') => void;
}

/**
 * Example component for displaying and responding to club invitations
 * This would typically be used on an invitations page or dashboard
 */
export function InvitationResponse({ invitation, onResponse }: InvitationResponseProps) {
  const [loading, setLoading] = useState(false);

  const handleResponse = async (action: 'accept' | 'decline') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} invitation`);
      }

      const result = await response.json();
      
      if (action === 'accept') {
        toast.success(`Welcome to ${invitation.club.name}! 🎉`);
      } else {
        toast.info(`Invitation to ${invitation.club.name} declined.`);
      }

      // Call parent callback if provided
      onResponse?.(action);

    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      console.error(`Error ${action}ing invitation:`, err);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Club Invitation</CardTitle>
          {isExpired ? (
            <Badge variant="destructive">Expired</Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
        <CardDescription className="font-serif">
          You've been invited to join a book club
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Club Information */}
        <div className="p-3 bg-secondary-light/10 rounded-lg">
          <h3 className="font-semibold text-base">{invitation.club.name}</h3>
          <p className="text-sm text-muted-foreground font-serif mt-1">
            {invitation.club.description}
          </p>
          {invitation.club.memberCount && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{invitation.club.memberCount} members</span>
            </div>
          )}
        </div>

        {/* Inviter Information */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt={invitation.inviter.display_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {invitation.inviter.display_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Invited by {invitation.inviter.display_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(invitation.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Personal Message */}
        {invitation.message && (
          <div className="p-3 bg-blue-50 border-l-4 border-blue-200 rounded">
            <p className="text-sm font-serif italic">"{invitation.message}"</p>
          </div>
        )}

        {/* Expiration Warning */}
        {!isExpired && (
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <Calendar className="h-3 w-3" />
            <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3">
        {isExpired ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            This invitation has expired
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => handleResponse('decline')}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Decline
            </Button>
            <Button
              onClick={() => handleResponse('accept')}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-light"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Accept
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Example usage component showing how to fetch and display invitations
 */
export function InvitationsPage() {
  const [invitations, setInvitations] = useState<ClubInvitationDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Example: Fetch user's invitations (you'd implement this endpoint)
  // useEffect(() => {
  //   fetchUserInvitations();
  // }, []);

  const handleInvitationResponse = (invitationId: string, action: 'accept' | 'decline') => {
    // Remove the responded invitation from the list
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Your Invitations</h1>
      
      {invitations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No pending invitations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invitations.map((invitation) => (
            <InvitationResponse
              key={invitation.id}
              invitation={invitation}
              onResponse={(action) => handleInvitationResponse(invitation.id, action)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 