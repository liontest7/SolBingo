"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function ResetGameButton() {
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    setIsResetting(true)

    try {
      // Clear game-related localStorage items
      localStorage.removeItem("bingo_rooms")
      localStorage.removeItem("sbingo_notifications")

      // Clear any intervals that might be running
      for (let i = 1; i < 10000; i++) {
        window.clearInterval(i)
        window.clearTimeout(i)
      }

      // Wait a moment to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Reload the page
      if (typeof window !== "undefined") {
        window.location.href = "/play"
      } else {
        router.refresh()
        router.push("/play")
      }
    } catch (error) {
      console.error("Error resetting game:", error)
      setIsResetting(false)

      // Force reload even if there's an error
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      disabled={isResetting}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
      {isResetting ? "Resetting..." : "Reset Game"}
    </Button>
  )
}
