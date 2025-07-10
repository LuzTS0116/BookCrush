-- Storage bucket and RLS policies for profile pictures
-- Run this in your Supabase SQL editor

-- First, create the profiles bucket if it doesn't exist
-- (You can also do this through the Supabase dashboard under Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to upload their own profile pictures
-- Path structure: profile-pictures/{user.id}/{filename}
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 2: Allow users to view all profile pictures (public read)
CREATE POLICY "Profile pictures are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profiles');

-- Policy 3: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 4: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Alternative simpler policies (if the above folder-based ones don't work)
-- Uncomment these and comment the above if needed:

/*
-- Simple policy: Allow authenticated users to upload to profiles bucket
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Simple policy: Allow authenticated users to view profile pictures
CREATE POLICY "Authenticated users can view profile pictures"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Simple policy: Allow authenticated users to update profile pictures
CREATE POLICY "Authenticated users can update profile pictures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Simple policy: Allow authenticated users to delete profile pictures
CREATE POLICY "Authenticated users can delete profile pictures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);
*/ 