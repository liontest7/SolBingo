"use client"

import type { GameRoom } from "@/context/game-context"
import { v4 as uuidv4 } from "uuid"
import { generateMockRooms } from "@/lib/mock-data"
import { generateRandomBingoNumber } from "@/lib/bingo-utils"

// Safely parse JSON with error handling
function safeJsonParse(jsonString: string | null, fallback: any = null) {
  if (!jsonString) return fallback
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    console.error("Error parsing JSON:", e)
    return fallback
  }
}

// This is a mock Redis client that uses localStorage for persistence
// In a production app, you would use Upstash Redis or another serverless Redis solution
export function createClient() {
  // Helper to get all rooms from localStorage
  const getAllRooms = (): GameRoom[] => {
    try {
      const roomsJson = localStorage.getItem("bingo_rooms")
      if (roomsJson) {
        const parsedRooms = safeJsonParse(roomsJson, [])
        // Validate the rooms to ensure they have the correct structure
        return parsedRooms.filter(
          (room) =>
            room &&
            typeof room === "object" &&
            room.id &&
            Array.isArray(room.players) &&
            typeof room.status === "string",
        )
      } else {
        // If no rooms exist, generate mock rooms for testing
        // Generate fewer rooms to reduce initial load
        const mockRooms = generateMockRooms(3)
        try {
          localStorage.setItem("bingo_rooms", JSON.stringify(mockRooms))
        } catch (error) {
          console.error("Error saving mock rooms to localStorage:", error)
        }
        return mockRooms
      }
    } catch (error) {
      console.error("Error getting rooms from localStorage:", error)
      // Return empty array instead of potentially corrupted data
      return []
    }
  }

  // Helper to save all rooms to localStorage
  const saveAllRooms = (rooms: GameRoom[]) => {
    try {
      // Limit the number of rooms to prevent localStorage from growing too large
      const limitedRooms = rooms.slice(0, 20)
      localStorage.setItem("bingo_rooms", JSON.stringify(limitedRooms))
    } catch (error) {
      console.error("Error saving rooms to localStorage:", error)
    }
  }

  // Helper to get a room by ID
  const getRoomById = async (roomId: string): Promise<GameRoom | null> => {
    try {
      const rooms = getAllRooms()
      return rooms.find((room) => room.id === roomId) || null
    } catch (error) {
      console.error("Error getting room by ID:", error)
      return null
    }
  }

  // Helper to update a room
  const updateRoom = async (updatedRoom: GameRoom): Promise<void> => {
    try {
      const rooms = getAllRooms()
      const index = rooms.findIndex((room) => room.id === updatedRoom.id)

      if (index !== -1) {
        rooms[index] = updatedRoom
        saveAllRooms(rooms)
      }
    } catch (error) {
      console.error("Error updating room:", error)
    }
  }

  // Helper to get a player's current room
  const getPlayerRoom = async (playerAddress: string): Promise<GameRoom | null> => {
    try {
      const rooms = getAllRooms()

      // First check for rooms where the player is actively playing
      const activeRoom = rooms.find(
        (room) => room.players.includes(playerAddress) && (room.status === "playing" || room.status === "waiting"),
      )

      if (activeRoom) {
        return activeRoom
      }

      // If no active room, check if they're in any room (including finished games)
      return rooms.find((room) => room.players.includes(playerAddress)) || null
    } catch (error) {
      console.error("Error getting player room:", error)
      return null
    }
  }

  return {
    // Get available rooms (rooms that are in waiting status and not full)
    getAvailableRooms: async (): Promise<GameRoom[]> => {
      try {
        const rooms = getAllRooms()
        // Filter out rooms that are full or not in waiting status
        // Also sort them to show free rooms first, then paid rooms
        return rooms
          .filter((room) => room.status === "waiting" && room.players.length < room.maxPlayers)
          .sort((a, b) => {
            // Sort by free rooms first, then by number of players (more players first)
            if (a.isPaid !== b.isPaid) {
              return a.isPaid ? 1 : -1 // Free rooms first
            }
            // Then sort by how full the room is (more players first)
            return b.players.length - a.players.length
          })
      } catch (error) {
        console.error("Error getting available rooms:", error)
        return []
      }
    },

    // Get all rooms (for admin purposes)
    getAllRooms: async (): Promise<GameRoom[]> => {
      return getAllRooms()
    },

    // Get a room by ID
    getRoomById,

    // Get a player's current room
    getPlayerRoom,

    // Create a new room
    createRoom: async (roomData: Partial<GameRoom>): Promise<string> => {
      try {
        const roomId = uuidv4()
        const newRoom: GameRoom = {
          id: roomId,
          name: roomData.name || "Bingo Room",
          host: roomData.host || "",
          players: roomData.players || [],
          maxPlayers: roomData.maxPlayers || 4,
          callInterval: roomData.callInterval || 5,
          calledNumbers: [],
          currentNumber: null,
          status: "waiting",
          winner: null,
          createdAt: Date.now(),
          isPaid: roomData.isPaid || false,
          entryFee: roomData.entryFee || 0,
          totalPot: roomData.totalPot || 0,
          paymentConfirmed: roomData.paymentConfirmed || [],
          spectators: roomData.spectators || [],
        }

        const rooms = getAllRooms()
        rooms.push(newRoom)
        saveAllRooms(rooms)

        return roomId
      } catch (error) {
        console.error("Error creating room:", error)
        return ""
      }
    },

    // Join a room
    joinRoom: async (roomId: string, playerAddress: string): Promise<GameRoom> => {
      try {
        // Check if player is already in another room
        const playerCurrentRoom = await getPlayerRoom(playerAddress)
        if (playerCurrentRoom && playerCurrentRoom.id !== roomId) {
          throw new Error("You are already in another room")
        }

        const room = await getRoomById(roomId)

        if (!room) {
          throw new Error("Room not found")
        }

        if (room.status !== "waiting" && room.status !== "playing") {
          throw new Error("Cannot join a game that has already finished")
        }

        if (room.players.length >= room.maxPlayers) {
          throw new Error("Room is full")
        }

        if (!room.players.includes(playerAddress)) {
          room.players.push(playerAddress)
          await updateRoom(room)
        }

        return room
      } catch (error) {
        console.error("Error joining room:", error)
        throw error
      }
    },

    // Watch a room as a spectator
    watchRoom: async (roomId: string, playerAddress: string): Promise<GameRoom> => {
      try {
        const room = await getRoomById(roomId)

        if (!room) {
          throw new Error("Room not found")
        }

        // If player is already in the room as a player, don't add as spectator
        if (room.players.includes(playerAddress)) {
          return room
        }

        // Add player to spectators if not already there
        if (!room.spectators.includes(playerAddress)) {
          room.spectators.push(playerAddress)
          await updateRoom(room)
        }

        return room
      } catch (error) {
        console.error("Error watching room:", error)
        throw error
      }
    },

    // Stop watching a room
    stopWatching: async (roomId: string, playerAddress: string): Promise<void> => {
      try {
        const room = await getRoomById(roomId)

        if (!room) {
          return
        }

        // Remove player from spectators
        room.spectators = room.spectators.filter((spectator) => spectator !== playerAddress)
        await updateRoom(room)
      } catch (error) {
        console.error("Error stopping watching:", error)
      }
    },

    // Confirm payment for a room
    confirmPayment: async (roomId: string, playerAddress: string, amount: number): Promise<void> => {
      try {
        const room = await getRoomById(roomId)

        if (!room) {
          throw new Error("Room not found")
        }

        if (!room.isPaid) {
          throw new Error("This room doesn't require payment")
        }

        if (!room.players.includes(playerAddress)) {
          throw new Error("Player is not in this room")
        }

        if (room.paymentConfirmed.includes(playerAddress)) {
          throw new Error("Payment already confirmed")
        }

        // Add player to confirmed payments
        room.paymentConfirmed.push(playerAddress)

        // Add entry fee to total pot
        room.totalPot += amount

        await updateRoom(room)
      } catch (error) {
        console.error("Error confirming payment:", error)
        throw error
      }
    },

    // Leave a room
    leaveRoom: async (roomId: string, playerAddress: string): Promise<void> => {
      try {
        console.log(`Player ${playerAddress} attempting to leave room ${roomId}`)
        const room = await getRoomById(roomId)

        if (!room) {
          console.log("Room not found when trying to leave")
          return
        }

        // Allow leaving even if the game is in progress
        console.log(`Removing player ${playerAddress} from room ${roomId}`)
        // Remove player from the room
        room.players = room.players.filter((player) => player !== playerAddress)

        // Also remove from payment confirmed if applicable
        if (room.paymentConfirmed.includes(playerAddress)) {
          room.paymentConfirmed = room.paymentConfirmed.filter((player) => player !== playerAddress)

          // If this is a paid game and the player had confirmed payment, refund the entry fee
          if (room.isPaid) {
            room.totalPot -= room.entryFee
          }
        }

        // If room is empty, delete it
        if (room.players.length === 0) {
          console.log(`Room ${roomId} is now empty, deleting it`)
          const rooms = getAllRooms()
          const filteredRooms = rooms.filter((r) => r.id !== roomId)
          saveAllRooms(filteredRooms)
          return
        }

        // If host leaves, assign a new host
        if (room.host === playerAddress && room.players.length > 0) {
          console.log(`Host ${playerAddress} left, assigning new host: ${room.players[0]}`)
          room.host = room.players[0]
        }

        // Important: Don't change the game status - let it continue even if players leave
        await updateRoom(room)
        console.log(`Player ${playerAddress} successfully left room ${roomId}`)
      } catch (error) {
        console.error("Error leaving room:", error)
        throw error
      }
    },

    // Start the game
    startGame: async (roomId: string): Promise<void> => {
      try {
        const room = await getRoomById(roomId)

        if (!room) {
          throw new Error("Room not found")
        }

        if (room.status !== "waiting") {
          throw new Error("Game has already started")
        }

        // For paid rooms, ensure all players have confirmed payment
        if (room.isPaid && room.players.some((player) => !room.paymentConfirmed.includes(player))) {
          throw new Error("Not all players have confirmed payment")
        }

        console.log("Starting game for room:", roomId)
        room.status = "playing"

        // Initialize called numbers array if it's empty
        if (!room.calledNumbers) {
          room.calledNumbers = []
        }

        // Call the first number immediately
        if (room.calledNumbers.length === 0) {
          const firstNumber = generateRandomBingoNumber([])
          if (firstNumber) {
            room.calledNumbers = [firstNumber]
            room.currentNumber = firstNumber
            console.log("Called first number for room", roomId, ":", firstNumber)
          }
        }

        await updateRoom(room)
      } catch (error) {
        console.error("Error starting game:", error)
      }
    },

    // Call a number
    callNumber: async (roomId: string, number: string): Promise<void> => {
      try {
        console.log(`Attempting to call number ${number} for room ${roomId}`)
        const room = await getRoomById(roomId)

        if (!room) {
          console.error("Room not found when calling number")
          throw new Error("Room not found")
        }

        if (room.status !== "playing") {
          console.error("Game is not in progress when calling number")
          throw new Error("Game is not in progress")
        }

        // Initialize called numbers array if it's undefined
        if (!room.calledNumbers) {
          room.calledNumbers = []
        }

        // Add the number if it's not already called
        if (!room.calledNumbers.includes(number)) {
          room.calledNumbers.push(number)
          room.currentNumber = number

          // Add a timestamp for when the next number should be called
          room.nextNumberTime = Date.now() + room.callInterval * 1000

          console.log(`Called number ${number} for room ${roomId}. Total called: ${room.calledNumbers.length}`)

          // Force update the room in localStorage
          const rooms = getAllRooms()
          const index = rooms.findIndex((r) => r.id === roomId)
          if (index !== -1) {
            rooms[index] = room
            saveAllRooms(rooms)
          } else {
            await updateRoom(room)
          }
        } else {
          console.log(`Number ${number} already called for room ${roomId}`)
        }
      } catch (error) {
        console.error("Error calling number:", error)
        throw error
      }
    },

    // Declare a winner
    declareWinner: async (roomId: string, playerAddress: string): Promise<void> => {
      try {
        const room = await getRoomById(roomId)

        if (!room) {
          throw new Error("Room not found")
        }

        if (room.status !== "playing") {
          throw new Error("Game is not in progress")
        }

        room.status = "finished"
        room.winner = playerAddress
        await updateRoom(room)
      } catch (error) {
        console.error("Error declaring winner:", error)
      }
    },
  }
}
