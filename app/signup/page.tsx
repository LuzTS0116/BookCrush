"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image";
import { handleSignIn } from '@/lib/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Mail, Lock, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
// import { createClient } from '@/lib/supabaseClient';
import { createClient } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const router = useRouter()
//   const supabase = supabaseBrowser()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
   console.log("Starting Supabase signup process...")
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL, email, password, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) // Should not be undefined
  try {
    // First sign up with Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password
    });
    
    if (signUpError) throw signUpError;
    
    // Then explicitly sign in to create the Supabase session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) throw signInError;
    
    // Use NextAuth sign in with the Supabase tokens
    const result = await signIn('credentials', {
      redirect: false,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    });
    
    if (result?.error) {
      throw new Error(result.error);
    }
    
    // Only redirect after successful sign in
    router.push('/profile-setup');
  } catch (error) {
    console.error('Authentication error:', error);
    alert(error.message);
  }
};

  return (
    <div className="relative w-full h-auto overflow-hidden px-4">
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
            <CardTitle className="text-2xl font-bold text-center text-bookWhite">Create an account</CardTitle>
            <CardDescription className="text-center font-serif text-bookWhite">Enter your details to sign up for BookCrush</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email" className="text-bookWhite">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-bookWhite" />
                    <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 text-bookWhite"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="nickname" className="text-bookWhite">Nickname</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-bookWhite" />
                    <Input
                    id="nickname"
                    type="text"
                    placeholder="Your nickname"
                    className="pl-10 text-bookWhite"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    />
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="password" className="text-bookWhite">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-bookWhite" />
                    <Input
                    id="password"
                    type="password"
                    className="pl-10 text-bookWhite"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-bookWhite">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-bookWhite" />
                    <Input
                    id="confirmPassword"
                    type="password"
                    className="pl-10 text-bookWhite"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    />
                </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary-light">
                Sign up
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
