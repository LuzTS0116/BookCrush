"use client"

import type React from "react"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Mail, Lock, CheckCircle, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { handleSignIn } from '@/lib/auth';
import { useEffect } from "react";
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
// import { createClient } from "@/lib/supabaseClient";
import { createClient } from '@/lib/supabaseClient';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isClearingSession, setIsClearingSession] = useState(false);
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the shared Supabase client instance - ensure it's only created once per component
  // const supabase = useMemo(() => createClient(), []);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
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
    const invalidSessionError = searchParams.get('error') === 'invalid_session';
    
    if (shouldClearSession === 'true' || invalidSessionError) {
      console.log('Clearing invalid session as requested by middleware');
      setIsClearingSession(true);
      
      // Force sign out regardless of current session status
      signOut({ redirect: false }).finally(() => {
        setIsClearingSession(false);
        // Clear the URL parameters after clearing session
        const cleanUrl = new URL('/login', window.location.origin);
        router.replace(cleanUrl.pathname, { scroll: false });
      });
    }
  }, [searchParams, router]);

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
      
      if (signInError) {
        // Check if the error is specifically related to email confirmation
        const errorMessage = signInError.message?.toLowerCase() || '';
        
        // Only trigger email confirmation flow for explicit email confirmation errors
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email_not_confirmed') ||
            errorMessage.includes('confirm your email') ||
            errorMessage.includes('please confirm your email') ||
            errorMessage.includes('email confirmation required')) {
          setEmailNotConfirmed(true);
          setPendingEmail(email);
          setError("");
          setIsLoading(false);
          return;
        }
        throw signInError;
      }
      
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
      
      // Provide more specific error messages for common scenarios
      let errorMessage = err.message || "Failed to sign in";
      
      if (errorMessage.toLowerCase().includes('invalid login credentials') || 
          errorMessage.toLowerCase().includes('invalid credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (errorMessage.toLowerCase().includes('user not found') ||
                 errorMessage.toLowerCase().includes('no user found')) {
        errorMessage = "No account found with this email address.";
      } else if (errorMessage.toLowerCase().includes('too many requests')) {
        errorMessage = "Too many login attempts. Please wait a few minutes before trying again.";
      }
      
      setError(errorMessage);
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

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      setError(""); // Clear any previous errors
      // Show success message by temporarily using error state with different styling
      setError("confirmation_sent");
    } catch (err: any) {
      //console.error('Resend confirmation error:', err);
      setError(err.message || "Failed to resend confirmation email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setEmailNotConfirmed(false);
    setPendingEmail("");
    setError("");
  };

  // Handle session status changes and validation
  useEffect(() => {
    //console.log('Session status changed:', status);
    
    if (status === "authenticated") {
      //console.log('User authenticated, validating session...');
      
      // Check if the session has valid Supabase tokens
      if (!session?.supabaseAccessToken) {
        //console.warn('Session exists but missing Supabase tokens, signing out...');
        setError("Session expired. Please log in again.");
        signOut({ redirect: false }); // Sign out without redirect
        setIsGoogleLoading(false);
        setIsRedirecting(false);
        localStorage.removeItem('googleSignInInProgress');
        return;
       }
      
      //console.log('Valid session found, redirecting...');
      setIsRedirecting(true);
      setIsGoogleLoading(false);
      localStorage.removeItem('googleSignInInProgress');
      
      // Check profile completion status from session
      if (session.profileComplete === false) {
        //console.log('Profile incomplete, redirecting to profile setup');
        router.replace("/profile-setup");
      } else {
        //console.log('Profile complete, redirecting to dashboard');
        router.replace("/dashboard");
      }
      
    } else if (status === "unauthenticated") {
      setIsGoogleLoading(false);
      setIsRedirecting(false);
      localStorage.removeItem('googleSignInInProgress');
    }
  }, [status, session, router]);

  //console.log(status);

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
          className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
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
        className="absolute inset-0 w-auto h-full md:w-full md:h-auto object-cover z-[-1]"
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
            <CardTitle className="text-2xl font-bold text-center text-bookWhite">
              {emailNotConfirmed ? "Email confirmation required" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-center font-serif text-bookWhite">
              {emailNotConfirmed 
                ? "Please check your email and click the confirmation link to activate your account"
                : "Enter your credentials to access your account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && error !== "confirmation_sent" && (
              <div className="px-2 py-2 text-sm mb-2 text-center text-red-400 bg-bookWhite/10 rounded-md leading-none">
                {error}
              </div>
            )}
            
            {error === "confirmation_sent" && (
              <Alert className="mb-4 bg-green-500/20 border-green-500/30 text-bookWhite">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Confirmation email sent! Check your inbox and click the link to verify your account.
                </AlertDescription>
              </Alert>
            )}

            {emailNotConfirmed ? (
              // Email confirmation required screen
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-amber-400" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-bookWhite">
                    We sent a confirmation email to:
                  </p>
                  <p className="text-primary font-medium break-all">
                    {pendingEmail}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary-light"
                  >
                    {isLoading ? "Sending..." : "Resend confirmation email"}
                  </Button>
                  
                  <Button
                    onClick={handleBackToLogin}
                    variant="outline"
                    className="w-full text-bookWhite border-bookWhite/20 hover:bg-bookWhite/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Button>
                </div>
                
                <div className="text-xs text-bookWhite/70 space-y-1">
                  <p>Check your spam folder if you don't see the email.</p>
                  <p>The confirmation link will expire in 24 hours.</p>
                </div>
              </div>
            ) : (
              // Regular login form
              <>
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
              </>
            )}
          </CardContent>
          {!emailNotConfirmed && (
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
