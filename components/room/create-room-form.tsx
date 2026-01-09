"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGameContext } from "@/context/game-context"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useSolanaToken } from "@/context/solana-token-context"
import { motion } from "framer-motion"
import { Loader2, AlertCircle, Users, Clock, Coins } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

export default function CreateRoomForm() {
  const { createRoom, isInRoom } = useGameContext()
  const { tokenBalance, isInitialized, tokenAddress, solBalance } = useSolanaToken()
  const [isCreating, setIsCreating] = useState(false)
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)

  // Form state
  const [roomName, setRoomName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [callInterval, setCallInterval] = useState(5)
  const [isPaid, setIsPaid] = useState(false)
  const [entryFee, setEntryFee] = useState(0.1)
  const [formError, setFormError] = useState("")

  // Determine which balance to use and currency symbol
  const currentBalance = tokenAddress ? tokenBalance : solBalance
  const currencySymbol = tokenAddress ? "SBINGO" : "SOL"
  const hasEnoughBalance = currentBalance >= entryFee

  async function handleSubmit(e) {
    e.preventDefault()

    if (isInRoom) return

    // Validate form
    if (!roomName || roomName.length < 3) {
      setFormError("Room name must be at least 3 characters")
      return
    }

    // Check if token is initialized for paid games
    if (isPaid && !isInitialized) {
      setFormError("Cannot create a paid game when token is not configured")
      return
    }

    // Check balance for paid games
    if (isPaid && currentBalance < entryFee) {
      setFormError(`You don't have enough ${currencySymbol} for the entry fee`)
      return
    }

    setFormError("")
    setIsCreating(true)

    try {
      const roomId = await createRoom(roomName, maxPlayers, callInterval, isPaid, isPaid ? entryFee : 0)

      if (roomId) {
        setCreatedRoomId(roomId)
      }
    } catch (error) {
      console.error("Failed to create room:", error)
      setFormError("Failed to create room. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* 3D decorative elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="roomName" className="flex items-center gap-2 mb-2">
            <span className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs">
              1
            </span>
            Room Name
          </Label>
          <Input
            id="roomName"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
          />
          <p className="text-sm text-muted-foreground mt-1">Choose a unique name for your bingo room.</p>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <span className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs">
              2
            </span>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>Maximum Players: {maxPlayers}</span>
            </div>
          </Label>
          <Slider
            min={2}
            max={10}
            step={1}
            value={[maxPlayers]}
            onValueChange={(value) => setMaxPlayers(value[0])}
            className="py-4"
          />
          <p className="text-sm text-muted-foreground mt-1">Set the maximum number of players for this room.</p>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <span className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs">
              3
            </span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>Number Call Interval: {callInterval} seconds</span>
            </div>
          </Label>
          <Slider
            min={3}
            max={15}
            step={1}
            value={[callInterval]}
            onValueChange={(value) => setCallInterval(value[0])}
            className="py-4"
          />
          <p className="text-sm text-muted-foreground mt-1">How frequently should a new number be called?</p>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-purple-500" />
              Paid Game
            </Label>
            <p className="text-sm text-muted-foreground">
              Players must pay an entry fee to join. Winner takes all (minus 2% platform fee).
            </p>
          </div>
          <Switch
            checked={isPaid}
            onCheckedChange={setIsPaid}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500"
          />
        </div>

        {isPaid && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="entryFee" className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-purple-500" />
                Entry Fee ({currencySymbol})
              </Label>
              <Input
                id="entryFee"
                type="number"
                min={0.001}
                max={10}
                step={0.001}
                placeholder="0.1"
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                className="border-purple-200 focus:border-purple-500 focus:ring-purple-500/20"
              />
              <p className="text-sm text-muted-foreground mt-1">The amount each player must pay to join the game.</p>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Your Balance:</span>
                <span className="font-bold">
                  {currentBalance.toFixed(4)} {currencySymbol}
                </span>
              </div>
            </div>

            {!hasEnoughBalance && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>You don't have enough {currencySymbol} for the entry fee.</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 rounded-xl py-6 text-lg font-medium"
          disabled={isCreating || isInRoom || (isPaid && (!isInitialized || !hasEnoughBalance))}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Room...
            </>
          ) : (
            "Create Room"
          )}
        </Button>
      </form>
    </motion.div>
  )
}
