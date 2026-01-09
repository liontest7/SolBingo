"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useGameContext } from "@/context/game-context"
import { useWallet } from "@solana/wallet-adapter-react"
import { useSolanaToken } from "@/context/solana-token-context"
import BingoCard from "./bingo-card"
import { generateBingoCard } from "@/lib/bingo-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Trophy,
  Users,
  Clock,
  Volume2,
  VolumeX,
  Crown,
  Timer,
  Zap,
  Circle,
  Award,
  DollarSign,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
} from "lucide-react"
import confetti from "canvas-confetti"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

export default function OnlineGame() {
  const { publicKey } = useWallet()
  const { currentRoom, calledNumbers, leaveRoom, declareWinner, timeToNextNumber } = useGameContext()
  const { tokenAddress } = useSolanaToken()
  const router = useRouter()
  const { toast } = useToast()

  const playerCard = useMemo(() => {
    if (!publicKey || !currentRoom) return null
    const seed = `${publicKey.toBase58()}-${currentRoom.id}`
    return generateBingoCard(seed)
  }, [publicKey, currentRoom])

  const [markedCells, setMarkedCells] = useState<boolean[][]>(
    Array(5)
      .fill(null)
      .map(() => Array(5).fill(false)),
  )

  // Initialize center FREE space as marked
  useEffect(() => {
    setMarkedCells((prev) => {
      const newMarked = prev.map((row) => [...row])
      newMarked[2][2] = true
      return newMarked
    })
  }, [])

  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [isLeavingRoom, setIsLeavingRoom] = useState(false)
  const [isClaimingBingo, setIsClaimingBingo] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameTime, setGameTime] = useState(0)
  const [localCountdown, setLocalCountdown] = useState<number | null>(null)
  const [previousNumber, setPreviousNumber] = useState<string | null>(null)
  const [showNewNumberAnimation, setShowNewNumberAnimation] = useState(false)
  const [copiedTx, setCopiedTx] = useState(false)

  const currentNumber = currentRoom?.currentNumber || null
  const playerCount = currentRoom?.players?.length || 0
  const isPaid = currentRoom?.isPaid || false
  const entryFee = currentRoom?.entryFee || 0
  const potAmount = isPaid ? entryFee * playerCount : 0
  const currencySymbol = tokenAddress ? "SBINGO" : "SOL"
  const winner = currentRoom?.winner || null
  const callInterval = currentRoom?.callInterval || 5
  const isWinner = winner === publicKey?.toBase58()

  const toggleCell = useCallback((row: number, col: number) => {
    if (row === 2 && col === 2) return
    setMarkedCells((prev) => {
      const newMarked = prev.map((r) => [...r])
      newMarked[row][col] = !newMarked[row][col]
      return newMarked
    })
  }, [])

  const hasWon = useMemo(() => {
    if (!playerCard || !calledNumbers.length) return false

    const isValidMark = (row: number, col: number) => {
      if (row === 2 && col === 2) return true
      if (!markedCells[row][col]) return false
      const cellValue = playerCard[row][col]
      return calledNumbers.includes(cellValue)
    }

    for (let row = 0; row < 5; row++) {
      if ([0, 1, 2, 3, 4].every((col) => isValidMark(row, col))) return true
    }
    for (let col = 0; col < 5; col++) {
      if ([0, 1, 2, 3, 4].every((row) => isValidMark(row, col))) return true
    }
    if ([0, 1, 2, 3, 4].every((i) => isValidMark(i, i))) return true
    if ([0, 1, 2, 3, 4].every((i) => isValidMark(i, 4 - i))) return true

    return false
  }, [playerCard, markedCells, calledNumbers])

  useEffect(() => {
    if (currentRoom?.status === "playing") {
      const timer = setInterval(() => setGameTime((prev) => prev + 1), 1000)
      return () => clearInterval(timer)
    }
  }, [currentRoom?.status])

  useEffect(() => {
    if (timeToNextNumber !== null && timeToNextNumber > 0) {
      setLocalCountdown(timeToNextNumber)
    }
  }, [timeToNextNumber])

  useEffect(() => {
    if (localCountdown === null || localCountdown <= 0) return
    const timer = setInterval(() => {
      setLocalCountdown((prev) => {
        if (prev === null || prev <= 1) return callInterval
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [localCountdown, callInterval])

  useEffect(() => {
    if (currentNumber && currentNumber !== previousNumber) {
      setPreviousNumber(currentNumber)
      setShowNewNumberAnimation(true)
      setLocalCountdown(callInterval)
      setTimeout(() => setShowNewNumberAnimation(false), 2000)
    }
  }, [currentNumber, previousNumber, callInterval])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  useEffect(() => {
    if (currentRoom?.status === "finished" && winner) {
      setShowWinnerModal(true)
      if (isWinner) {
        const duration = 5 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }
        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now()
          if (timeLeft <= 0) return clearInterval(interval)
          const particleCount = 50 * (timeLeft / duration)
          confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 } })
          confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 } })
        }, 250)
        return () => clearInterval(interval)
      }
    }
  }, [currentRoom?.status, winner, isWinner])

  const handleLeaveRoom = async () => {
    if (isLeavingRoom) return
    setIsLeavingRoom(true)
    try {
      await leaveRoom()
      router.push("/play")
    } catch (error) {
      console.error("Failed to leave room:", error)
    } finally {
      setIsLeavingRoom(false)
    }
  }

  const handleClaimBingo = async () => {
    if (isClaimingBingo || !currentRoom || !hasWon) return
    setIsClaimingBingo(true)
    try {
      await declareWinner()
      toast({ title: "BINGO!", description: "You claimed the win!" })
    } catch (error) {
      console.error("Failed to claim bingo:", error)
      toast({ title: "Error", description: "Failed to claim bingo. Please try again.", variant: "destructive" })
    } finally {
      setIsClaimingBingo(false)
    }
  }

  const copyTransactionId = () => {
    const txId = "5wHu1qwD7q4f6K...mock_tx_id"
    navigator.clipboard.writeText(txId)
    setCopiedTx(true)
    setTimeout(() => setCopiedTx(false), 2000)
  }

  const getLetterColorClass = (letter: string) => {
    switch (letter) {
      case "B":
        return "bingo-ball-b"
      case "I":
        return "bingo-ball-i"
      case "N":
        return "bingo-ball-n"
      case "G":
        return "bingo-ball-g"
      case "O":
        return "bingo-ball-o"
      default:
        return "bg-primary"
    }
  }

  if (!currentRoom) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-primary">Loading game...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLeaveRoom}
              disabled={isLeavingRoom}
              className="hover:bg-red-500/20 hover:text-red-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                {currentRoom.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {playerCount} Players
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(gameTime)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Circle className="h-3 w-3" />
                  {calledNumbers.length}/75 Numbers
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPaid && (
              <motion.div
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-2 rounded-xl border border-yellow-500/30"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="font-bold text-yellow-600">
                    {potAmount} {currencySymbol}
                  </p>
                </div>
              </motion.div>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-full"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          {/* Next Number Countdown */}
          <Card className="overflow-hidden border-2 border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer className="h-5 w-5 text-purple-500" />
                Next Number In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-4">
                <motion.div className="relative w-24 h-24 flex items-center justify-center" key={localCountdown}>
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="url(#gradient)"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 1 }}
                      animate={{ pathLength: (localCountdown || 0) / callInterval }}
                      transition={{ duration: 0.5 }}
                      style={{ strokeDasharray: "276.46", strokeDashoffset: 0 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <motion.span
                    className="text-4xl font-bold"
                    key={localCountdown}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {localCountdown || callInterval}
                  </motion.span>
                </motion.div>
                <p className="text-sm text-muted-foreground mt-2">seconds</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Number Display */}
          <Card className="overflow-hidden border-2 border-purple-500/20">
            <CardHeader className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Current Number
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <AnimatePresence mode="wait">
                {currentNumber ? (
                  <motion.div
                    key={currentNumber}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 180, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`${getLetterColorClass(currentNumber.charAt(0))} w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl relative`}
                  >
                    {showNewNumberAnimation && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-yellow-400"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: 2 }}
                      />
                    )}
                    <span className="text-xl font-bold text-white/80">{currentNumber.charAt(0)}</span>
                    <span className="text-4xl font-bold text-white">{currentNumber.substring(1)}</span>
                  </motion.div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground">?</span>
                  </div>
                )}
              </AnimatePresence>

              {/* Claim Bingo Button */}
              {hasWon && !winner && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 w-full">
                  <Button
                    size="lg"
                    onClick={handleClaimBingo}
                    disabled={isClaimingBingo}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg py-6"
                  >
                    {isClaimingBingo ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Trophy className="mr-2 h-5 w-5" />
                        BINGO! Claim Win
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Called Numbers History */}
          <Card className="overflow-hidden border-2 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Called Numbers</span>
                <Badge variant="secondary">{calledNumbers.length}/75</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(calledNumbers.length / 75) * 100} className="h-2 mb-3" />
              <ScrollArea className="h-32 rounded-lg border p-2 bg-white/50 dark:bg-gray-900/50">
                <div className="flex flex-wrap gap-1">
                  {calledNumbers
                    .slice()
                    .reverse()
                    .map((num, index) => (
                      <motion.div
                        key={num}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={`${getLetterColorClass(num.charAt(0))} text-white text-xs px-2 py-1 rounded-full font-medium ${index === 0 ? "ring-2 ring-yellow-400" : ""}`}
                      >
                        {num}
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="overflow-hidden border-2 border-purple-500/20 h-full">
            <CardHeader className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Your Bingo Card
                <Sparkles className="h-5 w-5 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              {playerCard ? (
                <BingoCard
                  card={playerCard}
                  markedCells={markedCells}
                  onToggleCell={toggleCell}
                  calledNumbers={calledNumbers}
                  hasWon={hasWon}
                />
              ) : (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-primary">Generating card...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="overflow-hidden border-2 border-purple-500/20 h-full">
            <CardHeader className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({playerCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="space-y-2">
                {currentRoom.players.map((player, index) => {
                  const isCurrentPlayer = player === publicKey?.toBase58()
                  const isHost = player === currentRoom.host
                  const isPlayerWinner = player === winner
                  const shortAddress = `${player.slice(0, 4)}...${player.slice(-4)}`

                  return (
                    <motion.div
                      key={player}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isPlayerWinner
                          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-400"
                          : isCurrentPlayer
                            ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400"
                            : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className={`text-sm font-bold ${
                            isPlayerWinner
                              ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                              : isCurrentPlayer
                                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                                : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {index + 1}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {shortAddress}
                          {isCurrentPlayer && <span className="text-purple-500"> (You)</span>}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {isHost && (
                            <Badge variant="secondary" className="text-xs">
                              Host
                            </Badge>
                          )}
                          {isPlayerWinner && (
                            <Badge className="text-xs bg-yellow-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Game Info */}
              <div className="mt-6 space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Call Interval</span>
                  <span className="font-medium">{callInterval}s</span>
                </div>
                {isPaid && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entry Fee</span>
                      <span className="font-medium">
                        {entryFee} {currencySymbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prize Pool</span>
                      <span className="font-bold text-green-600">
                        {potAmount} {currencySymbol}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              {isWinner ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center"
                >
                  <Trophy className="h-12 w-12 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center"
                >
                  <Award className="h-12 w-12 text-white" />
                </motion.div>
              )}
            </div>
            <DialogTitle className="text-center text-2xl">
              {isWinner ? (
                <motion.span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                >
                  Congratulations! You Won!
                </motion.span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">Game Over</span>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-center space-y-4 mt-4">
                {isWinner ? (
                  <>
                    <p className="text-lg">You got BINGO!</p>
                    {isPaid && (
                      <motion.div
                        className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <DollarSign className="h-6 w-6 text-green-600" />
                          <span className="text-2xl font-bold text-green-600">
                            +{potAmount} {currencySymbol}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Prize sent to your wallet</p>

                        {/* Transaction Proof */}
                        <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Transaction ID</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-1 truncate">
                              5wHu1qwD7q4f6K...mock_tx_id
                            </code>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyTransactionId}>
                              {copiedTx ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open("https://solscan.io/tx/mock", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                      <p className="text-sm text-muted-foreground mb-2">Winner</p>
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <span className="font-mono">
                          {winner?.slice(0, 8)}...{winner?.slice(-8)}
                        </span>
                      </div>
                    </div>
                    {isPaid && (
                      <div className="text-muted-foreground">
                        <p>
                          You lost {entryFee} {currencySymbol}
                        </p>
                        <p className="text-sm mt-1">Better luck next time!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              onClick={handleLeaveRoom}
              disabled={isLeavingRoom}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLeavingRoom ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Returning...
                </>
              ) : (
                "Return to Lobby"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
