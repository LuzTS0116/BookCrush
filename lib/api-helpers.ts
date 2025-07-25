// lib/api-helpers.ts

import { FriendRequest, Friendship, UserProfileMinimal, ExplorableUser } from '@/types/social'; // Adjust path as needed

// --- Friend Request API Calls ---
export async function sendFriendRequest(receiverId: string): Promise<FriendRequest> {
  const res = await fetch('/api/friends/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiverId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to send friend request');
  }
  return res.json();
}

export async function acceptFriendRequest(requestId: string): Promise<Friendship> {
  const res = await fetch('/api/friends/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to accept friend request');
  }
  return res.json();
}

export async function declineFriendRequest(requestId: string): Promise<FriendRequest> {
  const res = await fetch('/api/friends/decline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to decline friend request');
  }
  return res.json();
}

export async function cancelFriendRequest(
  params: { requestId: string } | { targetUserId: string }
): Promise<{ message: string }> {
  const res = await fetch('/api/friends/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to cancel friend request');
  }
  return res.json();
}

// --- Fetch Friends/Requests ---
export async function getFriendsAndRequests(
  type: 'friends' | 'sent' | 'received',
  accessToken: string
): Promise<Friendship[] | FriendRequest[]> {
  const res = await fetch(`/api/friends?type=${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `Failed to fetch ${type}`);
  }
  return res.json();
}


export async function getExploreUsers(accessToken: string): Promise<ExplorableUser[]> {
  const response = await fetch('/api/social/explore-users', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch explorable users');
  }

  return response.json();
}