"use client"

import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"

interface BingoCardProps {
  card: string[][]
  markedCells: boolean[][]
  onToggleCell: (row: number, col: number) => void
  calledNumbers: string[]
  hasWon?: boolean
}

export default function BingoCard3D({
  card,
  markedCells,
  onToggleCell,
  calledNumbers,
  hasWon = false,
}: BingoCardProps) {
  const headers = ["B", "I", "N", "G", "O"]
  const [showConfetti, setShowConfetti] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null)
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  // Trigger confetti when player wins
  useEffect(() => {
    if (hasWon && !showConfetti) {
      setShowConfetti(true)

      // Create confetti effect
      const duration = 5 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [hasWon, showConfetti])

  // Find winning patterns to highlight them
  const getWinningPatterns = () => {
    // Make sure markedCells is defined and has the expected structure
    if (!markedCells || !Array.isArray(markedCells) || markedCells.length === 0) {
      return []
    }

    const winningPatterns: [number, number][][] = []

    // Check rows
    for (let row = 0; row < 5; row++) {
      if (markedCells[row] && Array.isArray(markedCells[row]) && markedCells[row].every((cell) => cell === true)) {
        winningPatterns.push(Array.from({ length: 5 }, (_, col) => [row, col] as [number, number]))
      }
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      if (markedCells.every((row) => Array.isArray(row) && row[col] === true)) {
        winningPatterns.push(Array.from({ length: 5 }, (_, row) => [row, col] as [number, number]))
      }
    }

    // Check diagonal (top-left to bottom-right)
    if (
      markedCells[0]?.[0] &&
      markedCells[1]?.[1] &&
      markedCells[2]?.[2] &&
      markedCells[3]?.[3] &&
      markedCells[4]?.[4]
    ) {
      winningPatterns.push([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ])
    }

    // Check diagonal (top-right to bottom-left)
    if (
      markedCells[0]?.[4] &&
      markedCells[1]?.[3] &&
      markedCells[2]?.[2] &&
      markedCells[3]?.[1] &&
      markedCells[4]?.[0]
    ) {
      winningPatterns.push([
        [0, 4],
        [1, 3],
        [2, 2],
        [3, 1],
        [4, 0],
      ])
    }

    return winningPatterns
  }

  const winningPatterns = getWinningPatterns()

  // Check if a cell is part of a winning pattern
  const isWinningCell = (row: number, col: number) => {
    return winningPatterns.some((pattern) => pattern.some(([r, c]) => r === row && c === col))
  }

  // Make sure card is defined and has the expected structure
  if (!card || !Array.isArray(card) || card.length === 0) {
    return <div>Loading bingo card...</div>
  }

  // Make sure markedCells is defined and has the expected structure
  if (!markedCells || !Array.isArray(markedCells) || markedCells.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div ref={ref} className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-5 gap-1 mb-2">
        {headers.map((header, index) => (
          <motion.div
            key={index}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-center py-3 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1, type: "spring" }}
          >
            {header}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1">
        <AnimatePresence>
          {card.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isCalled = calledNumbers.includes(cell)
              const isMarked = markedCells[rowIndex]?.[colIndex] || false
              const isFreeSpace = rowIndex === 2 && colIndex === 2
              const isDisabled = (rowIndex === 2 && colIndex === 2) || !calledNumbers.includes(cell)
              const isWinning = isWinningCell(rowIndex, colIndex)
              const isHovered = hoveredCell && hoveredCell[0] === rowIndex && hoveredCell[1] === colIndex

              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => onToggleCell(rowIndex, colIndex)}
                  onMouseEnter={() => setHoveredCell([rowIndex, colIndex])}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={cn(
                    "aspect-square flex items-center justify-center text-lg font-medium border rounded-lg transition-all duration-300 shadow-md",
                    isMarked
                      ? isWinning
                        ? "bg-gradient-to-r from-green-500 to-teal-500 text-white animate-pulse-glow shadow-lg shadow-green-500/30 border-green-400"
                        : "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md shadow-purple-500/30 border-purple-400"
                      : "bg-white/90 hover:bg-white border-gray-200 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:border-gray-700",
                    isFreeSpace ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-pink-400" : "",
                    isCalled && !isMarked ? "ring-2 ring-purple-500/70 shadow-lg shadow-purple-500/20" : "",
                    !isCalled && !isFreeSpace ? "opacity-70 cursor-not-allowed" : "",
                    isHovered && !isDisabled ? "scale-105 shadow-lg z-10" : "",
                  )}
                  disabled={isDisabled}
                  style={{
                    transform: isHovered && !isDisabled ? "translateZ(20px)" : "translateZ(0px)",
                  }}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                  animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: 180 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                  transition={{
                    delay: (rowIndex * 5 + colIndex) * 0.03,
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
                >
                  {isFreeSpace ? (
                    <span className="text-sm font-bold">FREE</span>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-xs opacity-70">{cell.charAt(0)}</span>
                      <span className="text-lg font-bold">{cell.substring(1)}</span>
                    </div>
                  )}

                  {/* Highlight effect for called numbers */}
                  {isCalled && !isMarked && !isDisabled && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-purple-500/20"
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* Winning cell effect */}
                  {isWinning && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-green-500/30"
                      animate={{
                        opacity: [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.button>
              )
            }),
          )}
        </AnimatePresence>
      </div>

      {/* Add custom styles for 3D effects */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px 0 rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 20px 5px rgba(34, 197, 94, 0.6); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
