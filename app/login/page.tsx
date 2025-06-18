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
import { useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
// import { createClient } from "@/lib/supabaseClient";
import { createClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const { status } = useSession();
  const router = useRouter();

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
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Session + router hooks
   
  

  console.log(status);

  /* -------------------------------------------------------------------------
   * 3. While NextAuth is still checking, you can return a spinner / skeleton
   * ----------------------------------------------------------------------- */
  if (status === "loading" ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-bookBlack">Checking session…</span>
      </div>
    );
  }

  // 2. Redirect when a valid session is detected
  useEffect(() => {
    if (status === "authenticated") {
      // We use replace so the landing page doesn’t stay in the history stack
      router.replace("/dashboard");
    }
  }, [status, router]);


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
              <Button type="submit" className="w-full bg-primary hover:bg-primary-light" disabled={isLoading}>
                {isLoading ? "Loggin in..." : "Log in"}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>

            <Button variant="outline" className="w-full text-bookWhite" onClick={handleSignIn}>
              <Image src="/images/g.webp=s48-fcrop64=1,00000000ffffffff-rw" alt="Google" width={20} height={20} className="mr-2 h-4 w-4" />
              Google
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
