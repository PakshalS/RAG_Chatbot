"use client"

import { useState, useContext } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthContext } from "@/context/authcontext"
import useAuthRedirect from "@/context/useauthredirect"
export default function LoginPage() {
    useAuthRedirect();

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useContext(AuthContext) // Use AuthContext

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Use AuthContext login to store token in cookie and set authData
        login(data.token)
      } else {
        setError(data.message || "Login failed. Please check your credentials.")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-all duration-300 group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <Card className="w-full max-w-md shadow-xl border-primary/10 dark:border-primary/20 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-300">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-2xl">PDFChat</span>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium dark:text-gray-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                required
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium dark:text-gray-200">
                  Password
                </Label>
                <Link to="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/50 p-2 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90 rounded-lg py-2.5 font-semibold transition-all duration-300 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}