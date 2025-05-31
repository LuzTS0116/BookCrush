// types/index.ts (or types/social.ts, etc.)

export interface UserProfileMinimal {
  id: string; // The user ID from Supabase Auth
  email: string;
  display_name: string | null;
    
  
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  sentAt: string; // ISO string
  updatedAt: string; // ISO string
  sender?: UserProfileMinimal; // Populated by API where needed
  receiver?: UserProfileMinimal; // Populated by API where needed
}



export type Friendship = {
  id: string;
  userId1: string; // The ID of the first user in the friendship (adjust to your schema, e.g., userAId)
  userId2: string; // The ID of the second user in the friendship (adjust to your schema, e.g., userBId)
  establishedAt: string;
  // Make sure these relation fields are included in your API responses
  user_one?: { id: string; email: string; profile?: UserProfile; }; // UserProfile for detailed info
  user_two?: { id: string; email: string; profile?: UserProfile; }; // UserProfile for detailed info
  // This 'friendUser' is an abstraction for the client-side, representing the *other* person
  friendUser?: { id: string; email: string; profile?: { id: string; display_name: string; }; };
};



// New type for the full user profile as defined in Prisma model "Profile"
export type UserProfile = {
  id: string;
  display_name: string;
  about: string | null; // Assuming 'about' can be null
  favorite_genres: string | null; // Assuming 'favorite_genres' can be null or a string (e.g., comma-separated)
  // Add other fields from your Profile model if you want them here
  userId: string; // Link back to the user
  user?: { // Optional: Link to the User model if needed (might be useful for friend requests)
    id: string;
    email: string;
  };
};

// Type for an 'explorable' user, which includes their full profile
export type ExplorableUser = {
  id: string; // User ID
  email: string;
  display_name: string;
  about: string | null;
  favorite_genres: string | null;
   // Assumes every explorable user will have a profile
};