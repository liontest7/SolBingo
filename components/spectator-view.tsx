"use client"

import { useState, useEffect } from "react"
import { useGameContext } from "@/context/game-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Eye, Users, Coins, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export default function SpectatorView() {
  const { currentRoom, stopWatching, calledNumbers } = useGameContext()
  const router = useRouter()
  const [lastCalledNumber, setLastCalledNumber] = useState<string | null>(null)

  // Track the last called number for animation
  useEffect(() => {
    if (currentRoom?.currentNumber && currentRoom.currentNumber !== lastCalledNumber) {
      setLastCalledNumber(currentRoom.currentNumber)
    }
  }, [currentRoom?.currentNumber, lastCalledNumber])

  if (!currentRoom) {
    return null
  }

  // Group called numbers by letter
  const groupedNumbers = calledNumbers.reduce(
    (acc, number) => {
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

  const handleStopWatching = () => {
    stopWatching()
    router.push("/play")
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <Badge variant="outline" className="mb-2 bg-blue-500/10 text-blue-600">
                  <Eye className="h-3 w-3 mr-1" /> Spectator Mode
                </Badge>
                <CardTitle className="flex items-center gap-2">Room: {currentRoom.name}</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={handleStopWatching} className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Exit</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {currentRoom.players.length}/{currentRoom.maxPlayers} Players
                  </span>
                </Badge>

                {currentRoom.isPaid && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-600">
                    <Coins className="h-3 w-3" />
                    <span>Pot: {currentRoom.totalPot} SBINGO</span>
                  </Badge>
                )}
              </div>

              <div className="flex flex-col items-center mb-6 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentRoom.currentNumber || "empty"}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-6xl font-bold mb-4 h-24 flex items-center justify-center bg-gradient-to-r from-purple-500/10 to-blue-500/10 w-full rounded-lg"
                  >
                    {currentRoom.currentNumber || "?"}
                  </motion.div>
                </AnimatePresence>

                <p className="text-sm text-muted-foreground">
                  Game Status: <span className="font-medium text-primary">{currentRoom.status.toUpperCase()}</span>
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold mb-2">Called Numbers</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {letters.map((letter) => (
                    <div key={letter} className="text-center">
                      <div className="font-bold mb-1 text-primary">{letter}</div>
                      <div className="text-xs text-muted-foreground">
                        {groupedNumbers[letter]?.length || 0}/{letter === "N" ? 14 : 15}
                      </div>
                    </div>
                  ))}
                </div>

                <ScrollArea className="h-[200px] border rounded-md p-4">
                  <div className="grid grid-cols-5 gap-2">
                    {letters.map((letter) => (
                      <div key={letter} className="flex flex-col gap-1">
                        {groupedNumbers[letter]?.map((number, index) => (
                          <motion.div
                            key={number}
                            className={`bg-muted px-2 py-1 rounded-md text-sm font-medium text-center ${
                              number === currentRoom.currentNumber ? "bg-primary text-primary-foreground" : ""
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
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRoom.players.map((player, index) => {
                  const shortAddress = `${player.slice(0, 6)}...${player.slice(-4)}`
                  const isHost = player === currentRoom.host
                  const hasConfirmed = currentRoom.paymentConfirmed.includes(player)

                  return (
                    <motion.div
                      key={player}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border-2 ${
                        isHost
                          ? "border-purple-300 bg-purple-50/50 dark:bg-purple-900/10"
                          : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isHost ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{shortAddress}</div>
                            <div className="flex gap-1 mt-1">
                              {isHost && (
                                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">
                                  Host
                                </Badge>
                              )}
                              {currentRoom.isPaid && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    hasConfirmed ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                                  }`}
                                >
                                  {hasConfirmed ? "Paid" : "Unpaid"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Spectators ({currentRoom.spectators?.length || 0})</h3>
                {currentRoom.spectators && currentRoom.spectators.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentRoom.spectators.map((spectator) => {
                      const shortAddress = `${spectator.slice(0, 6)}...${spectator.slice(-4)}`
                      return (
                        <Badge key={spectator} variant="outline" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{shortAddress}</span>
                        </Badge>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No other spectators</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
