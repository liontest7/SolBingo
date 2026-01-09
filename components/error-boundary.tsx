"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo)
    this.setState({ errorInfo })

    // Try to clean up any intervals that might be causing issues
    this.cleanupIntervals()
  }

  private cleanupIntervals(): void {
    // Try to clean up any intervals that might be running
    try {
      // Find all intervals and clear them
      for (let i = 1; i < 10000; i++) {
        window.clearInterval(i)
      }

      // Find all timeouts and clear them
      for (let i = 1; i < 10000; i++) {
        window.clearTimeout(i)
      }
    } catch (e) {
      console.error("Failed to clean up intervals:", e)
    }
  }

  private handleReset = (): void => {
    // Clear localStorage to reset the game state
    try {
      localStorage.removeItem("bingo_rooms")

      // Also clear any other game-related items
      localStorage.removeItem("sbingo_notifications")
      localStorage.removeItem("sbingo_token_address")

      // Clean up intervals
      this.cleanupIntervals()
    } catch (e) {
      console.error("Failed to clear localStorage:", e)
    }

    // Reset the error state
    this.setState({ hasError: false, error: null, errorInfo: null })

    // Reload the page
    window.location.href = "/play"
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                The application encountered an unexpected error. This might be due to a temporary issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-sm">
                <p className="font-semibold">{this.state.error?.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs text-muted-foreground">{this.state.errorInfo.componentStack}</pre>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button onClick={this.handleReset} className="flex-1">
                Reset Game State
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
                Go to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
