'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/supabase"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const user = await auth.getCurrentUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setGeneralError("")
    
    try {
      const { error } = await auth.signInWithGoogle()
      if (error) {
        setGeneralError(error.message)
      }
      // Note: Redirect is handled by Supabase OAuth flow
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setIsLoading(true)
    setGeneralError("")
    
    try {
      const { error } = await auth.signInWithApple()
      if (error) {
        setGeneralError(error.message)
      }
      // Note: Redirect is handled by Supabase OAuth flow
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    setGeneralError("")
    
    // Reset errors
    setEmailError("")
    setPasswordError("")
    
    // Validate
    let hasError = false
    if (!email) {
      setEmailError("Email is required")
      hasError = true
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address")
      hasError = true
    }
    
    if (!password) {
      setPasswordError("Password is required")
      hasError = true
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      hasError = true
    }
    
    if (hasError) return
    
    setIsLoading(true)
    
    try {
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        // Handle specific auth errors
        if (error.message.includes('Invalid login credentials')) {
          setGeneralError("Invalid email or password. Please try again.")
        } else if (error.message.includes('Email not confirmed')) {
          setGeneralError("Please check your email and click the confirmation link before signing in.")
        } else {
          setGeneralError(error.message)
        }
      } else if (data.user) {
        // Success - redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ 
           background: 'linear-gradient(135deg, #FFE5E5 0%, #E5F3FF 25%, #FFE5F5 50%, #F5E5FF 75%, #E5FFE5 100%)',
           backgroundImage: `
             linear-gradient(135deg, #FFE5E5 0%, #E5F3FF 25%, #FFE5F5 50%, #F5E5FF 75%, #E5FFE5 100%),
             url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='pattern' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M20 20h20v20h-20z' fill='%23FFB3BA' opacity='0.1'/%3E%3Cpath d='M60 40h20v20h-20z' fill='%23BAE1FF' opacity='0.1'/%3E%3Cpath d='M40 60h20v20h-20z' fill='%23FFFFBA' opacity='0.1'/%3E%3Cpath d='M80 80h20v20h-20z' fill='%23BAE1FF' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23pattern)'/%3E%3C/svg%3E")`,
           backgroundSize: '100px 100px, cover'
         }}
    >
      {/* Decorative educational icons background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-6xl">📚</div>
        <div className="absolute top-20 right-20 text-5xl">✏️</div>
        <div className="absolute bottom-20 left-20 text-5xl">🎨</div>
        <div className="absolute bottom-10 right-10 text-6xl">🌟</div>
        <div className="absolute top-1/3 left-1/4 text-4xl">📖</div>
        <div className="absolute top-1/2 right-1/3 text-5xl">🎯</div>
        <div className="absolute bottom-1/3 left-1/3 text-4xl">🏠</div>
        <div className="absolute top-1/4 right-1/4 text-5xl">🎭</div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Sign In to TeachTales
        </h1>

        {/* General error message */}
        {generalError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {generalError}
          </div>
        )}

        <div className="space-y-4">
          {/* Social Login Buttons */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 justify-center font-medium"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <Button
            onClick={handleAppleLogin}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 justify-center font-medium"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.54-2.08-.52-3.27 0-1.48.65-2.28.48-3.16-.37C2.87 15.14 3.63 8.41 9.07 8.13c1.31.05 2.22.68 2.99.71.92-.13 1.79-.78 2.86-.68 1.28.13 2.24.6 2.88 1.5-2.65 1.58-2.01 5.04.6 6.01-.39 1.02-.86 2.02-1.65 3.12l-.7-.51zM12.03 7.72c-.18-1.78.69-3.63 1.7-4.62 1.16-1.18 3.13-1.66 4.68-1.2-.2 1.89-.85 3.45-2.06 4.52-1.1.97-2.88 1.73-4.32 1.3z"/>
            </svg>
            {isLoading ? "Signing in..." : "Continue with Apple"}
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
            <div className="mt-1 relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (e.target.value) setEmailError("")
                }}
                placeholder="Enter your email"
                className={`${showErrors && emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
              {showErrors && emailError && (
                <div className="absolute right-3 top-2.5">
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                    ❗
                  </div>
                </div>
              )}
              {showErrors && emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700">
              Password
            </Label>
            <div className="mt-1 relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (e.target.value) setPasswordError("")
                }}
                placeholder="Enter your password"
                className={`${showErrors && passwordError ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
              {showErrors && passwordError && (
                <div className="absolute right-3 top-2.5">
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                    ❗
                  </div>
                </div>
              )}
              {showErrors && passwordError && (
                <p className="mt-1 text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            size="lg"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign Up
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Forgot your password?{" "}
            <Link href="/reset-password" className="text-blue-600 hover:text-blue-700 font-medium">
              Reset Password
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}