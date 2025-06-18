-- RLS Policies for Book Club Application (CORRECTED COLUMN NAMES)
-- Generated from Prisma schema, excluding club_invitations table

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Users can view all profiles (for discovery, friend requests, etc.)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users cannot delete profiles (handled by auth.users cascade)
CREATE POLICY "Prevent profile deletion" ON profiles
  FOR DELETE
  USING (false);

-- =============================================
-- BOOKS TABLE POLICIES
-- =============================================

-- Users can view books added by themselves or their friends
CREATE POLICY "Users can view books from friends and self" ON books
  FOR SELECT
  USING (
    added_by = auth.uid() OR
    added_by IN (
      SELECT CASE 
        WHEN "userId1" = auth.uid() THEN "userId2"
        WHEN "userId2" = auth.uid() THEN "userId1"
      END
      FROM friendships
      WHERE ("userId1" = auth.uid() OR "userId2" = auth.uid())
    )
  );

-- Users can insert books
CREATE POLICY "Users can insert books" ON books
  FOR INSERT
  WITH CHECK (added_by = auth.uid());

-- Users can update their own books
CREATE POLICY "Users can update own books" ON books
  FOR UPDATE
  USING (added_by = auth.uid())
  WITH CHECK (added_by = auth.uid());

-- Users can delete their own books
CREATE POLICY "Users can delete own books" ON books
  FOR DELETE
  USING (added_by = auth.uid());

-- =============================================
-- BOOK FILES TABLE POLICIES
-- =============================================

-- Users can view book files for books they have access to
CREATE POLICY "Users can view accessible book files" ON book_files
  FOR SELECT
  USING (
    book_id IN (
      SELECT id FROM books
      WHERE added_by = auth.uid() OR
      added_by IN (
        SELECT CASE 
          WHEN "userId1" = auth.uid() THEN "userId2"
          WHEN "userId2" = auth.uid() THEN "userId1"
        END
        FROM friendships
        WHERE ("userId1" = auth.uid() OR "userId2" = auth.uid())
      )
    )
  );

-- Users can insert book files for their own books
CREATE POLICY "Users can insert book files for own books" ON book_files
  FOR INSERT
  WITH CHECK (
    book_id IN (
      SELECT id FROM books WHERE added_by = auth.uid()
    )
  );

-- Users can update book files for their own books
CREATE POLICY "Users can update book files for own books" ON book_files
  FOR UPDATE
  USING (
    book_id IN (
      SELECT id FROM books WHERE added_by = auth.uid()
    )
  )
  WITH CHECK (
    book_id IN (
      SELECT id FROM books WHERE added_by = auth.uid()
    )
  );

-- Users can delete book files for their own books
CREATE POLICY "Users can delete book files for own books" ON book_files
  FOR DELETE
  USING (
    book_id IN (
      SELECT id FROM books WHERE added_by = auth.uid()
    )
  );

-- =============================================
-- FRIEND REQUESTS TABLE POLICIES
-- =============================================

-- Users can view friend requests they sent or received
CREATE POLICY "Users can view own friend requests" ON friend_requests
  FOR SELECT
  USING ("senderId" = auth.uid() OR "receiverId" = auth.uid());

-- Users can insert friend requests they are sending
CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT
  WITH CHECK ("senderId" = auth.uid());

-- Users can update friend requests they received (to accept/decline)
CREATE POLICY "Users can update received friend requests" ON friend_requests
  FOR UPDATE
  USING ("receiverId" = auth.uid())
  WITH CHECK ("receiverId" = auth.uid());

-- Users can delete friend requests they sent or received
CREATE POLICY "Users can delete own friend requests" ON friend_requests
  FOR DELETE
  USING ("senderId" = auth.uid() OR "receiverId" = auth.uid());

-- =============================================
-- FRIENDSHIPS TABLE POLICIES
-- =============================================

-- Users can view friendships they are part of
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT
  USING ("userId1" = auth.uid() OR "userId2" = auth.uid());

-- Users can insert friendships (typically done by system after friend request acceptance)
CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT
  WITH CHECK ("userId1" = auth.uid() OR "userId2" = auth.uid());

-- Users can delete friendships they are part of
CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE
  USING ("userId1" = auth.uid() OR "userId2" = auth.uid());

-- =============================================
-- CLUBS TABLE POLICIES
-- =============================================

-- Users can view public clubs and clubs they are members of
CREATE POLICY "Users can view accessible clubs" ON clubs
  FOR SELECT
  USING (
    is_private = false OR
    owner_id = auth.uid() OR
    id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Users can insert clubs they own
CREATE POLICY "Users can create clubs" ON clubs
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Club owners and admins can update clubs
CREATE POLICY "Club owners and admins can update clubs" ON clubs
  FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  );

-- Only club owners can delete clubs
CREATE POLICY "Only club owners can delete clubs" ON clubs
  FOR DELETE
  USING (owner_id = auth.uid());

-- =============================================
-- CLUB MEMBERSHIPS TABLE POLICIES
-- =============================================

-- Users can view memberships for clubs they have access to
CREATE POLICY "Users can view accessible club memberships" ON club_memberships
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    club_id IN (
      SELECT id FROM clubs WHERE is_private = false OR
      owner_id = auth.uid() OR
      id IN (
        SELECT club_id FROM club_memberships 
        WHERE user_id = auth.uid() AND status = 'ACTIVE'
      )
    )
  );

-- Users can insert their own membership requests
CREATE POLICY "Users can create own memberships" ON club_memberships
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Club owners/admins and the user themselves can update memberships
CREATE POLICY "Authorized users can update memberships" ON club_memberships
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  );

-- Users can delete their own memberships, owners/admins can delete any
CREATE POLICY "Authorized users can delete memberships" ON club_memberships
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  );

-- =============================================
-- REACTIONS TABLE POLICIES
-- =============================================

-- Users can view all reactions (for displaying counts)
CREATE POLICY "Users can view all reactions" ON reactions
  FOR SELECT
  USING (true);

-- Users can insert their own reactions
CREATE POLICY "Users can create own reactions" ON reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions" ON reactions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- USER BOOKS TABLE POLICIES
-- =============================================

-- Users can view their own book shelves and friends' shelves
CREATE POLICY "Users can view accessible user books" ON user_books
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT CASE 
        WHEN "userId1" = auth.uid() THEN "userId2"
        WHEN "userId2" = auth.uid() THEN "userId1"
      END
      FROM friendships
      WHERE ("userId1" = auth.uid() OR "userId2" = auth.uid())
    )
  );

-- Users can insert books to their own shelves
CREATE POLICY "Users can add books to own shelves" ON user_books
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own book shelf entries
CREATE POLICY "Users can update own shelf books" ON user_books
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete books from their own shelves
CREATE POLICY "Users can delete own shelf books" ON user_books
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- CLUB BOOKS TABLE POLICIES
-- =============================================

-- Club members can view club book history
CREATE POLICY "Club members can view club books" ON club_books
  FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Club owners and admins can manage club books
CREATE POLICY "Club admins can manage club books" ON club_books
  FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  )
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  );

-- =============================================
-- CLUB DISCUSSIONS TABLE POLICIES
-- =============================================

-- Club members can view discussions
CREATE POLICY "Club members can view discussions" ON club_discussions
  FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Club members can create discussions
CREATE POLICY "Club members can create discussions" ON club_discussions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Users can update their own discussions
CREATE POLICY "Users can update own discussions" ON club_discussions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own discussions, admins can delete any
CREATE POLICY "Authorized users can delete discussions" ON club_discussions
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  );

-- =============================================
-- ACTIVITY LOGS TABLE POLICIES
-- =============================================

-- Users can view their own activities and activities from friends
CREATE POLICY "Users can view relevant activity logs" ON activity_logs
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT CASE 
        WHEN "userId1" = auth.uid() THEN "userId2"
        WHEN "userId2" = auth.uid() THEN "userId1"
      END
      FROM friendships
      WHERE ("userId1" = auth.uid() OR "userId2" = auth.uid())
    ) OR
    related_user_id = auth.uid()
  );

-- System can insert activity logs for users
CREATE POLICY "Users can create own activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users cannot update or delete activity logs (immutable audit trail)
CREATE POLICY "Activity logs are immutable" ON activity_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "Activity logs cannot be deleted" ON activity_logs
  FOR DELETE
  USING (false);

-- =============================================
-- CLUB MEETINGS TABLE POLICIES
-- =============================================

-- Club members can view meetings
CREATE POLICY "Club members can view meetings" ON club_meetings
  FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Club owners and admins can manage meetings
CREATE POLICY "Club admins can manage meetings" ON club_meetings
  FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND
    club_id IN (
      SELECT club_id FROM club_memberships 
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'
    )
  );

-- =============================================
-- CLUB MEETING ATTENDEES TABLE POLICIES
-- =============================================

-- Club members can view meeting attendees
CREATE POLICY "Club members can view meeting attendees" ON club_meeting_attendees
  FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM club_meetings
      WHERE club_id IN (
        SELECT club_id FROM club_memberships 
        WHERE user_id = auth.uid() AND status = 'ACTIVE'
      )
    )
  );

-- Users can manage their own attendance
CREATE POLICY "Users can manage own attendance" ON club_meeting_attendees
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- BOOK REVIEWS TABLE POLICIES
-- =============================================

-- Users can view all book reviews (public content)
CREATE POLICY "Users can view all book reviews" ON book_reviews
  FOR SELECT
  USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create own reviews" ON book_reviews
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON book_reviews
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON book_reviews
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- FEEDBACK TABLE POLICIES
-- =============================================

-- Users can only view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own feedback
CREATE POLICY "Users can create own feedback" ON feedback
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users cannot update or delete feedback (immutable for admin review)
CREATE POLICY "Feedback is immutable" ON feedback
  FOR UPDATE
  USING (false);

CREATE POLICY "Feedback cannot be deleted by users" ON feedback
  FOR DELETE
  USING (false);

-- =============================================
-- ADMIN POLICIES (Optional - for admin dashboard)
-- =============================================

-- Note: You can create admin-specific policies if you have admin roles
-- For now, these are commented out as the schema doesn't include admin roles

/*
-- Admin can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMIN'
    )
  );

-- Admin can update feedback status
CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'ADMIN'
    )
  );
*/ 