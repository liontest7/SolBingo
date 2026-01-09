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

import { generateRandomBingoNumber } from "./bingo-utils"
import { mockWalletAddresses } from "./mock-data"

// Store the interval IDs for each room
const numberCallingIntervals: { [roomId: string]: NodeJS.Timeout } = {}
const mockPlayerIntervals: { [roomId: string]: NodeJS.Timeout } = {}

// Function to add mock players to a room
function addMockPlayersToRoom(roomId: string) {
  console.log(`Adding mock players to room ${roomId}`)

  // Get the room from localStorage
  const roomsJson = localStorage.getItem("bingo_rooms")
  if (!roomsJson) {
    console.log(`No rooms found in localStorage for room ${roomId}`)
    return
  }

  const rooms = safeJsonParse(roomsJson, [])
  if (!Array.isArray(rooms)) {
    console.log(`Invalid rooms data in localStorage for room ${roomId}`)
    return
  }

  const roomIndex = rooms.findIndex((r) => r && r.id === roomId)
  if (roomIndex === -1) {
    console.log(`Room ${roomId} not found in localStorage`)
    return
  }

  const room = rooms[roomIndex]

  // Check if the room is full or not in waiting state
  if (room.players.length >= room.maxPlayers || room.status !== "waiting") {
    console.log(`Room ${roomId} is full or not in waiting state`)
    return
  }

  // Get mock player count from localStorage or use default
  let mockPlayerCount = 3
  try {
    const savedCount = localStorage.getItem("sbingo_mock_player_count")
    if (savedCount) {
      mockPlayerCount = Number.parseInt(savedCount)
    }
  } catch (error) {
    console.error("Error getting mock player count:", error)
  }

  // Limit the number of mock players to add based on available slots
  const availableSlots = room.maxPlayers - room.players.length
  const playersToAdd = Math.min(availableSlots, mockPlayerCount)

  if (playersToAdd <= 0) {
    console.log(`No slots available in room ${roomId}`)
    return
  }

  // Get random mock players that aren't already in the room
  const availableMockPlayers = mockWalletAddresses.filter((address) => !room.players.includes(address))

  if (availableMockPlayers.length === 0) {
    console.log(`No available mock players for room ${roomId}`)
    return
  }

  // Add mock players one by one with delays
  let addedCount = 0
  const addPlayerInterval = setInterval(() => {
    if (addedCount >= playersToAdd || addedCount >= availableMockPlayers.length) {
      clearInterval(addPlayerInterval)
      console.log(`Finished adding ${addedCount} mock players to room ${roomId}`)

      // After adding players, check if the room is full and should start
      const updatedRoomsJson = localStorage.getItem("bingo_rooms")
      if (updatedRoomsJson) {
        const updatedRooms = safeJsonParse(updatedRoomsJson, [])
        const updatedRoomIndex = updatedRooms.findIndex((r) => r && r.id === roomId)

        if (updatedRoomIndex !== -1) {
          const updatedRoom = updatedRooms[updatedRoomIndex]

          // If room is full and all payments confirmed (for paid games), start the game
          const isRoomFull = updatedRoom.players.length >= updatedRoom.maxPlayers
          const allPaymentsConfirmed =
            !updatedRoom.isPaid || updatedRoom.players.every((player) => updatedRoom.paymentConfirmed.includes(player))

          if (isRoomFull && allPaymentsConfirmed && updatedRoom.status === "waiting") {
            console.log(`Starting game for full room ${roomId}`)
            updatedRoom.status = "playing"
            localStorage.setItem("bingo_rooms", JSON.stringify(updatedRooms))

            // Set up number calling for the room
            setupMockNumberCalling(roomId, updatedRoom.callInterval)
          }
        }
      }

      return
    }

    // Add a mock player
    const playerToAdd = availableMockPlayers[addedCount]

    // Update the room data
    room.players.push(playerToAdd)

    // For paid rooms, also confirm payment
    if (room.isPaid && !room.paymentConfirmed.includes(playerToAdd)) {
      room.paymentConfirmed.push(playerToAdd)
      room.totalPot += room.entryFee
    }

    // Save updated room to localStorage
    rooms[roomIndex] = room
    localStorage.setItem("bingo_rooms", JSON.stringify(rooms))

    console.log(`Added mock player ${playerToAdd.slice(0, 6)}... to room ${roomId}`)
    addedCount++
  }, 1000) // Add a player every second
}

// Update the setupMockNumberCalling function to properly respect the countdown timer
function setupMockNumberCalling(roomId: string, interval: number) {
  console.log(`Setting up mock number calling for room ${roomId} with interval ${interval}s`)

  // Clear any existing interval for this room
  if (numberCallingIntervals[roomId]) {
    clearInterval(numberCallingIntervals[roomId])
    delete numberCallingIntervals[roomId]
  }

  // Use a more reasonable interval (minimum 3 seconds)
  const safeInterval = Math.max(3, interval)

  // First, make sure we have a valid room
  const roomsJson = localStorage.getItem("bingo_rooms")
  if (!roomsJson) {
    console.log(`No rooms found in localStorage for room ${roomId}`)
    return
  }

  const rooms = safeJsonParse(roomsJson, [])
  if (!Array.isArray(rooms)) {
    console.log(`Invalid rooms data in localStorage for room ${roomId}`)
    return
  }

  const roomIndex = rooms.findIndex((r) => r && r.id === roomId)
  if (roomIndex === -1) {
    console.log(`Room ${roomId} not found in localStorage`)
    return
  }

  // Call the first number immediately if needed
  const room = rooms[roomIndex]
  if (room.status === "playing" && (!room.calledNumbers || room.calledNumbers.length === 0)) {
    const firstNumber = generateRandomBingoNumber([])
    if (firstNumber) {
      console.log(`Mock service calling first number ${firstNumber} for room ${roomId}`)
      room.calledNumbers = [firstNumber]
      room.currentNumber = firstNumber
      room.nextNumberTime = Date.now() + safeInterval * 1000
      localStorage.setItem("bingo_rooms", JSON.stringify(rooms))
      console.log(`Updated room ${roomId} with first number ${firstNumber}`)
    }
  }

  // Set up the interval to check if it's time to call a new number
  numberCallingIntervals[roomId] = setInterval(() => {
    try {
      // Get the latest room data
      const roomsJson = localStorage.getItem("bingo_rooms")
      if (!roomsJson) {
        console.log(`No rooms found in localStorage for room ${roomId}`)
        clearInterval(numberCallingIntervals[roomId])
        delete numberCallingIntervals[roomId]
        return
      }

      const rooms = safeJsonParse(roomsJson, [])
      if (!Array.isArray(rooms)) {
        console.log(`Invalid rooms data in localStorage for room ${roomId}`)
        clearInterval(numberCallingIntervals[roomId])
        delete numberCallingIntervals[roomId]
        return
      }

      const roomIndex = rooms.findIndex((r) => r && r.id === roomId)
      if (roomIndex === -1) {
        console.log(`Room ${roomId} not found in localStorage`)
        clearInterval(numberCallingIntervals[roomId])
        delete numberCallingIntervals[roomId]
        return
      }

      const room = rooms[roomIndex]

      if (room.status !== "playing") {
        console.log(`Room ${roomId} is not in playing state: ${room.status}`)
        clearInterval(numberCallingIntervals[roomId])
        delete numberCallingIntervals[roomId]
        return
      }

      // Check if it's time to call a new number
      const now = Date.now()
      const nextNumberTime = room.nextNumberTime || 0

      if (now >= nextNumberTime) {
        // It's time to call a new number
        const newNumber = generateRandomBingoNumber(room.calledNumbers || [])
        if (newNumber) {
          console.log(`Mock service calling number ${newNumber} for room ${roomId}`)
          room.calledNumbers = [...(room.calledNumbers || []), newNumber]
          room.currentNumber = newNumber
          room.nextNumberTime = now + room.callInterval * 1000

          // Update localStorage
          localStorage.setItem("bingo_rooms", JSON.stringify(rooms))
          console.log(
            `Updated room ${roomId} with new number ${newNumber}. Total called: ${room.calledNumbers.length}. Next number at: ${new Date(room.nextNumberTime).toLocaleTimeString()}`,
          )
        } else {
          console.log(`No more numbers to call for room ${roomId}`)
          // All numbers have been called
          clearInterval(numberCallingIntervals[roomId])
          delete numberCallingIntervals[roomId]
        }
      }
    } catch (e) {
      console.error(`Error in mock number calling for room ${roomId}:`, e)
      clearInterval(numberCallingIntervals[roomId])
      delete numberCallingIntervals[roomId]
    }
  }, 1000) // Check every second instead of using the interval directly

  console.log(`Mock number calling interval set for room ${roomId}, checking every second`)
}

// Function to monitor rooms and add mock players
function monitorRoomsForMockPlayers() {
  // Check if mock players are enabled
  let mockPlayersEnabled = true
  try {
    const savedSetting = localStorage.getItem("sbingo_mock_players_enabled")
    if (savedSetting !== null) {
      mockPlayersEnabled = JSON.parse(savedSetting)
    }
  } catch (error) {
    console.error("Error checking mock players setting:", error)
  }

  if (!mockPlayersEnabled) {
    console.log("Mock players are disabled")
    return
  }

  console.log("Monitoring rooms for adding mock players")

  // Set up interval to check for rooms needing mock players
  const monitorInterval = setInterval(() => {
    try {
      const roomsJson = localStorage.getItem("bingo_rooms")
      if (!roomsJson) return

      const rooms = safeJsonParse(roomsJson, [])
      if (!Array.isArray(rooms)) return

      // Find rooms in waiting state that aren't full
      const waitingRooms = rooms.filter(
        (room) => room && room.status === "waiting" && room.players.length < room.maxPlayers,
      )

      // Add mock players to each waiting room
      waitingRooms.forEach((room) => {
        // Only add mock players if there's no existing interval for this room
        if (!mockPlayerIntervals[room.id]) {
          // Set a timeout to add mock players after a delay
          mockPlayerIntervals[room.id] = setTimeout(() => {
            addMockPlayersToRoom(room.id)
            delete mockPlayerIntervals[room.id]
          }, 3000) // Wait 3 seconds before adding mock players
        }
      })
    } catch (error) {
      console.error("Error monitoring rooms for mock players:", error)
    }
  }, 5000) // Check every 5 seconds

  return () => {
    clearInterval(monitorInterval)

    // Clear all mock player intervals
    Object.keys(mockPlayerIntervals).forEach((roomId) => {
      clearTimeout(mockPlayerIntervals[roomId])
      delete mockPlayerIntervals[roomId]
    })
  }
}

// Add this function to clean up finished games
function cleanupFinishedGames() {
  try {
    const roomsJson = localStorage.getItem("bingo_rooms")
    if (!roomsJson) return

    const rooms = safeJsonParse(roomsJson, [])
    if (!Array.isArray(rooms)) return

    // Find rooms in finished state
    const finishedRooms = rooms.filter((room) => room && room.status === "finished")

    // If there are finished rooms, remove them
    if (finishedRooms.length > 0) {
      console.log(`Found ${finishedRooms.length} finished rooms to clean up`)

      // Filter out finished rooms
      const updatedRooms = rooms.filter((room) => room && room.status !== "finished")

      // Save updated rooms to localStorage
      localStorage.setItem("bingo_rooms", JSON.stringify(updatedRooms))
      console.log("Cleaned up finished rooms")
    }
  } catch (error) {
    console.error("Error cleaning up finished games:", error)
  }
}

// Call this function in the initMockPlayerService function
export function initMockPlayerService() {
  console.log("Initializing mock player service")

  // Clean up any finished games first
  cleanupFinishedGames()

  // Get all rooms from localStorage
  const roomsJson = localStorage.getItem("bingo_rooms")
  if (!roomsJson) {
    console.log("No rooms found in localStorage")
    // Even if no rooms exist yet, set up the monitor for future rooms
    const cleanupMonitor = monitorRoomsForMockPlayers()
    return () => {
      cleanupMonitor?.()
      cleanupAllIntervals()
    }
  }

  const rooms = safeJsonParse(roomsJson, [])
  if (!Array.isArray(rooms)) {
    console.log("Invalid rooms data in localStorage")
    const cleanupMonitor = monitorRoomsForMockPlayers()
    return () => {
      cleanupMonitor?.()
      cleanupAllIntervals()
    }
  }

  // Iterate through each room and set up mock number calling if the game is in playing state
  rooms.forEach((room) => {
    if (room && room.id) {
      if (room.status === "playing") {
        setupMockNumberCalling(room.id, room.callInterval)
      } else if (room.status === "waiting") {
        // For waiting rooms, check if we should add mock players
        let mockPlayersEnabled = true
        try {
          const savedSetting = localStorage.getItem("sbingo_mock_players_enabled")
          if (savedSetting !== null) {
            mockPlayersEnabled = JSON.parse(savedSetting)
          }
        } catch (error) {
          console.error("Error checking mock players setting:", error)
        }

        if (mockPlayersEnabled && room.players.length < room.maxPlayers) {
          // Add mock players with a delay
          setTimeout(() => {
            addMockPlayersToRoom(room.id)
          }, 3000)
        }
      }
    }
  })

  // Set up monitoring for new rooms
  const cleanupMonitor = monitorRoomsForMockPlayers()

  // Return a cleanup function to clear all intervals when the component unmounts
  return () => {
    cleanupMonitor?.()
    cleanupAllIntervals()
  }
}

function cleanupAllIntervals() {
  console.log("Cleaning up mock player service intervals")

  // Clear all number calling intervals
  Object.keys(numberCallingIntervals).forEach((roomId) => {
    clearInterval(numberCallingIntervals[roomId])
    delete numberCallingIntervals[roomId]
    console.log(`Cleared mock number calling interval for room ${roomId}`)
  })

  // Clear all mock player intervals
  Object.keys(mockPlayerIntervals).forEach((roomId) => {
    clearTimeout(mockPlayerIntervals[roomId])
    delete mockPlayerIntervals[roomId]
    console.log(`Cleared mock player interval for room ${roomId}`)
  })
}
