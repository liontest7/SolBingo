"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Coins, Trophy, Award } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import { useSolanaToken } from "@/context/solana-token-context"
import { useGameContext } from "@/context/game-context"
import { useRouter } from "next/navigation"

interface WinnerModalProps {
  onClose: () => void
  onNewGame: () => void
  isMyWin?: boolean
  isPaid?: boolean
  totalPot?: number
  winnerAddress?: string
}

export default function WinnerModal({
  onClose,
  onNewGame,
  isMyWin = true,
  isPaid = false,
  totalPot = 0,
  winnerAddress = "",
}: WinnerModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)
  const [isDistributed, setIsDistributed] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const { distributePrize, tokenAddress } = useSolanaToken()
  const { leaveRoom } = useGameContext()
  const router = useRouter()

  // Determine currency symbol
  const currencySymbol = tokenAddress ? "SBINGO" : "SOL"

  const handleNewGame = async () => {
    setIsExiting(true)
    try {
      // First leave the current room
      await leaveRoom()

      // Then close the modal
      onClose()

      // Force navigation to the play page
      window.location.href = "/play"
    } catch (error) {
      console.error("Error leaving room:", error)
      // Force navigation even if there's an error
      window.location.href = "/play"
    }
  }

  // Handle modal close - ensure we leave the room
  const handleClose = async () => {
    try {
      // First leave the current room
      await leaveRoom()

      // Then close the modal
      onClose()
    } catch (error) {
      console.error("Error leaving room on close:", error)
      // Still close the modal
      onClose()
    }
  }

  // Calculate winner's prize (98% of the pot)
  const winnerPrize = isPaid ? Math.floor(totalPot * 0.98 * 1000) / 1000 : 0
  const platformFee = isPaid ? Math.floor((totalPot - winnerPrize) * 1000) / 1000 : 0

  // Trigger confetti when modal opens if player won
  useEffect(() => {
    if (isMyWin && !showConfetti) {
      setShowConfetti(true)

      const end = Date.now() + 3000

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#9c5de4", "#4285F4"],
        })

        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#9c5de4", "#4285F4"],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [isMyWin, showConfetti])

  // Distribute prize to winner
  useEffect(() => {
    if (isPaid && winnerAddress && !isDistributed && !isDistributing) {
      const handleDistribution = async () => {
        setIsDistributing(true)
        try {
          const success = await distributePrize(winnerAddress, totalPot)
          if (success) {
            setIsDistributed(true)
          }
        } catch (error) {
          console.error("Failed to distribute prize:", error)
        } finally {
          setIsDistributing(false)
        }
      }

      handleDistribution()
    }
  }, [isPaid, winnerAddress, totalPot, isDistributed, isDistributing, distributePrize])

  // Automatically leave the room when the component unmounts
  useEffect(() => {
    return () => {
      // Try to leave the room when the modal is closed
      leaveRoom().catch(console.error)
    }
  }, [leaveRoom])

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            BINGO!
          </DialogTitle>
          <DialogDescription>
            {isMyWin ? "Congratulations! You've won the game!" : "Game over! Another player has won the game."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center justify-center">
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 1,
            }}
          >
            {isMyWin ? "🎉" : "🏆"}
          </motion.div>

          {isPaid && (
            <div className="space-y-3 w-full">
              <motion.div
                className={`flex items-center gap-2 p-3 rounded-md ${
                  isMyWin
                    ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-600 border border-green-200"
                    : "bg-muted text-muted-foreground"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Coins className="h-5 w-5" />
                <span className="font-medium">
                  {isMyWin
                    ? `You won ${winnerPrize} ${currencySymbol}!`
                    : `Winner received ${winnerPrize} ${currencySymbol}`}
                </span>
              </motion.div>

              <motion.div
                className="text-sm bg-muted/50 rounded-md p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex justify-between">
                  <span>Total Pot:</span>
                  <span>
                    {totalPot} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (2%):</span>
                  <span>
                    {platformFee} {currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Winner's Prize:</span>
                  <span>
                    {winnerPrize} {currencySymbol}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-dashed">
                  <div className="flex justify-between items-center">
                    <span>Payment Status:</span>
                    <span className={isDistributed ? "text-green-600" : "text-amber-600"}>
                      {isDistributing
                        ? "Processing payment..."
                        : isDistributed
                          ? "Successfully transferred"
                          : "Waiting for transfer"}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {isMyWin && (
            <motion.div
              className="mt-4 flex items-center gap-2 text-yellow-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Award className="h-5 w-5" />
              <span>Achievement Unlocked: Bingo Master!</span>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleNewGame} className="w-full" disabled={isExiting}>
            {isExiting ? "Returning to Lobby..." : "Return to Lobby"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
