"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image";
import { handleSignIn } from '@/lib/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { createClient } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadingStep, setLoadingStep] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");
    
    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      setLoadingStep("Creating your account...");
      console.log("Starting Supabase signup process...");
      
      // Sign up with Supabase with email confirmation
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/profile-setup')}`
        }
      });
      
      if (signUpError) throw signUpError;
      
      // Check if email confirmation is needed
      if (signUpData.user && !signUpData.session) {
        // Email confirmation required
        setSignupEmail(email);
        setEmailSent(true);
        setLoadingStep("");
        return;
      }
      
      // If no email confirmation needed (shouldn't happen in production)
      if (signUpData.session) {
        setLoadingStep("Setting up your session...");
        
        // Use NextAuth sign in with the Supabase tokens
        const result = await signIn('credentials', {
          redirect: false,
          access_token: signUpData.session.access_token,
          refresh_token: signUpData.session.refresh_token,
        });
        
        if (result?.error) {
          throw new Error(result.error);
        }
        
        setLoadingStep("Redirecting...");
        router.push('/profile-setup');
      }
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    
    try {
      await handleSignIn();
    } catch (error: unknown) {
      console.error('Google sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!signupEmail) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/profile-setup')}`
        }
      });
      
      if (error) throw error;
      
      // Show success message or update UI
      setLoadingStep("Confirmation email sent!");
      setTimeout(() => setLoadingStep(""), 3000);
    } catch (error: unknown) {
      console.error('Resend confirmation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend confirmation email.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-auto overflow-hidden px-4">
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
              {emailSent ? "Check your email" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center font-serif text-bookWhite">
              {emailSent 
                ? `We sent a confirmation link to ${signupEmail}`
                : "Enter your details to sign up for BookCrush"
              }
            </CardDescription>
            </CardHeader>
            <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500/30 text-red-100">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isLoading && loadingStep && (
              <Alert className="mb-4 bg-primary/20 border-primary/30 text-bookWhite">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>{loadingStep}</AlertDescription>
              </Alert>
            )}
            
            {emailSent ? (
              // Email confirmation sent screen
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-2 text-bookWhite">
                  <p className="text-sm">
                    Please check your inbox and click the confirmation link to complete your account setup.
                  </p>
                  <p className="text-xs text-bookWhite/70">
                    Didn't receive the email? Check your spam folder or request a new one.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full text-bookWhite border-bookWhite/30 hover:bg-bookWhite/10"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend confirmation email"
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setEmailSent(false);
                      setSignupEmail("");
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                      setError("");
                    }}
                    variant="ghost"
                    className="w-full text-bookWhite/70 hover:text-bookWhite hover:bg-bookWhite/5"
                  >
                    Back to signup
                  </Button>
                </div>
              </div>
            ) : (
              // Regular signup form
              <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email" className="text-bookWhite">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-bookWhite" />
                    <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 text-bookWhite log-sign"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    />
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="password" className="text-bookWhite">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2 h-4 w-4 text-bookWhite" />
                    <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    className="pl-10 text-bookWhite log-sign"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    />
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-bookWhite">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2 h-4 w-4 text-bookWhite" />
                    <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10 text-bookWhite log-sign"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    />
                </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-light disabled:opacity-50" 
                  disabled={
                    isLoading || 
                    isGoogleLoading
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Sign up"
                  )}
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
                className="w-full text-bookWhite disabled:opacity-50" 
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Google...
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
            <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                Log in
                </Link>
            </p>
            </CardFooter>
        </Card>
        </div>
    </div>
  )
}
