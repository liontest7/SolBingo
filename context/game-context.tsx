"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useToast } from "@/components/ui/use-toast"
import { useNotifications } from "@/context/notification-context"
import { generateRandomBingoNumber } from "@/lib/bingo-utils"
import { createClient } from "@/lib/redis-client"
import { useRouter } from "next/navigation"
import { useSolanaToken } from "@/context/solana-token-context"

// Game room type
export interface GameRoom {
  id: string
  name: string
  host: string
  players: string[]
  maxPlayers: number
  callInterval: number
  calledNumbers: string[]
  currentNumber: string | null
  status: "waiting" | "playing" | "finished"
  winner: string | null
  createdAt: number
  isPaid: boolean
  entryFee: number
  totalPot: number
  paymentConfirmed: string[] // Array of players who have confirmed payment
  spectators: string[] // Array of spectators watching the game
  nextNumberTime?: number // Timestamp when the next number will be called
}

// Game context type
interface GameContextType {
  gameState: "idle" | "waiting" | "playing" | "finished" | "spectating"
  currentRoom: GameRoom | null
  availableRooms: GameRoom[]
  calledNumbers: string[]
  createRoom: (
    name: string,
    maxPlayers: number,
    callInterval: number,
    isPaid: boolean,
    entryFee: number,
  ) => Promise<string>
  joinRoom: (roomId: string) => Promise<void>
  leaveRoom: () => Promise<void>
  watchRoom: (roomId: string) => Promise<void>
  stopWatching: () => Promise<void>
  fetchAvailableRooms: () => Promise<void>
  declareWinner: () => Promise<void>
  isInRoom: boolean
  isSpectating: boolean
  confirmPayment: (roomId: string) => Promise<void>
  hasConfirmedPayment: boolean
  isRoomReady: boolean
  joinTime: number | null // Track when the player joined the room
  timeToNextNumber: number | null // Time remaining until next number is called (in seconds)
  waitingTime: number // Current waiting time in seconds
}

// Create the context
const GameContext = createContext<GameContextType>({
  gameState: "idle",
  currentRoom: null,
  availableRooms: [],
  calledNumbers: [],
  createRoom: async () => "",
  joinRoom: async () => {},
  leaveRoom: async () => {},
  watchRoom: async () => {},
  stopWatching: async () => {},
  fetchAvailableRooms: async () => {},
  declareWinner: async () => {},
  isInRoom: false,
  isSpectating: false,
  confirmPayment: async () => {},
  hasConfirmedPayment: false,
  isRoomReady: false,
  joinTime: null,
  timeToNextNumber: null,
  waitingTime: 0,
})

// Custom hook to use the game context
export const useGameContext = () => useContext(GameContext)

// Provider component
export function GameProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet()
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const router = useRouter()
  const { makePayment } = useSolanaToken()

  const [gameState, setGameState] = useState<"idle" | "waiting" | "playing" | "finished" | "spectating">("idle")
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null)
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([])
  const [calledNumbers, setCalledNumbers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [joinTime, setJoinTime] = useState<number | null>(null) // Track when player joined the room
  const [waitingTime, setWaitingTime] = useState<number>(0) // Current waiting time in seconds
  const [timeToNextNumber, setTimeToNextNumber] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLeavingRoom, setIsLeavingRoom] = useState(false)

  // Use refs to track intervals
  const numberCallerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const waitingTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use a ref to store the redis client to avoid recreating it on every render
  const redisClientRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Initialize the Redis client only once
  useEffect(() => {
    if (!redisClientRef.current) {
      try {
        redisClientRef.current = createClient()
        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to initialize Redis client:", error)
      }
    }
  }, [])

  // Derived state
  const isInRoom = currentRoom !== null && gameState !== "spectating"
  const isSpectating = gameState === "spectating"
  const hasConfirmedPayment = currentRoom?.paymentConfirmed?.includes(publicKey?.toBase58() || "") || false
  const isRoomReady = currentRoom?.isPaid
    ? currentRoom.players.every((player) => currentRoom.paymentConfirmed.includes(player))
    : true

  // Clean up function for intervals
  const cleanupIntervals = useCallback(() => {
    console.log("Cleaning up all intervals")

    if (numberCallerIntervalRef.current) {
      console.log("Clearing number caller interval")
      clearInterval(numberCallerIntervalRef.current)
      numberCallerIntervalRef.current = null
    }

    if (countdownIntervalRef.current) {
      console.log("Clearing countdown interval")
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    if (pollIntervalRef.current) {
      console.log("Clearing poll interval")
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    if (waitingTimeIntervalRef.current) {
      console.log("Clearing waiting time interval")
      clearInterval(waitingTimeIntervalRef.current)
      waitingTimeIntervalRef.current = null
    }
  }, [])

  // Fetch available rooms
  const fetchAvailableRooms = useCallback(async () => {
    if (!publicKey || !redisClientRef.current || !isInitialized) return

    try {
      const rooms = await redisClientRef.current.getAvailableRooms()
      setAvailableRooms(rooms)
    } catch (error) {
      console.error("Error fetching available rooms:", error)
      toast({
        title: "Error",
        description: "Failed to fetch available rooms",
        variant: "destructive",
      })
    }
  }, [publicKey, toast, isInitialized])

  // Create a new room
  const createRoom = useCallback(
    async (
      name: string,
      maxPlayers: number,
      callInterval: number,
      isPaid: boolean,
      entryFee: number,
    ): Promise<string> => {
      if (!publicKey || !redisClientRef.current || !isInitialized) {
        toast({
          title: "Error",
          description: "System not ready or wallet not connected",
          variant: "destructive",
        })
        return ""
      }

      // Check if player is already in a room
      if (currentRoom && !isSpectating) {
        toast({
          title: "Already in a room",
          description: "You must leave your current room before creating a new one",
          variant: "destructive",
        })
        return ""
      }

      setIsLoading(true)
      try {
        const playerAddress = publicKey.toBase58()

        // For paid rooms, process payment first
        if (isPaid) {
          const paymentSuccess = await makePayment(entryFee, name) // Pass room name as roomId for tracking
          if (!paymentSuccess) {
            throw new Error("Payment failed")
          }
        }

        // Initialize payment confirmed array - for paid rooms, creator is automatically confirmed if payment succeeded
        const paymentConfirmed = isPaid ? [playerAddress] : [playerAddress]

        const roomId = await redisClientRef.current.createRoom({
          name,
          host: playerAddress,
          players: [playerAddress],
          maxPlayers,
          callInterval,
          isPaid,
          entryFee,
          totalPot: isPaid ? entryFee : 0, // Start with entry fee if paid
          paymentConfirmed,
          spectators: [],
        })

        if (!roomId) {
          throw new Error("Failed to create room")
        }

        // Join the room after creating it
        const room = await redisClientRef.current.getRoomById(roomId)
        if (!room) {
          throw new Error("Room not found after creation")
        }

        setCurrentRoom(room)
        setGameState("waiting")
        setCalledNumbers(room.calledNumbers || [])

        // Set join time to current time
        const now = Date.now()
        setJoinTime(now)
        setWaitingTime(0) // Reset waiting time

        // Start the waiting time timer
        startWaitingTimeTimer()

        toast({
          title: "Room created",
          description: `You've created room "${name}"`,
        })

        // Add notification only if not on the game page
        if (typeof window !== "undefined" && window.location.pathname !== "/play") {
          addNotification({
            title: "Room Created",
            message: `Your room "${name}" is waiting for players.`,
            type: "info",
            action: {
              label: "Go to Game",
              onClick: () => router.push("/play"),
            },
          })
        }

        return roomId
      } catch (error) {
        console.error("Error creating room:", error)
        toast({
          title: "Error",
          description: "Failed to create room",
          variant: "destructive",
        })
        return ""
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, toast, currentRoom, addNotification, router, makePayment, isSpectating, isInitialized],
  )

  // Start the waiting time timer
  const startWaitingTimeTimer = useCallback(() => {
    console.log("Starting waiting time timer")

    // Clear any existing waiting time interval
    if (waitingTimeIntervalRef.current) {
      clearInterval(waitingTimeIntervalRef.current)
      waitingTimeIntervalRef.current = null
    }

    // Set join time if it's not already set
    if (!joinTime) {
      const now = Date.now()
      console.log("Setting initial joinTime:", now)
      setJoinTime(now)
      setWaitingTime(0)
    }

    // Set up interval to update waiting time every second
    waitingTimeIntervalRef.current = setInterval(() => {
      if (joinTime) {
        const now = Date.now()
        const elapsed = Math.floor((now - joinTime) / 1000)
        console.log("Updating waiting time:", elapsed)
        setWaitingTime(elapsed)
      }
    }, 1000)

    return () => {
      if (waitingTimeIntervalRef.current) {
        clearInterval(waitingTimeIntervalRef.current)
        waitingTimeIntervalRef.current = null
      }
    }
  }, [joinTime])

  // Join an existing room
  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!publicKey || !redisClientRef.current || !isInitialized) {
        toast({
          title: "Error",
          description: "System not ready or wallet not connected",
          variant: "destructive",
        })
        return
      }

      // Check if player is already in a room
      if (currentRoom && !isSpectating) {
        toast({
          title: "Already in a room",
          description: "You must leave your current room before joining a new one",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const playerAddress = publicKey.toBase58()

        // First check if the room exists
        const roomCheck = await redisClientRef.current.getRoomById(roomId)
        if (!roomCheck) {
          throw new Error("Room not found")
        }

        // Then join the room
        const room = await redisClientRef.current.joinRoom(roomId, playerAddress)

        // Update state with the joined room
        setCurrentRoom(room)
        setGameState(room.status === "playing" ? "playing" : "waiting")
        setCalledNumbers(room.calledNumbers || [])

        // Set join time to current time
        const now = Date.now()
        setJoinTime(now)
        setWaitingTime(0) // Reset waiting time
        console.log("Set joinTime on room join to:", now)

        // Start the waiting time timer if in waiting state
        if (room.status === "waiting") {
          startWaitingTimeTimer()
        }

        toast({
          title: "Room joined",
          description: `You've joined room "${room.name}"`,
        })

        // Add notification that allows the player to navigate back to the game
        // Only add if not already on the game page
        if (typeof window !== "undefined" && window.location.pathname !== "/play") {
          addNotification({
            title: "Room Joined",
            message: `You've joined "${room.name}".`,
            type: "info",
            action: {
              label: "Go to Game",
              onClick: () => router.push("/play"),
            },
          })
        }

        // If it's a paid room, prompt for payment
        if (room.isPaid && !room.paymentConfirmed.includes(playerAddress)) {
          addNotification({
            title: "Payment Required",
            message: `Please confirm your payment of ${room.entryFee} tokens to join the game.`,
            type: "warning",
            action: {
              label: "Confirm Payment",
              onClick: () => router.push("/play"),
            },
          })
        }

        // If joining a game in progress, immediately set up the number caller and countdown
        if (room.status === "playing") {
          setTimeout(() => {
            setupCountdownTimer()
            setupNumberCaller()
          }, 500)
        }
      } catch (error) {
        console.error("Error joining room:", error)
        toast({
          title: "Error",
          description: "Failed to join room",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, toast, currentRoom, addNotification, router, isSpectating, isInitialized, startWaitingTimeTimer],
  )

  // Setup countdown timer for next number
  const setupCountdownTimer = useCallback(() => {
    if (!currentRoom || currentRoom.status !== "playing") {
      console.log("Cannot setup countdown timer - room not in playing state")
      return
    }

    console.log("Setting up countdown timer for room:", currentRoom.id)

    // Clear any existing countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    // Set initial countdown value
    const callInterval = currentRoom.callInterval || 5
    setTimeToNextNumber(callInterval)

    // Set up interval to update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setTimeToNextNumber((prev) => {
        if (prev === null || prev <= 0) {
          return callInterval
        }
        return prev - 1
      })
    }, 1000)

    console.log("Countdown timer set up with interval:", callInterval)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [currentRoom])

  // Call a number at regular intervals
  const setupNumberCaller = useCallback(() => {
    if (!currentRoom || currentRoom.status !== "playing" || !redisClientRef.current || !isInitialized) {
      console.log("Cannot setup number caller - conditions not met")
      return
    }

    console.log("Setting up number caller for room:", currentRoom.id, "with interval:", currentRoom.callInterval)

    // Clear any existing interval
    if (numberCallerIntervalRef.current) {
      clearInterval(numberCallerIntervalRef.current)
      numberCallerIntervalRef.current = null
    }

    // Set up interval to call numbers
    const callInterval = currentRoom.callInterval || 5

    // Call the first number immediately if there are no called numbers yet
    if (!currentRoom.calledNumbers || currentRoom.calledNumbers.length === 0) {
      ;(async () => {
        try {
          const firstNumber = generateRandomBingoNumber([])
          if (firstNumber && redisClientRef.current) {
            await redisClientRef.current.callNumber(currentRoom.id, firstNumber)
            console.log("Called first number:", firstNumber)

            // Force update the called numbers array
            setCalledNumbers([firstNumber])

            // Force update the current number
            setCurrentRoom((prev) => {
              if (prev) {
                return {
                  ...prev,
                  currentNumber: firstNumber,
                  calledNumbers: [firstNumber],
                }
              }
              return prev
            })
          }
        } catch (error) {
          console.error("Error calling first number:", error)
        }
      })()
    }

    // Set up interval for subsequent numbers
    numberCallerIntervalRef.current = setInterval(async () => {
      try {
        console.log("Number caller interval triggered for room:", currentRoom.id)

        // Check if the room still exists and is in playing state
        const updatedRoom = await redisClientRef.current?.getRoomById(currentRoom.id)
        if (!updatedRoom) {
          // Room no longer exists
          console.log("Room no longer exists:", currentRoom.id)
          if (numberCallerIntervalRef.current) {
            clearInterval(numberCallerIntervalRef.current)
            numberCallerIntervalRef.current = null
          }
          return
        }

        if (updatedRoom.status !== "playing") {
          console.log("Room is no longer in playing state:", updatedRoom.status)
          if (numberCallerIntervalRef.current) {
            clearInterval(numberCallerIntervalRef.current)
            numberCallerIntervalRef.current = null
          }
          return
        }

        // Generate a new number
        const newNumber = generateRandomBingoNumber(updatedRoom.calledNumbers || [])
        if (newNumber && redisClientRef.current) {
          await redisClientRef.current.callNumber(currentRoom.id, newNumber)
          console.log("Called number:", newNumber)

          // Force update the called numbers array
          setCalledNumbers((prev) => {
            if (!prev.includes(newNumber)) {
              return [...prev, newNumber]
            }
            return prev
          })

          // Force update the current room state
          setCurrentRoom((prev) => {
            if (prev) {
              return {
                ...prev,
                currentNumber: newNumber,
                calledNumbers: [...(prev.calledNumbers || []), newNumber],
              }
            }
            return prev
          })
        } else {
          console.log("No more numbers to call or error generating number")
          // All numbers have been called
          if (numberCallerIntervalRef.current) {
            clearInterval(numberCallerIntervalRef.current)
            numberCallerIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error("Error calling number:", error)
      }
    }, callInterval * 1000)

    console.log("Number caller interval set up with interval:", callInterval)

    return () => {
      if (numberCallerIntervalRef.current) {
        clearInterval(numberCallerIntervalRef.current)
        numberCallerIntervalRef.current = null
      }
    }
  }, [currentRoom, isInitialized])

  // Watch a room as a spectator
  const watchRoom = useCallback(
    async (roomId: string) => {
      if (!publicKey || !redisClientRef.current || !isInitialized) {
        toast({
          title: "Error",
          description: "System not ready or wallet not connected",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const playerAddress = publicKey.toBase58()

        // First check if the room exists
        const roomCheck = await redisClientRef.current.getRoomById(roomId)
        if (!roomCheck) {
          throw new Error("Room not found")
        }

        // Then watch the room
        const room = await redisClientRef.current.watchRoom(roomId, playerAddress)

        // If already in this room as a player, don't change to spectator mode
        if (room.players.includes(playerAddress)) {
          toast({
            title: "Already in this room",
            description: "You are already a player in this room",
          })
          return
        }

        setCurrentRoom(room)
        setGameState("spectating")
        setCalledNumbers(room.calledNumbers || [])

        toast({
          title: "Watching room",
          description: `You're now spectating room "${room.name}"`,
        })

        router.push("/play")
      } catch (error) {
        console.error("Error watching room:", error)
        toast({
          title: "Error",
          description: "Failed to watch room",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, toast, router, isInitialized],
  )

  // Stop watching a room
  const stopWatching = useCallback(async () => {
    if (!publicKey || !currentRoom || gameState !== "spectating" || !redisClientRef.current || !isInitialized) return

    try {
      const playerAddress = publicKey.toBase58()
      await redisClientRef.current.stopWatching(currentRoom.id, playerAddress)

      setCurrentRoom(null)
      setGameState("idle")
      setCalledNumbers([])
      setJoinTime(null) // Clear join time
      setTimeToNextNumber(null)

      toast({
        title: "Stopped watching",
        description: "You've stopped spectating the room",
      })
    } catch (error) {
      console.error("Error stopping spectating:", error)
    }
  }, [publicKey, currentRoom, gameState, toast, isInitialized])

  // Confirm payment for a room
  const confirmPayment = useCallback(
    async (roomId: string) => {
      if (!publicKey || !currentRoom || !redisClientRef.current || !isInitialized) {
        toast({
          title: "Error",
          description: "System not ready, wallet not connected, or not in a room",
        })
        return
      }

      if (!currentRoom.isPaid) {
        toast({
          title: "Error",
          description: "This room doesn't require payment",
          variant: "destructive",
        })
        return
      }

      if (currentRoom.paymentConfirmed.includes(publicKey.toBase58())) {
        toast({
          title: "Already paid",
          description: "You've already confirmed payment for this room",
        })
        return
      }

      setIsLoading(true)
      try {
        // Process payment through wallet
        const success = await makePayment(currentRoom.entryFee, roomId)

        if (success) {
          const playerAddress = publicKey.toBase58()
          await redisClientRef.current.confirmPayment(roomId, playerAddress, currentRoom.entryFee)

          // Update the current room with the new payment confirmation
          const updatedRoom = await redisClientRef.current.getRoomById(roomId)
          if (updatedRoom) {
            setCurrentRoom(updatedRoom)
          }

          toast({
            title: "Payment confirmed",
            description: `Your payment of ${currentRoom.entryFee} tokens has been confirmed`,
          })
        } else {
          toast({
            title: "Payment failed",
            description: "Failed to process your payment. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error confirming payment:", error)
        toast({
          title: "Error",
          description: "Failed to confirm payment",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, currentRoom, toast, makePayment, isInitialized],
  )

  // Reset game state completely
  const resetGameState = useCallback(() => {
    console.log("Resetting game state completely")

    // Clean up all intervals
    cleanupIntervals()

    // Reset all state
    setCurrentRoom(null)
    setGameState("idle")
    setCalledNumbers([])
    setJoinTime(null)
    setWaitingTime(0)
    setTimeToNextNumber(null)
    setIsLeavingRoom(false)

    // Force a refresh of available rooms
    fetchAvailableRooms().catch(console.error)
  }, [cleanupIntervals, fetchAvailableRooms])

  // Leave the current room
  const leaveRoom = useCallback(async () => {
    if (!publicKey || !currentRoom || !redisClientRef.current || !isInitialized) {
      // If there's no current room, just reset the state
      resetGameState()
      return
    }

    setIsLeavingRoom(true)
    console.log("Leaving room:", currentRoom.id)

    // Clean up all intervals first
    cleanupIntervals()

    try {
      const playerAddress = publicKey.toBase58()

      if (gameState === "spectating") {
        await redisClientRef.current.stopWatching(currentRoom.id, playerAddress)
      } else {
        await redisClientRef.current.leaveRoom(currentRoom.id, playerAddress)
      }

      // Reset all state
      resetGameState()

      toast({
        title: gameState === "spectating" ? "Stopped watching" : "Room left",
        description: gameState === "spectating" ? "You've stopped spectating" : "You've left the room",
      })

      // Force a redirect to the play page to refresh the UI
      if (typeof window !== "undefined") {
        window.location.href = "/play"
      } else {
        router.push("/play")
      }
    } catch (error) {
      console.error("Error leaving room:", error)
      toast({
        title: "Error",
        description: "Failed to leave room. Please try again.",
        variant: "destructive",
      })

      // Even if there's an error, reset the state and redirect
      resetGameState()

      if (typeof window !== "undefined") {
        window.location.href = "/play"
      } else {
        router.push("/play")
      }
    }
  }, [publicKey, currentRoom, toast, cleanupIntervals, gameState, isInitialized, router, resetGameState])

  // Declare winner
  const declareWinner = useCallback(async () => {
    if (!publicKey || !currentRoom || !redisClientRef.current || !isInitialized) return

    try {
      const playerAddress = publicKey.toBase58()
      await redisClientRef.current.declareWinner(currentRoom.id, playerAddress)

      toast({
        title: "Bingo!",
        description: "You've won the game!",
      })
    } catch (error) {
      console.error("Error declaring winner:", error)
    }
  }, [publicKey, currentRoom, toast, isInitialized])

  // Handle game completion
  const handleGameCompletion = useCallback(async () => {
    if (!currentRoom) return

    try {
      // Clean up all intervals
      cleanupIntervals()

      // Reset game state
      setGameState("idle")
      setCurrentRoom(null)
      setCalledNumbers([])
      setJoinTime(null)
      setWaitingTime(0)
      setTimeToNextNumber(null)

      // Navigate back to the play page
      router.push("/play")
    } catch (error) {
      console.error("Error handling game completion:", error)
    }
  }, [currentRoom, cleanupIntervals, router])

  // Poll for room updates
  const setupRoomPolling = useCallback(() => {
    if (!publicKey || !currentRoom || !redisClientRef.current || !isInitialized) return

    console.log("Setting up room polling for room:", currentRoom.id)

    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Set up polling interval with a more reasonable frequency
    pollIntervalRef.current = setInterval(async () => {
      try {
        const updatedRoom = await redisClientRef.current?.getRoomById(currentRoom.id)

        if (!updatedRoom) {
          // Room was deleted
          console.log("Room no longer exists:", currentRoom.id)
          cleanupIntervals()
          setCurrentRoom(null)
          setGameState("idle")
          setCalledNumbers([])
          setJoinTime(null)
          setWaitingTime(0)
          setTimeToNextNumber(null)
          return
        }

        // Update room state
        setCurrentRoom(updatedRoom)

        // Update called numbers if they've changed
        if (JSON.stringify(updatedRoom.calledNumbers) !== JSON.stringify(calledNumbers)) {
          setCalledNumbers(updatedRoom.calledNumbers || [])
        }

        // Check if game status changed
        if (updatedRoom.status !== currentRoom.status) {
          console.log("Game status changed from", currentRoom.status, "to", updatedRoom.status)

          if (gameState === "spectating") {
            // Keep spectating state but update if game is playing or finished
            setGameState("spectating")
          } else {
            setGameState(
              updatedRoom.status === "playing" ? "playing" : updatedRoom.status === "finished" ? "finished" : "waiting",
            )
          }

          // If game started, setup number caller and notify the player only if not on the game page
          if (updatedRoom.status === "playing" && currentRoom.status === "waiting") {
            console.log("Game started in room:", updatedRoom.name)

            // Only show toast if on the game page
            if (typeof window !== "undefined" && window.location.pathname === "/play") {
              toast({
                title: "Game started!",
                description: "The bingo game has started",
              })
            }

            // Add notification for game start only if not on the game page
            if (typeof window !== "undefined" && window.location.pathname !== "/play") {
              addNotification({
                title: "Game Started!",
                message: `The game in room "${updatedRoom.name}" has started!`,
                type: "success",
                action: {
                  label: "Go to Game",
                  onClick: () => router.push("/play"),
                },
              })
            }

            // Setup countdown timer and number caller with a delay
            setTimeout(() => {
              setupCountdownTimer()
              setupNumberCaller()
            }, 500)
          }

          // If game finished, cleanup and reset state
          if (updatedRoom.status === "finished") {
            cleanupIntervals()

            // Add notification for game end
            const isWinner = updatedRoom.winner === publicKey.toBase58()
            addNotification({
              title: isWinner ? "You Won!" : "Game Over",
              message: isWinner
                ? `Congratulations! You won the game in room "${updatedRoom.name}"${updatedRoom.isPaid ? ` and earned ${updatedRoom.totalPot * 0.98} tokens!` : "!"}`
                : `The game in room "${updatedRoom.name}" has ended. ${updatedRoom.winner ? `Player ${updatedRoom.winner.slice(0, 6)}... won.` : ""}`,
              type: isWinner ? "success" : "info",
              action: {
                label: "Go to Lobby",
                onClick: () => handleGameCompletion(),
              },
            })
          }
        }
      } catch (error) {
        console.error("Error polling room:", error)
      }
    }, 1000) // Decreased to 1 second for more responsive updates

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [
    publicKey,
    currentRoom,
    calledNumbers,
    cleanupIntervals,
    toast,
    addNotification,
    router,
    gameState,
    setupCountdownTimer,
    setupNumberCaller,
    isInitialized,
    handleGameCompletion,
  ])

  // Auto-start game when room is full and all payments are confirmed
  useEffect(() => {
    if (!currentRoom || !publicKey || !redisClientRef.current || !isInitialized || currentRoom.status !== "waiting") {
      return
    }

    // Check if room is ready to start
    const shouldStartGame = currentRoom.players.length >= currentRoom.maxPlayers && isRoomReady // All payments confirmed for paid rooms

    if (shouldStartGame) {
      // Start the game
      console.log(
        "Auto-starting game for room:",
        currentRoom.id,
        "Players:",
        currentRoom.players.length,
        "/",
        currentRoom.maxPlayers,
      )
      redisClientRef.current.startGame(currentRoom.id).catch(console.error)
    } else {
      console.log(
        "Room not ready to start:",
        currentRoom.id,
        "Players:",
        currentRoom.players.length,
        "/",
        currentRoom.maxPlayers,
        "All payments confirmed:",
        isRoomReady,
      )
    }
  }, [currentRoom, publicKey, isRoomReady, isInitialized])

  // Setup room polling when current room changes
  useEffect(() => {
    if (publicKey && currentRoom && redisClientRef.current && isInitialized) {
      setupRoomPolling()
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [publicKey, currentRoom, setupRoomPolling, isInitialized])

  // Setup number caller and countdown timer when game starts
  useEffect(() => {
    if (currentRoom && currentRoom.status === "playing" && redisClientRef.current && isInitialized) {
      console.log("Game is in playing state, setting up timers")
      setupCountdownTimer()
      setupNumberCaller()
    }

    return () => {
      cleanupIntervals()
    }
  }, [currentRoom, setupCountdownTimer, setupNumberCaller, cleanupIntervals, isInitialized])

  // Setup waiting time timer when in waiting state
  useEffect(() => {
    if (currentRoom && currentRoom.status === "waiting") {
      startWaitingTimeTimer()
    }

    return () => {
      if (waitingTimeIntervalRef.current) {
        clearInterval(waitingTimeIntervalRef.current)
        waitingTimeIntervalRef.current = null
      }
    }
  }, [currentRoom, startWaitingTimeTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupIntervals()
    }
  }, [cleanupIntervals])

  // Add this function to verify if the player is actually in a room
  const verifyPlayerInRoom = useCallback(async () => {
    if (!publicKey || !currentRoom || !redisClientRef.current || !isInitialized) return

    try {
      const playerAddress = publicKey.toBase58()
      const room = await redisClientRef.current.getRoomById(currentRoom.id)

      // If room doesn't exist or player is not in the room, reset game state
      if (!room || !room.players.includes(playerAddress)) {
        console.log("Player is not actually in the room, resetting state")
        resetGameState()
      }
      // If room is finished, also reset game state
      else if (room.status === "finished") {
        console.log("Room is in finished state, resetting state")
        resetGameState()
      }
    } catch (error) {
      console.error("Error verifying player in room:", error)
    }
  }, [publicKey, currentRoom, resetGameState, isInitialized])

  // Call this function when checking for current room on initial load
  useEffect(() => {
    if (!publicKey || !redisClientRef.current || !isInitialized) return

    const checkCurrentRoom = async () => {
      try {
        // Add a small delay to ensure the component is fully mounted
        await new Promise((resolve) => setTimeout(resolve, 100))

        // First verify if the player is actually in the current room
        if (currentRoom) {
          await verifyPlayerInRoom()
          return
        }

        const playerAddress = publicKey.toBase58()
        const room = await redisClientRef.current?.getPlayerRoom(playerAddress)

        if (room) {
          // Only auto-join if the game is still active (not finished)
          if (room.status !== "finished") {
            setCurrentRoom(room)
            setGameState(room.status === "playing" ? "playing" : "waiting")
            setCalledNumbers(room.calledNumbers || [])

            // Set join time to now since we don't know the original time
            const now = Date.now()
            setJoinTime(now)
            setWaitingTime(0)

            // If the game is playing, setup countdown timer and number caller
            if (room.status === "playing") {
              // Delay setup to avoid race conditions
              setTimeout(() => {
                setupCountdownTimer()
                setupNumberCaller()
              }, 500)
            } else if (room.status === "waiting") {
              // Start the waiting time timer
              startWaitingTimeTimer()
            }

            // If the player is in a room but not on the game page, notify them
            if (typeof window !== "undefined" && window.location.pathname !== "/play") {
              addNotification({
                title: "Active Game",
                message: `You're currently in room "${room.name}". ${room.status === "playing" ? "The game is in progress!" : "Waiting for players."}`,
                type: "info",
                action: {
                  label: "Go to Game",
                  onClick: () => router.push("/play"),
                },
              })
            }
          } else {
            // If the game is finished, don't auto-join, just clean up
            try {
              await redisClientRef.current?.leaveRoom(room.id, playerAddress)
              resetGameState()
            } catch (error) {
              console.error("Error leaving finished room:", error)
            }
          }
        }
      } catch (error) {
        console.error("Error checking current room:", error)
      }
    }

    checkCurrentRoom()
  }, [
    publicKey,
    addNotification,
    router,
    setupCountdownTimer,
    setupNumberCaller,
    isInitialized,
    startWaitingTimeTimer,
    verifyPlayerInRoom,
    currentRoom,
    resetGameState,
  ])

  // Add this useEffect to periodically verify the player's room status
  useEffect(() => {
    if (!publicKey || !currentRoom || !redisClientRef.current || !isInitialized) return

    // Set up an interval to verify the player's room status every 10 seconds
    const verifyInterval = setInterval(() => {
      verifyPlayerInRoom()
    }, 10000)

    return () => clearInterval(verifyInterval)
  }, [publicKey, currentRoom, verifyPlayerInRoom, isInitialized])

  const value = {
    gameState,
    currentRoom,
    availableRooms,
    calledNumbers,
    createRoom,
    joinRoom,
    leaveRoom,
    watchRoom,
    stopWatching,
    fetchAvailableRooms,
    declareWinner,
    isInRoom,
    isSpectating,
    confirmPayment,
    hasConfirmedPayment,
    isRoomReady,
    joinTime,
    timeToNextNumber,
    waitingTime,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
