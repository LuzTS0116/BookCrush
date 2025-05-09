"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface Props {
  children: React.ReactNode;
  // The prop is optional: if you don’t pass it, SessionProvider
  // will fetch the session on the client. Providing it upfront
  // removes a “loading” flash.
  initialSession?: Session | null;
}

export default function AuthSessionProvider({
  children,
  initialSession,
}: Props) {
  return (
    <SessionProvider session={initialSession}>{children}</SessionProvider>
  );
}