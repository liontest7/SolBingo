"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useGameContext } from "@/context/game-context"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Coins, Eye } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useRouter } from "next/navigation"

export default function JoinRoomForm() {
  const { availableRooms, joinRoom, fetchAvailableRooms, isInRoom, watchRoom, currentRoom, leaveRoom } =
    useGameContext()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "free" | "paid">("all")
  const router = useRouter()

  // Use a ref to track if the component is mounted
  const isMountedRef = useRef(true)

  // Filter rooms based on search term and active tab
  const filteredRooms = availableRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeTab === "all" || (activeTab === "free" && !room.isPaid) || (activeTab === "paid" && room.isPaid)),
  )

  // Memoize the loadRooms function to prevent it from changing on every render
  const loadRooms = useCallback(async () => {
    if (!isMountedRef.current) return

    setIsLoading(true)
    try {
      await fetchAvailableRooms()
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [fetchAvailableRooms])

  // Update the useEffect hook to prevent memory leaks and race conditions
  useEffect(() => {
    // Set isMounted to true when component mounts
    isMountedRef.current = true

    // Initial load
    loadRooms()

    // Refresh the room list every 10 seconds
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadRooms()
      }
    }, 10000)

    // Cleanup function
    return () => {
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [loadRooms]) // Only depend on the memoized loadRooms function

  const handleJoinRoom = async (roomId: string) => {
    if (isInRoom) return

    try {
      await joinRoom(roomId)
    } catch (error) {
      console.error("Failed to join room:", error)
    }
  }

  const handleWatchRoom = async (roomId: string) => {
    try {
      await watchRoom(roomId)
    } catch (error) {
      console.error("Failed to watch room:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={() => loadRooms()} disabled={isLoading} size="icon">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>↻</span>}
        </Button>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "all" | "free" | "paid")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Rooms</TabsTrigger>
          <TabsTrigger value="free">Free</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRooms.length > 0 ? (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            <AnimatePresence>
              {filteredRooms.map((room, index) => {
                return (
                  <RoomItem
                    key={room.id}
                    room={room}
                    index={index}
                    handleJoinRoom={handleJoinRoom}
                    handleWatchRoom={handleWatchRoom}
                    isInRoom={isInRoom}
                  />
                )
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No rooms match your search" : `No ${activeTab === "all" ? "" : activeTab} rooms available`}
        </div>
      )}

      {isInRoom && currentRoom && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 border-2 border-red-500/30 rounded-lg bg-red-500/5"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-medium">Currently in Room: {currentRoom.name}</h3>
              <p className="text-sm text-muted-foreground">
                You need to leave your current room before joining or creating a new one.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push("/play")} className="whitespace-nowrap">
                Return to Room
              </Button>
              <Button variant="destructive" size="sm" onClick={() => leaveRoom()} className="whitespace-nowrap">
                Leave Room
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function RoomItem({
  room,
  index,
  handleJoinRoom,
  handleWatchRoom,
  isInRoom,
}: {
  room: any
  index: number
  handleJoinRoom: (roomId: string) => Promise<void>
  handleWatchRoom: (roomId: string) => Promise<void>
  isInRoom: boolean
}) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <motion.div
      key={room.id}
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="transform transition-all duration-300 hover:scale-[1.02]"
    >
      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{room.name}</h3>
                  {room.isPaid && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700"
                    >
                      <Coins className="h-3 w-3" />
                      <span>{room.entryFee} SBINGO</span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">
                    {room.players.length}/{room.maxPlayers} Players
                  </Badge>
                  <Badge variant="secondary">{room.callInterval}s Interval</Badge>
                  {room.isPaid && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      Pot: {room.totalPot} SBINGO
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWatchRoom(room.id)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>Watch</span>
                </Button>

                <Button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.players.length >= room.maxPlayers || isInRoom}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  Join Room
                </Button>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  style={{ width: `${(room.players.length / room.maxPlayers) * 100}%` }}
                />
              </div>
              <span>
                {room.players.length >= room.maxPlayers
                  ? "Room full"
                  : `${room.maxPlayers - room.players.length} spots left`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
