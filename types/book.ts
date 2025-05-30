export interface BookDetails {
  // title: string;
  // author: string;
  // genre: string;
  // pages: number;
  // reading_speed: string;   // e.g. “4-5 hours”
  // cover: string; 
  // description: string;         // absolute or relative URL

  id?: string;
  title: string;
  author: string;
  cover_url: string;
  description?: string;
  reading_time?:string;
  pages?: number | undefined;
  genres?: string[];
  published_date?: string;
  added_by?: string;
  rating?: number;
  created_at?: string;
  file?: BookFile | null; // One-to-one relation
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
  shelf: 'favorite' | 'currently_reading' | 'queue'; // Matches shelf_type enum
  status: 'in_progress' | 'almost_done' | 'finished'; // Matches status_type enum
  position: number | null;
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