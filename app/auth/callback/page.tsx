"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/lib/SupabaseContext'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState("Confirming your email...")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useSupabase()
  
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the session from Supabase after email confirmation
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session && session.user.email_confirmed_at) {
          setStep("Email confirmed! Setting up your account...")
          
          // Sign in to NextAuth with the confirmed session
          const result = await signIn('credentials', {
            redirect: false,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          })
          
          if (result?.error) {
            throw new Error(result.error)
          }
          
          setSuccess(true)
          setStep("Account setup complete!")
          
          // Get the next URL or default to profile setup
          const nextUrl = searchParams.get('next') || '/profile-setup'
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push(nextUrl)
          }, 2000)
          
        } else {
          throw new Error('Email not confirmed or invalid session')
        }
        
      } catch (error: any) {
        console.error('Email confirmation error:', error)
        setError(error.message || 'Failed to confirm email')
      } finally {
        setLoading(false)
      }
    }

    // Handle the auth callback
    handleEmailConfirmation()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="relative w-full h-auto overflow-hidden px-4">
      <Image 
        src="/images/background.png"
        alt="Email Confirmation | BookCrush"
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
            <CardTitle className="text-2xl font-bold text-bookWhite">
              {loading ? "Confirming Email" : success ? "Welcome to BookCrush!" : "Confirmation Failed"}
            </CardTitle>
            <CardDescription className="text-bookWhite">
              {loading ? "Please wait while we confirm your email..." : 
               success ? "Your email has been confirmed successfully." :
               "There was a problem confirming your email."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            {loading && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="text-bookWhite text-sm">{step}</p>
              </div>
            )}

            {success && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <div className="space-y-2 text-bookWhite">
                  <p className="text-sm">{step}</p>
                  <p className="text-xs text-bookWhite/70">Redirecting you to complete your profile...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
                
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/30 text-red-100">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-bookWhite/70 text-sm">
                    The confirmation link may be expired or invalid.
                  </p>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => router.push('/signup')}
                      className="w-full bg-primary hover:bg-primary-light text-secondary"
                    >
                      Back to Signup
                    </Button>
                    
                    <Button 
                      onClick={() => router.push('/login')}
                      variant="outline"
                      className="w-full text-bookWhite border-bookWhite/30 hover:bg-bookWhite/10"
                    >
                      Try Logging In
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
