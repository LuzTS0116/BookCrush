/**
 * Club-related data fetching functions
 */

// import { cookies } from 'next/headers'; // REMOVE: Cannot be used here
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // REMOVE: Client initialized in Server Component
import { withAuthCookies } from './http';


// Types
interface ClubMembershipRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userInitials: string;
  appliedAt: string;
  status: 'PENDING' | 'ACTIVE';
}

interface ClubInvitation {
  id: string;
  club_id: string;
  club_name: string;
  club_description: string;
  inviter_id: string;
  inviter_name: string;
  inviter_avatar?: string;
  message?: string;
  created_at: string;
  club: {
    id: string;
    name: string;
    description: string;
    genres?: string[];
    current_book?: {
      id: string;
      title: string;
      author: string;
      cover_url: string;
      pages: number;
      genres: string[];
      reading_time: string;
    };
    memberCount: number;
    meetings?: Array<{ meeting_date: string | Date }>;
    members?: Array<{
      id: string;
      display_name: string;
      
      avatar_url?: string;
      role: 'OWNER' | 'ADMIN' | 'MEMBER';
      joined_at: string;
    }>;
  };
}

interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  admin?: boolean;
  ownerId: string;
  genres?: string[];
  current_book?: {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    pages: number;
    genres: string[];
    reading_time: string;
  };
  nextMeeting?: string;
  history?: { title: string; author: string; date: string; cover: string; }[];
  membershipStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | null;
  pendingMemberships?: ClubMembershipRequest[];
  meetings?: Array<{ meeting_date: string | Date }>;
  members?: Array<{
    id: string;
    display_name: string;
    
    avatar_url?: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joined_at: string;
  }>;
}

// Get the base URL for API calls (works in both server and client)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser should use current path
    return '';
  }
  // Use NEXT_PUBLIC_APP_URL for server-side calls to your own API routes
  // Ensure this is set in your environment variables (e.g., http://localhost:3000 for local dev)
  return process.env.NEXT_PUBLIC_APP_URL || (
    process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  ); 
};

// getRequestOptions is no longer needed for token-based auth in getMyClubs
// but might still be used by getDiscoverClubs if it remains cookie-based or public
const getCookieBasedRequestOptions = () => {
  return {
    cache: 'no-store' as RequestCache, // For cookie-based auth
    headers: {
      'Content-Type': 'application/json',
    }
  };
};

const getTokenBasedRequestOptions = (accessToken: string | undefined) => {
  return {
    cache: 'no-store' as RequestCache,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    }
  };
};

/**
 * Fetches clubs the current user is a member of
 * Also loads pending memberships for clubs where the user is an admin
 * @param accessToken - The Supabase access token for the authenticated user
 */
export async function getMyClubs(accessToken: string | undefined): Promise<Club[]> {
  const baseUrl = getBaseUrl();

  
  try {
    //console.log('[getMyClubs] Making request to:', `${baseUrl}/api/clubs/my-clubs`);
    const response = await fetch(`${baseUrl}/api/clubs/my-clubs`, getTokenBasedRequestOptions(accessToken));
    
    // console.log('[getMyClubs] Response received:', {
    //   status: response.status,
    //   statusText: response.statusText,
    //   headers: Object.fromEntries(response.headers.entries()),
    //   url: response.url
    // });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text available');
      console.error(`[getMyClubs] Failed to fetch your clubs. Status: ${response.status}. URL: ${baseUrl}/api/clubs/my-clubs. Response body:`, errorText);
      throw new Error(`Failed to fetch your clubs. Status: ${response.status}.`);
    }
    
    const data: Club[] = await response.json();
    //console.log('[getMyClubs] Successfully received data:', { clubCount: data.length });

    // For each club where the user is an admin, fetch pending memberships
    // This part also needs to use tokenRequestOptions if the pending-memberships API is secured similarly
    const clubsWithPending: Club[] = await Promise.all(data.map(async (club) => {
      if (club.admin) { 
        try {
          // Assuming /api/clubs/[club.id]/pending-memberships is also secured with Bearer token
          const pendingRes = await fetch(`${baseUrl}/api/clubs/${club.id}/pending-memberships`, getTokenBasedRequestOptions(accessToken));
          
          if (!pendingRes.ok) {
            console.error(`Failed to fetch pending memberships for club ${club.id}: ${pendingRes.statusText}`);
            return { ...club, pendingMemberships: [] };
          }
          const pendingData: ClubMembershipRequest[] = await pendingRes.json();
          return { ...club, pendingMemberships: pendingData };
        } catch (err) {
          console.error(`Error fetching pending for ${club.id}:`, err);
          return { ...club, pendingMemberships: [] };
        }
      }
      return club;
    }));

    return clubsWithPending;
  } catch (err: any) {
    console.error("Error in getMyClubs fetching process:", err);
    // Re-throw or handle as appropriate for your application
    throw new Error(err.message || "An unexpected error occurred while fetching your clubs.");
  }
}

/**
 * Fetches clubs the current user is NOT a member of
 * If this requires auth and is called server-side, it should also be updated.
 */
export async function getDiscoverClubs(accessToken: string | undefined): Promise<Club[]> { // Also accept token if needed
  const baseUrl = getBaseUrl();
  
 
  
  try {
    const response = await fetch(`${baseUrl}/api/clubs/discover`, getTokenBasedRequestOptions(accessToken));
    
    if (!response.ok) {
      console.log(response)
      const errorText = await response.text().catch(() => 'No error text available');
      throw new Error(`Failed to fetch discoverable clubs. Status: ${response.status}. Details: ${errorText}`);
    }
    
    const data: Club[] = await response.json();
    return data;
  } catch (err: any) {
    console.error("Error fetching discoverable clubs:", err);
    throw new Error(`Error fetching discoverable clubs: ${err.message}`);
  }
}

/**
 * Fetches pending club invitations for the current user
 * @param accessToken - The Supabase access token for the authenticated user
 */
export async function getPendingInvitations(accessToken: string | undefined): Promise<ClubInvitation[]> {
  const baseUrl = getBaseUrl();


  
  try {
    const response = await fetch(`${baseUrl}/api/invitations/pending`, getTokenBasedRequestOptions(accessToken));
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text available');
      console.error(`Failed to fetch pending invitations. Status: ${response.status}. URL: ${baseUrl}/api/invitations/pending. Details: ${errorText}`);
      throw new Error(`Failed to fetch pending invitations. Status: ${response.status}.`);
    }
    
    const data: ClubInvitation[] = await response.json();
    return data;
  } catch (err: any) {
    console.error("Error in getPendingInvitations fetching process:", err);
    // Re-throw or handle as appropriate for your application
    throw new Error(err.message || "An unexpected error occurred while fetching pending invitations.");
  }
}

// Export types for reuse
export type { Club, ClubMembershipRequest, ClubInvitation };