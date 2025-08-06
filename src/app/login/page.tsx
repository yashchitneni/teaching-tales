'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// Using AWS Cognito for authentication
import { useAuth } from "@/contexts/AuthContext"
import { logNavigation } from "@/lib/debug-navigation"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const router = useRouter()
  const { user, login } = useAuth()
  
  console.log('[LoginPage] Component rendered, user:', user)
  
  useEffect(() => {
    logNavigation('/login')
  }, [])

  // Check if user is already logged in
  useEffect(() => {
    console.log('[LoginPage] useEffect triggered, user:', user)
    if (user) {
      console.log('[LoginPage] User already logged in, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [user, router])



  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[LoginPage] Form submitted');
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
    console.log('[LoginPage] About to call login with:', { email, password: '***' });
    
    try {
      // Use the login method from auth context
      const result = await login(email, password)
      console.log('[LoginPage] Login result:', result);
      if (result.success) {
        // Success - redirect will happen automatically via useEffect
        router.push('/dashboard')
      } else {
        setGeneralError(result.error || 'Login failed')
      }
    } catch (err) {
      // Handle specific auth errors
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      if (errorMessage.includes('Invalid login credentials')) {
        setGeneralError("Invalid email or password. Please try again.")
      } else if (errorMessage.includes('Email not confirmed')) {
        setGeneralError("Please check your email and click the confirmation link before signing in.")
      } else {
        setGeneralError(errorMessage)
      }
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