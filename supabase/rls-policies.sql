-- =====================================================
-- SUPABASE STORAGE RLS POLICIES FOR SECURE FILE ACCESS
-- =====================================================

-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILE PICTURES BUCKET POLICIES
-- =====================================================

-- Policy: Users can view their own profile pictures
CREATE POLICY "Users can view own profile pictures" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can upload their own profile pictures
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can update their own profile pictures
CREATE POLICY "Users can update own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can delete their own profile pictures
CREATE POLICY "Users can delete own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Friends can view each other's profile pictures
CREATE POLICY "Friends can view profile pictures" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND (
    -- User can access their own files
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- User can access friends' files
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (
        (f.userId1 = auth.uid() AND f.userId2 = ((storage.foldername(name))[2])::uuid)
        OR
        (f.userId2 = auth.uid() AND f.userId1 = ((storage.foldername(name))[2])::uuid)
      )
    )
  )
);

-- =====================================================
-- BOOK FILES BUCKET POLICIES (Example for other content)
-- =====================================================

-- Policy: Users can view book files they have access to
CREATE POLICY "Users can view accessible book files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'books' 
  AND (
    -- Check if user has the book in their library
    EXISTS (
      SELECT 1 FROM public.user_books ub
      JOIN public.book_files bf ON bf.book_id = ub.book_id
      WHERE bf.storage_key = name
      AND ub.user_id = auth.uid()
    )
    OR
    -- Check if user is member of club that has this book
    EXISTS (
      SELECT 1 FROM public.club_memberships cm
      JOIN public.clubs c ON c.id = cm.club_id
      JOIN public.book_files bf ON bf.book_id = c.current_book_id
      WHERE bf.storage_key = name
      AND cm.user_id = auth.uid()
      AND cm.status = 'ACTIVE'
    )
  )
);

-- =====================================================
-- HELPER FUNCTIONS FOR COMPLEX POLICIES
-- =====================================================

-- Function to check if users are friends
CREATE OR REPLACE FUNCTION public.are_users_friends(user1_id uuid, user2_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (userId1 = user1_id AND userId2 = user2_id)
    OR (userId1 = user2_id AND userId2 = user1_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract user ID from storage path
CREATE OR REPLACE FUNCTION public.extract_user_id_from_path(file_path text)
RETURNS uuid AS $$
DECLARE
  path_parts text[];
BEGIN
  path_parts := string_to_array(file_path, '/');
  IF array_length(path_parts, 1) >= 2 AND path_parts[1] = 'profile-pictures' THEN
    RETURN path_parts[2]::uuid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative policy using helper function
CREATE POLICY "Friends can view profile pictures (using function)" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'profile-pictures'
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    public.are_users_friends(auth.uid(), ((storage.foldername(name))[2])::uuid)
  )
);

-- =====================================================
-- BUCKET CONFIGURATION
-- =====================================================

-- Make the bucket public but rely on RLS for security
-- This allows public URLs but access is controlled by policies
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profiles';

-- Set reasonable file size limits
UPDATE storage.buckets 
SET file_size_limit = 5242880 -- 5MB limit
WHERE id = 'profiles';

-- Set allowed MIME types for profiles bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'profiles'; 