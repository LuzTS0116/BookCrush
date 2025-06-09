export interface BookDetails {
  // title: string;
  // author: string;
  // genre: string;
  // pages: number;
  // reading_speed: string;   // e.g. "4-5 hours"
  // cover: string; 
  // description: string;         // absolute or relative URL

  id?: string;
  title: string;
  author: string;
  cover_url: string;
  description?: string;
  reading_time?: string;
  pages?: number | undefined;
  genres?: string[];
  published_date?: string;
  added_by?: string;
  rating?: number;
  created_at?: string;
  file?: BookFile | null; // One-to-one relation
  reactions: {
    counts: {
      HEART: number;
      LIKE: number;
      THUMBS_UP: number;
      THUMBS_DOWN: number;
      total: number;
    };
    userReaction: string | null;
  };
  is_favorite: boolean;
}

// Matches your Prisma BookFile model
export interface BookFile {
  id: string;
  storage_key: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  language: string;
}



// Corresponds to your Prisma UserBook model (this is what your GET API returns)
export interface UserBook {
  user_id: string;
  book_id: string;
  shelf: 'favorite' | 'currently_reading' | 'queue' | 'history'; // Updated to match Prisma shelf_type enum
  status: 'in_progress' | 'almost_done' | 'finished' | 'unfinished'; // Matches status_type enum
  media_type: 'audio_book' | 'e_reader' | 'physical_book';
  position: number | null;
  is_favorite: boolean; // Added to match Prisma schema
  added_at: string; // DateTime will be string in JSON
  book: BookDetails; // Nested book object
}

// Type for the status display objects
export interface StatusDisplay {
  label: string;
  value: UserBook['status'];
  color: string;
}

// Type for the tab display objects
export interface TabDisplay {
  label: string;
  value: UserBook['shelf']; // Tabs should correspond to shelf types
}

export interface ClubMembership {
  id: string;
  user_id: string;
  club_id: string;
  status: 'pending' | 'active' | 'rejected' | 'left';
}
