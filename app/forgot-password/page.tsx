"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setIsEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
      
    } catch (error: any) {
      console.error('Forgot password error:', error)
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
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
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-bookWhite">Check your email</CardTitle>
              <CardDescription className="font-serif text-bookWhite">
                We've sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-sm text-bookWhite/80">
                  Click the link in the email to reset your password. If you don't see it, check your spam folder.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full text-bookWhite border-bookWhite/30 hover:bg-bookWhite/10"
                  onClick={() => handleSubmit(new Event('submit') as any)}
                  disabled={isLoading}
                >
                  Resend email
                </Button>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            <CardTitle className="text-2xl font-bold text-center text-bookWhite">Reset your password</CardTitle>
            <CardDescription className="text-center font-serif text-bookWhite">
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-bookWhite">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2 h-4 w-4 text-bookWhite" />
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
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-light" 
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 