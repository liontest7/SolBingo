"use client"

import { Suspense, useEffect } from "react"
import dynamic from "next/dynamic"
import { GameProvider } from "@/context/game-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { initMockPlayerService } from "@/lib/mock-player-service"
import { motion } from "framer-motion"

// Client component to initialize mock player service
const MockPlayerInitializer = () => {
  useEffect(() => {
    // Initialize the mock player service
    const cleanup = initMockPlayerService()

    // Return cleanup function
    return cleanup
  }, [])

  return null
}

// Dynamically import BingoGame with no SSR to avoid hydration issues
const BingoGame = dynamic(() => import("@/components/bingo-game"), {
  ssr: false,
  loading: () => <GameSkeleton />,
})

// Initialize mock player service on the client side
export default function PlayPage() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <main className="container mx-auto px-4 py-8 relative min-h-screen">
          {/* Decorative background elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden min-h-screen">
            {/* Animated bingo balls in background */}
            {Array.from({ length: 10 }).map((_, i) => {
              const size = Math.random() * 60 + 40
              const letter = ["B", "I", "N", "G", "O"][Math.floor(Math.random() * 5)]
              const colorClass = `bingo-ball-${letter.toLowerCase()}`

              return (
                <motion.div
                  key={i}
                  className={`absolute rounded-full ${colorClass} opacity-10`}
                  style={{
                    width: size,
                    height: size,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 100 - 50, 0],
                    y: [0, Math.random() * 100 - 50, 0],
                    rotate: [0, Math.random() * 360, 0],
                  }}
                  transition={{
                    duration: Math.random() * 20 + 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-xs font-bold">{letter}</span>
                    <span className="text-lg font-bold">{Math.floor(Math.random() * 15) + 1}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 mb-4 inline-block relative">
              Solana Bingo Game
              <motion.div
                className="absolute -inset-2 -z-10 rounded-lg opacity-20 blur-xl"
                animate={{
                  background: [
                    "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                    "linear-gradient(180deg, #8b5cf6, #ec4899)",
                    "linear-gradient(270deg, #ec4899, #3b82f6)",
                    "linear-gradient(0deg, #3b82f6, #8b5cf6)",
                  ],
                }}
                transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
              />
            </h1>
            <motion.p
              className="text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Play Bingo on the Solana blockchain! Join free rooms to practice or stake SBINGO tokens in paid rooms for
              a chance to win the pot.
            </motion.p>
          </motion.div>

          <Suspense fallback={<GameSkeleton />}>
            <MockPlayerInitializer />
            <BingoGame />
          </Suspense>
        </main>
      </GameProvider>
    </ErrorBoundary>
  )
}

function GameSkeleton() {
  return (
    <div className="w-full">
      <div className="h-[400px] w-full rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
          <p className="text-purple-700 font-medium">Loading game...</p>
        </div>
      </div>
    </div>
  )
}
