"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameContext } from "@/context/game-context"
import { useWallet } from "@solana/wallet-adapter-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Coins, AlertTriangle, Clock, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { useSolanaToken } from "@/context/solana-token-context"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export default function GameLobby() {
  const { publicKey } = useWallet()
  const { currentRoom, leaveRoom, confirmPayment, hasConfirmedPayment, isRoomReady } = useGameContext()
  const { tokenBalance, solBalance, tokenAddress, requestRefund } = useSolanaToken()
  const router = useRouter()

  const [localWaitingTime, setLocalWaitingTime] = useState(0)
  const [canRequestRefund, setCanRequestRefund] = useState(false)
  const [isRequestingRefund, setIsRequestingRefund] = useState(false)
  const [isLeavingRoom, setIsLeavingRoom] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [joinTime, setJoinTime] = useState<number | null>(null)

  const isHost = currentRoom?.host === publicKey?.toBase58()
  const playerCount = currentRoom?.players?.length || 0
  const maxPlayers = currentRoom?.maxPlayers || 0
  const isFull = playerCount >= maxPlayers
  const progress = (playerCount / maxPlayers) * 100
  const isPaid = currentRoom?.isPaid || false
  const entryFee = currentRoom?.entryFee || 0
  const confirmedCount = currentRoom?.paymentConfirmed?.length || 0
  const paymentProgress = (confirmedCount / playerCount) * 100

  useEffect(() => {
    if (currentRoom && currentRoom.status === "waiting") {
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current)
        waitingTimerRef.current = null
      }

      if (!joinTime) {
        const now = Date.now()
        setJoinTime(now)
        setLocalWaitingTime(0)
      }

      waitingTimerRef.current = setInterval(() => {
        const now = Date.now()
        if (joinTime) {
          const elapsed = Math.floor((now - joinTime) / 1000)
          setLocalWaitingTime(elapsed)
        }
      }, 1000)
    }

    return () => {
      if (waitingTimerRef.current) {
        clearInterval(waitingTimerRef.current)
        waitingTimerRef.current = null
      }
    }
  }, [currentRoom, joinTime])

  const formatWaitingTime = () => {
    const minutes = Math.floor(localWaitingTime / 60)
    const seconds = localWaitingTime % 60
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const timeUntilRefund = () => {
    const remainingSeconds = 600 - localWaitingTime
    if (remainingSeconds <= 0) return "Available now"

    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    return `Available in ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const handleRequestRefund = async () => {
    if (!currentRoom || !canRequestRefund) return

    setIsRequestingRefund(true)
    try {
      const success = await requestRefund(currentRoom.id)
      if (success) {
        await leaveRoom()
        router.push("/play")
      }
    } catch (error) {
      console.error("Failed to request refund:", error)
    } finally {
      setIsRequestingRefund(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (isLeavingRoom) return

    setIsLeavingRoom(true)
    try {
      await leaveRoom()
    } catch (error) {
      console.error("Failed to leave room:", error)
      setIsLeavingRoom(false)
    }
  }

  const handleConfirmPayment = () => {
    if (currentRoom) {
      confirmPayment(currentRoom.id)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  const canStartGame = isHost && isFull && isRoomReady
  const currentBalance = tokenAddress ? tokenBalance : solBalance
  const currencySymbol = tokenAddress ? "SBINGO" : "SOL"

  if (!currentRoom) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="absolute -z-10 top-10 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -z-10 bottom-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ["#8b5cf6", "#3b82f6", "#ec4899", "#10b981", "#f59e0b"][Math.floor(Math.random() * 5)],
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              initial={{
                y: -20,
                opacity: 1,
                scale: Math.random() * 1 + 0.5,
              }}
              animate={{
                y: 500,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      <Card className="w-full max-w-md mx-auto overflow-hidden border-2 hover:border-primary/30 transition-colors rounded-xl shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
        <CardHeader className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Waiting for Players
            </CardTitle>
            <Badge variant="outline" className="bg-white/30 backdrop-blur-sm">
              Room: {currentRoom.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert variant="info" className="bg-blue-500/10 border-blue-200 text-blue-800 dark:text-blue-300">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Game will start automatically when full</AlertTitle>
            <AlertDescription>
              The game will begin once all players have joined and confirmed payment (if required).
            </AlertDescription>
          </Alert>

          <motion.div
            className="flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-3 rounded-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Waiting time:</span>
            </div>
            <span className="font-bold text-lg text-purple-700">{formatWaitingTime()}</span>
          </motion.div>

          {isPaid && (
            <motion.div
              className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-200 rounded-xl p-4 space-y-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Paid Game</span>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  Entry Fee: {entryFee} {currencySymbol}
                </Badge>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    Payment confirmed: {confirmedCount}/{playerCount}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {isRoomReady ? "All players confirmed" : "Waiting for payments..."}
                  </span>
                </div>
                <Progress value={paymentProgress} className="h-2 bg-gray-200 dark:bg-gray-700" />
              </div>

              {!hasConfirmedPayment && (
                <div className="pt-2">
                  <Alert variant="warning" className="bg-amber-500/10 text-amber-600 border-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Payment Required</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                      <span>
                        You need to confirm payment of {entryFee} {currencySymbol} to join this game.
                      </span>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Your balance: {currentBalance} {currencySymbol}
                        </span>
                        <Button
                          size="sm"
                          onClick={handleConfirmPayment}
                          disabled={currentBalance < entryFee}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          Confirm Payment
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {hasConfirmedPayment && (
                <div className="pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Refund status:</span>
                    <span className={canRequestRefund ? "text-green-600" : "text-amber-600"}>{timeUntilRefund()}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                Players: {playerCount}/{maxPlayers}
              </span>
              <span className="text-sm text-muted-foreground">
                {isFull
                  ? isRoomReady
                    ? "Room full! Starting soon..."
                    : "Waiting for payments..."
                  : "Waiting for more players..."}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="border rounded-xl p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <h3 className="font-medium mb-3">Players in Lobby</h3>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {currentRoom.players.map((player, index) => {
                  const isCurrentPlayer = player === publicKey?.toBase58()
                  const shortAddress = `${player.slice(0, 4)}...${player.slice(-4)}`
                  const hasConfirmed = currentRoom.paymentConfirmed.includes(player)

                  return (
                    <motion.div
                      key={player}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ delay: index * 0.1, type: "spring" }}
                      className={`flex items-center space-x-2 p-3 rounded-xl ${
                        isPaid && hasConfirmed
                          ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200"
                          : isPaid && !hasConfirmed
                            ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200"
                            : "bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-200/50"
                      }`}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className={`text-sm ${
                            isCurrentPlayer
                              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {index + 1}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">
                          {shortAddress}
                          {isCurrentPlayer && " (You)"}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {currentRoom.host === player && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-purple-500/10 text-purple-700 border-purple-200"
                            >
                              Host
                            </Badge>
                          )}
                          {isPaid && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                hasConfirmed
                                  ? "bg-green-500/10 text-green-600 border-green-200"
                                  : "bg-amber-500/10 text-amber-600 border-amber-200"
                              }`}
                            >
                              {hasConfirmed ? "Paid" : "Unpaid"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {Array.from({ length: maxPlayers - playerCount }).map((_, index) => (
                <motion.div
                  key={`empty-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  transition={{ delay: (playerCount + index) * 0.1 }}
                  className="flex items-center space-x-2 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800">
                      ?
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Waiting...</p>
                </motion.div>
              ))}
            </div>
          </div>

          {canStartGame && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center space-x-2 text-primary bg-primary/10 px-4 py-2 rounded-full">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">Game starting soon...</span>
              </div>
            </motion.div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
          {isPaid && hasConfirmedPayment && canRequestRefund ? (
            <Button
              variant="outline"
              className="w-full text-amber-600 border-amber-200 hover:bg-amber-500/10 bg-transparent"
              onClick={handleRequestRefund}
              disabled={isRequestingRefund}
            >
              {isRequestingRefund ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing refund...
                </>
              ) : (
                "Request Refund & Exit"
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleLeaveRoom}
              disabled={isLeavingRoom}
            >
              {isLeavingRoom ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exiting...
                </>
              ) : (
                "Leave Room"
              )}
            </Button>
          )}

          {isHost && isFull && !isRoomReady && (
            <Button variant="secondary" className="w-full" disabled>
              Waiting for payments
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
