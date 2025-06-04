-- Alternative version for UUID user IDs
-- Enable Row Level Security on club_invitations table
ALTER TABLE club_invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view invitations they received (UUID version)
CREATE POLICY "Users can view their own invitations" ON club_invitations
    FOR SELECT 
    USING (
        invitee_id = auth.uid()
    );

-- Policy 2: Users can update invitations they received (accept/decline)
CREATE POLICY "Users can update their own invitations" ON club_invitations
    FOR UPDATE 
    USING (
        invitee_id = auth.uid()
    )
    WITH CHECK (
        invitee_id = auth.uid()
    );

-- Policy 3: Club admins can create invitations for their clubs
CREATE POLICY "Club admins can create invitations" ON club_invitations
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM club_memberships cm 
            WHERE cm.club_id = club_invitations.club_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'ADMIN' 
            AND cm.status = 'ACTIVE'
        )
    );

-- Policy 4: Club admins can view invitations for their clubs
CREATE POLICY "Club admins can view club invitations" ON club_invitations
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 
            FROM club_memberships cm 
            WHERE cm.club_id = club_invitations.club_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'ADMIN' 
            AND cm.status = 'ACTIVE'
        )
    );

-- Policy 5: Club admins can update invitations for their clubs
CREATE POLICY "Club admins can update club invitations" ON club_invitations
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 
            FROM club_memberships cm 
            WHERE cm.club_id = club_invitations.club_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'ADMIN' 
            AND cm.status = 'ACTIVE'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM club_memberships cm 
            WHERE cm.club_id = club_invitations.club_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'ADMIN' 
            AND cm.status = 'ACTIVE'
        )
    );

-- Policy 6: Users who sent invitations can view them
CREATE POLICY "Inviters can view their sent invitations" ON club_invitations
    FOR SELECT 
    USING (
        inviter_id = auth.uid()
    ); 