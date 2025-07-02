import { signIn, signOut } from 'next-auth/react';

export const handleSignIn = () => signIn('google', { callbackUrl: '/dashboard' });
export const handleSignOut = () => signOut();