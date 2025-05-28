/**
 * Club-related data fetching functions
 */

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

interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  admin?: boolean;
  ownerId: string;
  currentBook?: {
    title: string;
    author: string;
    cover: string;
  };
  nextMeeting?: string;
  history?: { title: string; author: string; date: string; cover: string; }[];
  membershipStatus: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | null;
  pendingMemberships?: ClubMembershipRequest[];
}

// Get the base URL for API calls (works in both server and client)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser should use current path
    return '';
  }
  // Server should use absolute URL
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
};

// Helper function to get request options
const getRequestOptions = () => {
  // When in browser, include credentials to ensure cookies are sent
  // When on server, we need to forward headers from the incoming request
  return {
    cache: 'no-store' as RequestCache,
    credentials: 'include' as RequestCredentials,
    headers: {
      'Content-Type': 'application/json',
    }
  };
};

/**
 * Fetches clubs the current user is a member of
 * Also loads pending memberships for clubs where the user is an admin
 */
export async function getMyClubs(): Promise<Club[]> {
  const baseUrl = getBaseUrl();
  const options = getRequestOptions();
  
  try {
    const response = await fetch(`${baseUrl}/api/clubs/my-clubs`, options);
    
    if (!response.ok) {
      // Add more details to the error for debugging
      const errorText = await response.text().catch(() => 'No error text available');
      throw new Error(`Failed to fetch your clubs. Status: ${response.status}. Details: ${errorText}`);
    }
    
    const data: Club[] = await response.json();

    // For each club where the user is an admin, fetch pending memberships
    const clubsWithPending: Club[] = await Promise.all(data.map(async (club) => {
      if (club.admin) { // Check if the current user is an admin of this club
        try {
          const pendingRes = await fetch(`${baseUrl}/api/clubs/${club.id}/pending-memberships`, options);
          
          if (!pendingRes.ok) {
            console.error(`Failed to fetch pending memberships for club ${club.id}: ${pendingRes.statusText}`);
            return { ...club, pendingMemberships: [] }; // Return club with empty pending array
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
    console.error("Error fetching my clubs:", err);
    throw new Error(`Error fetching your clubs: ${err.message}`);
  }
}

/**
 * Fetches clubs the current user is NOT a member of
 */
export async function getDiscoverClubs(): Promise<Club[]> {
  const baseUrl = getBaseUrl();
  const options = getRequestOptions();
  
  try {
    const response = await fetch(`${baseUrl}/api/clubs/discover`, options);
    
    if (!response.ok) {
      // Add more details to the error for debugging
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

// Export types for reuse
export type { Club, ClubMembershipRequest };