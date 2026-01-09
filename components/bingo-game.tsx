"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useGameContext } from "@/context/game-context"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import CreateRoomForm from "./room/create-room-form"
import JoinRoomForm from "./room/join-room-form"
import GameLobby from "./room/game-lobby"
import OnlineGame from "./online-game"
import SpectatorView from "./spectator-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function BingoGame() {
  const { connected, publicKey } = useWallet()
  const { gameState, currentRoom, isInRoom, isSpectating, fetchAvailableRooms, leaveRoom } = useGameContext()
  const [activeTab, setActiveTab] = useState<string>("join")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false)
        if (connected && publicKey) {
          fetchAvailableRooms().catch(() => {})
        }
      }
    }, 500)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [connected, publicKey, fetchAvailableRooms])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-primary">Loading game...</span>
      </div>
    )
  }

  if (!connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="absolute -z-10 top-10 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -z-10 bottom-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

        <Card className="w-full max-w-md mx-auto overflow-hidden rounded-xl shadow-xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-2 border-purple-500/20">
          <CardHeader className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
            <CardTitle className="text-center">Connect Your Wallet</CardTitle>
            <CardDescription className="text-center">
              Please connect your Solana wallet to play the online Bingo game.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <WalletMultiButton />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (gameState === "spectating" && currentRoom) {
    return <SpectatorView />
  }

  if (gameState === "playing" && currentRoom) {
    return <OnlineGame />
  }

  if (gameState === "waiting" && currentRoom) {
    return <GameLobby />
  }

  return (
    <div className="space-y-6 w-full">
      <AnimatePresence>
        {isInRoom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-xl font-bold mb-4">You're currently in a room</h2>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => router.push("/play")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Return to Game
              </Button>
              <Button variant="destructive" onClick={() => leaveRoom()}>
                Leave Room
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="w-full mx-auto overflow-hidden rounded-xl shadow-xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-2 border-purple-500/20">
          <CardHeader className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
            <CardTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Online Bingo
            </CardTitle>
            <CardDescription className="text-center">Create a new room or join an existing one</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger
                  value="join"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                >
                  Join Room
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                >
                  Create Room
                </TabsTrigger>
              </TabsList>

              <TabsContent value="join" className="mt-0">
                <JoinRoomForm />
              </TabsContent>
              <TabsContent value="create" className="mt-0">
                <CreateRoomForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
