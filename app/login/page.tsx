"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Mail, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { handleSignIn } from '@/lib/auth';
import { useEffect } from "react";
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
// import { createClient } from "@/lib/supabaseClient";
import { createClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isClearingSession, setIsClearingSession] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we're in the middle of an OAuth callback
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  
  useEffect(() => {
    const hasCallbackParams = !!(searchParams.get('callbackUrl') || 
                               searchParams.get('error') || 
                               searchParams.get('code') ||
                               searchParams.get('state') ||
                               searchParams.get('session_state') ||
                               window.location.href.includes('?code=') ||
                               window.location.href.includes('&code='));
    
    // Check if Google sign-in was in progress (persisted in localStorage)
    const googleSignInInProgress = localStorage.getItem('googleSignInInProgress');
    
    setIsOAuthCallback(hasCallbackParams);
    
    if (googleSignInInProgress === 'true') {
      console.log('Google sign-in in progress detected from localStorage');
      setIsGoogleLoading(true);
    }
    
    // Debug logging
    if (hasCallbackParams) {
      console.log('OAuth callback detected:', {
        callbackUrl: searchParams.get('callbackUrl'),
        error: searchParams.get('error'),
        code: searchParams.get('code'),
        state: searchParams.get('state'),
        session_state: searchParams.get('session_state'),
        href: window.location.href
      });
    }
  }, [searchParams]);
  
  // Check for session clearing flag from middleware
  useEffect(() => {
    const shouldClearSession = searchParams.get('clearSession');
    if (shouldClearSession === 'true' && status === 'authenticated') {
      console.log('Clearing invalid session as requested by middleware');
      setIsClearingSession(true);
      signOut({ redirect: false }).finally(() => {
        setIsClearingSession(false);
        // Clear the URL parameters after clearing session
        router.replace('/login', { scroll: false });
      });
    }
  }, [searchParams, status, router]);

  // Check for OAuth errors and display them
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      let errorMessage = "Authentication failed";
      switch (oauthError) {
        case 'OAuthSignin':
          errorMessage = "Error in constructing an authorization URL";
          break;
        case 'OAuthCallback':
          errorMessage = "Error in handling the response from an OAuth provider";
          break;
        case 'OAuthCreateAccount':
          errorMessage = "Could not create OAuth account in the database";
          break;
        case 'EmailCreateAccount':
          errorMessage = "Could not create email account in the database";
          break;
        case 'Callback':
          errorMessage = "Error in the OAuth callback handler route";
          break;
        case 'OAuthAccountNotLinked':
          errorMessage = "This email is already associated with another account";
          break;
        case 'EmailSignin':
          errorMessage = "Failed to send the email with the verification token";
          break;
        case 'CredentialsSignin':
          errorMessage = "Authorization failed. Check your credentials.";
          break;
        case 'SessionRequired':
          errorMessage = "Session required for this action";
          break;
        case 'missing_supabase_token':
          // Don't show this error to users - it's a technical issue that resolves on retry
          // Just clean up loading states and return silently
          setIsGoogleLoading(false);
          setIsRedirecting(false);
          setIsOAuthCallback(false);
          localStorage.removeItem('googleSignInInProgress');
          return;
        case 'token_expired':
          errorMessage = "Your session has expired. Please sign in again.";
          break;
        case 'invalid_session':
          errorMessage = "Your session was invalid and has been cleared. Please sign in again.";
          break;
        default:
          errorMessage = `Authentication error: ${oauthError}`;
      }
      setError(errorMessage);
      
      // Clear loading states when there's an error
      setIsGoogleLoading(false);
      setIsRedirecting(false);
      setIsOAuthCallback(false);
      localStorage.removeItem('googleSignInInProgress');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // 1. Sign in with Supabase to get the tokens
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
      
      // 2. Use NextAuth signIn with the Supabase tokens
      const result = await signIn("credentials", {
        redirect: false,
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }

      // 3. Check if user profile is complete by fetching profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles") // Replace with your actual profile table name
        .select("display_name")
        .eq("id", signInData.user.id)
        .single();
      
      if (profileError && profileError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
        console.warn("Error checking profile:", profileError);
        // Continue with login even if profile check fails
      }
      
      // 4. Determine where to redirect the user
      if (!profileData || !profileData.display_name) {
        // Profile is incomplete or doesn't exist - redirect to profile setup
        router.push("/profile-setup");
      } else {
        // Profile is complete - redirect to dashboard
        router.push("/dashboard");
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    
    // Store in localStorage to persist across redirects
    localStorage.setItem('googleSignInInProgress', 'true');
    
    try {
      await handleSignIn();
    } catch (err) {
      setError("Failed to sign in with Google");
      setIsGoogleLoading(false);
      localStorage.removeItem('googleSignInInProgress');
    }
  };

  // Handle session status changes and validation
  useEffect(() => {
    console.log('Session status changed:', status);
    
    if (status === "authenticated") {
      console.log('User authenticated, validating session...');
      
      // Check if the session has valid Supabase tokens
      if (!session?.supabaseAccessToken) {
        console.warn('Session exists but missing Supabase tokens, signing out...');
        setError("Invalid session detected. Please sign in again.");
        signOut({ redirect: false }); // Sign out without redirect
        setIsGoogleLoading(false);
        setIsRedirecting(false);
        localStorage.removeItem('googleSignInInProgress');
        return;
      }
      
      console.log('Valid session found, redirecting...');
      setIsRedirecting(true);
      setIsGoogleLoading(false);
      localStorage.removeItem('googleSignInInProgress');
      
      // Check profile completion status from session
      if (session.profileComplete === false) {
        console.log('Profile incomplete, redirecting to profile setup');
        router.replace("/profile-setup");
      } else {
        console.log('Profile complete, redirecting to dashboard');
        router.replace("/dashboard");
      }
      
    } else if (status === "unauthenticated") {
      setIsGoogleLoading(false);
      setIsRedirecting(false);
      localStorage.removeItem('googleSignInInProgress');
    }
  }, [status, session, router]);

  console.log(status);

  /* -------------------------------------------------------------------------
   * While NextAuth is still checking or we're in OAuth callback, show loading
   * ----------------------------------------------------------------------- */
  if (status === "loading" || isOAuthCallback || isRedirecting || isClearingSession) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden px-4">
        <Image 
          src="/images/background.png"
          alt="Create and Manage your Book Clubs | BookCrush"
          width={1622}
          height={2871}
          className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <span className="text-bookWhite">
              {isClearingSession 
                ? "Clearing invalid session..." 
                : isRedirecting 
                  ? "Redirecting..." 
                  : isOAuthCallback 
                    ? "Completing sign in..." 
                    : "Checking session..."
              }
            </span>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="relative w-full min-h-screen overflow-hidden px-4">
      <Image 
        src="/images/background.png"
        alt="Create and Manage your Book Clubs | BookCrush"
        width={1622}
        height={2871}
        className="absolute inset-0 w-auto h-full lg:w-full lg:h-auto object-cover z-[-1]"
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4">
        <Link href="/" className="flex items-center gap-2 mb-8 w-[40vw] max-w-[250px]">
          <Image 
              src="/images/main-logo.svg"
              alt="Reading a Book in a Castle | BookCrush"
              width={400}
              height={200}
          />
        </Link>

        <Card className="w-full max-w-md bg-secondary-light/30 backdrop-blur-md border-secondary-light/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-bookWhite">Welcome back</CardTitle>
            <CardDescription className="text-center font-serif text-bookWhite">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-bookWhite">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2 h-4 w-4 text-bookWhite focus:text-secondary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 text-bookWhite log-sign"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-bookWhite">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2 h-4 w-4 text-bookWhite" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10 text-bookWhite log-sign"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary-light" disabled={isLoading || isGoogleLoading}>
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-bookWhite" 
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Loging in...
                </>
              ) : (
                <>
                  <Image src="/images/g.webp=s48-fcrop64=1,00000000ffffffff-rw" alt="Google" width={20} height={20} className="mr-2 h-4 w-4" />
                  Google
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
