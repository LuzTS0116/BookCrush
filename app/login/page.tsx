"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log({ email, password })
  }

  // 1. Session + router hooks
   
  const { status } = useSession();
  const router = useRouter();

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-bookWhite to-primary/10 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-bookBlack">BookCircle</h1>
      </Link>

      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary-light">
              Sign in
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OR CONTINUE WITH
            </span>
          </div>

          <Button variant="outline" className="w-full" onClick={handleSignIn}>
            <img src="/placeholder.svg?height=20&width=20" alt="Google" className="mr-2 h-4 w-4" />
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
  )
}
