export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // You would list your tables here with their row, insert, and update types
      // For example, if you have a 'profiles' table:
      // profiles: {
      //   Row: { id: string; username: string | null; avatar_url: string | null; /* ...other_cols */ };
      //   Insert: { id: string; username: string | null; avatar_url: string | null; /* ...other_cols */ };
      //   Update: { id?: string; username?: string | null; avatar_url?: string | null; /* ...other_cols */ };
      // };
      clubs: {
        Row: any; // Replace 'any' with actual column types from your Prisma schema
        Insert: any;
        Update: any;
      };
      club_memberships: {
        Row: any;
        Insert: any;
        Update: any;
      };
      club_discussions: { // Add the new table
        Row: any;
        Insert: any;
        Update: any;
      };
      users: { // From auth schema, often referenced
        Row: any;
        Insert: any;
        Update: any;
      };
      // Add other tables from your Prisma schema here as needed
    };
    Views: {
      // Define any views you have
      [key: string]: {
        Row: any;
      };
    };
    Functions: {
      // Define any custom PostgreSQL functions
      [key: string]: {
        Args: any;
        Returns: any;
      };
    };
    Enums: {
      // Define any enums you have
      [key: string]: string;
    };
    CompositeTypes: {
      // Define any composite types
      [key: string]: any;
    };
  };
} 