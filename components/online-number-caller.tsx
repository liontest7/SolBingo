"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Coins, Users, Clock, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Progress } from "@/components/ui/progress"

interface OnlineNumberCallerProps {
  currentNumber: string | null
  calledNumbers: string[]
  roomName: string
  playerCount: number
  maxPlayers: number
  onExitGame: () => void
  isPaid?: boolean
  totalPot?: number
  lastCalledNumber?: string | null
  timeToNextNumber?: number | null
}

export default function OnlineNumberCaller({
  currentNumber,
  calledNumbers,
  roomName,
  playerCount,
  maxPlayers,
  onExitGame,
  isPaid = false,
  totalPot = 0,
  lastCalledNumber = null,
  timeToNextNumber = null,
}: OnlineNumberCallerProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const [progressValue, setProgressValue] = useState(100)
  const [safeCalledNumbers, setSafeCalledNumbers] = useState<string[]>([])
  const [isExiting, setIsExiting] = useState(false)
  const [localCountdown, setLocalCountdown] = useState<number | null>(null)
  const [showBall, setShowBall] = useState(false)
  const lastTimeToNextNumberRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Ensure calledNumbers is always an array
  useEffect(() => {
    setSafeCalledNumbers(Array.isArray(calledNumbers) ? calledNumbers : [])
  }, [calledNumbers])

  // Animate when a new number is called
  useEffect(() => {
    if (lastCalledNumber) {
      setShowAnimation(true)
      setShowBall(true)

      const timer = setTimeout(() => {
        setShowAnimation(false)
      }, 2000)

      const ballTimer = setTimeout(() => {
        setShowBall(false)
      }, 3000)

      return () => {
        clearTimeout(timer)
        clearTimeout(ballTimer)
      }
    }
  }, [lastCalledNumber])

  // Set up a local countdown timer that syncs with the server
  useEffect(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    // Only reset the countdown if timeToNextNumber has changed
    if (timeToNextNumber !== null && timeToNextNumber !== lastTimeToNextNumberRef.current) {
      // Update the ref to track changes
      lastTimeToNextNumberRef.current = timeToNextNumber

      // Initialize with the provided timeToNextNumber
      setLocalCountdown(timeToNextNumber)

      // Update the progress bar
      const callInterval = 5 // Default to 5 seconds
      setProgressValue((timeToNextNumber / callInterval) * 100)
    }

    // Set up interval to update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setLocalCountdown((prev) => {
        if (prev === null || prev <= 0) {
          return timeToNextNumber !== null ? timeToNextNumber : 5
        }

        // Decrement and update progress
        const newTime = prev - 1
        const callInterval = 5 // Default to 5 seconds
        setProgressValue((newTime / callInterval) * 100)
        return newTime
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [timeToNextNumber])

  // Handle exit game
  const handleExitGame = () => {
    setIsExiting(true)
    onExitGame()
  }

  // Group called numbers by letter
  const groupedNumbers = safeCalledNumbers.reduce(
    (acc, number) => {
      if (!number) return acc
      const letter = number.charAt(0)
      if (!acc[letter]) {
        acc[letter] = []
      }
      acc[letter].push(number)
      return acc
    },
    {} as Record<string, string[]>,
  )

  const letters = ["B", "I", "N", "G", "O"]

  // Get color for bingo ball based on letter
  const getBallColor = (letter: string) => {
    switch (letter) {
      case "B":
        return "from-blue-500 to-blue-700"
      case "I":
        return "from-red-500 to-red-700"
      case "N":
        return "from-green-500 to-green-700"
      case "G":
        return "from-yellow-500 to-yellow-700"
      case "O":
        return "from-purple-500 to-purple-700"
      default:
        return "from-gray-500 to-gray-700"
    }
  }

  // Get the current letter from the current number
  const currentLetter = currentNumber ? currentNumber.charAt(0) : null
  const currentDigits = currentNumber ? currentNumber.substring(1) : null

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Number Caller</h2>
        <Badge variant="outline" className="ml-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-300">
          Room: {roomName}
        </Badge>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-400" />
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 border-purple-300">
            Players: {playerCount}/{maxPlayers}
          </Badge>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleExitGame}
          disabled={isExiting}
          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
        >
          {isExiting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exiting...
            </>
          ) : (
            "Exit Game"
          )}
        </Button>
      </div>

      {isPaid && (
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-600">Paid Game</span>
          </div>
          <div>
            <span className="font-medium text-green-600">Pot: {totalPot} SBINGO</span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mb-6 relative">
        <AnimatePresence>
          {showAnimation && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        {/* 3D Bingo Ball */}
        <div className="relative h-32 w-full flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            {showBall && currentNumber ? (
              <motion.div
                key={currentNumber}
                className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getBallColor(currentLetter || "B")} shadow-xl flex items-center justify-center`}
                initial={{ scale: 0, y: -100, rotate: -180 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0, y: 100, rotate: 180 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.8,
                }}
              >
                <motion.div
                  className="absolute inset-1 rounded-full bg-white/20 blur-sm"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <div className="flex flex-col items-center text-white">
                  <span className="text-sm font-bold">{currentLetter}</span>
                  <span className="text-2xl font-bold">{currentDigits}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="text-6xl font-bold h-24 flex items-center justify-center bg-gradient-to-r from-purple-500/10 to-blue-500/10 w-full rounded-xl"
                key="empty"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {currentNumber || "?"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full mb-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-400" />
              <span>Next number in:</span>
            </div>
            <span className="font-medium">{localCountdown !== null ? `${localCountdown}s` : "..."}</span>
          </div>
          <Progress
            value={progressValue}
            className="h-2 bg-gray-200 dark:bg-gray-700"
            indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Called Numbers</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {letters.map((letter) => (
            <div key={letter} className="text-center">
              <div
                className={`font-bold mb-1 text-${letter === "B" ? "blue" : letter === "I" ? "red" : letter === "N" ? "green" : letter === "G" ? "yellow" : "purple"}-500`}
              >
                {letter}
              </div>
              <div className="text-xs text-muted-foreground">
                {groupedNumbers[letter]?.length || 0}/{letter === "N" ? 14 : 15}
              </div>
            </div>
          ))}
        </div>

        <ScrollArea className="h-[200px] border rounded-xl p-4 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-2">
            {letters.map((letter) => (
              <div key={letter} className="flex flex-col gap-1">
                {groupedNumbers[letter]?.map((number, index) => (
                  <motion.div
                    key={number}
                    className={`px-2 py-1 rounded-lg text-sm font-medium text-center shadow-sm ${
                      number === currentNumber
                        ? `bg-gradient-to-r ${getBallColor(letter)} text-white`
                        : "bg-white/80 dark:bg-gray-800/80"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {number.substring(1)}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
