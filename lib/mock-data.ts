// Mock data for testing the system
import { v4 as uuidv4 } from "uuid"

// Mock wallet addresses for testing
export const mockWalletAddresses = [
  "8xzt3UjS7yjXJHJZ2kQWxUmk6T9RqUL5RhpvLBGfPNk7", // BingoChamp
  "6yKHERk8rsbmJxvMpPuwPs1cSKEd6d6KZpfJHXEv3SZM", // SolanaWhale
  "2ZpFJWYgZHqVqnEgLdAkVh6WGVvLpPnH9HwJPjdFdN5C", // Player3
  "9xMRLsxNgNDf3CfKJJhYeUNpRcEWWYTpHYm2KGQFyS4k", // CryptoNinja
  "4vJ6NUBKDEQf4qLtpxYP8aCdYJ5jhQHyEVqC8JodKADN", // Player5
  "7mK4SbQnbr6jvkqxMJJGHP9uZNP9DJYMpxNKVwJRVEYY", // BingoMaster
  "3zTpDHXqjLWk4yN5iFCdmKB19Z4sT4kA5SQzjyVn5i1t", // Player7
  "5xKTwjRLQFGDF4MLvpUZxEVoTfqLMQFRJeAn3yYfAkXZ", // TokenCollector
  "2qMZ5KBWMv5vLBFmMFoNKbKiPnxQ2TkwVpYvFRgj6soq", // Player9
  "8pFiM2vyum2jQ6zXPNuWx4QdNBJpNBVBXRYvrTrYS5dM", // NewPlayer
]

// Mock display names for some players
export const mockDisplayNames: Record<string, string> = {
  "8xzt3UjS7yjXJHJZ2kQWxUmk6T9RqUL5RhpvLBGfPNk7": "BingoChamp",
  "6yKHERk8rsbmJxvMpPuwPs1cSKEd6d6KZpfJHXEv3SZM": "SolanaWhale",
  "9xMRLsxNgNDf3CfKJJhYeUNpRcEWWYTpHYm2KGQFyS4k": "CryptoNinja",
  "7mK4SbQnbr6jvkqxMJJGHP9uZNP9DJYMpxNKVwJRVEYY": "BingoMaster",
  "5xKTwjRLQFGDF4MLvpUZxEVoTfqLMQFRJeAn3yYfAkXZ": "TokenCollector",
  "8pFiM2vyum2jQ6zXPNuWx4QdNBJpNBVBXRYvrTrYS5dM": "NewPlayer",
}

// Generate mock rooms for testing
export function generateMockRooms(count = 5) {
  const rooms = []

  const roomNames = [
    "Bingo Masters",
    "Lucky Numbers",
    "Winner's Circle",
    "High Rollers",
    "Beginner's Luck",
    "Solana Stars",
    "Crypto Callers",
    "Number Ninjas",
    "Token Titans",
    "Blockchain Bingo",
  ]

  for (let i = 0; i < count; i++) {
    // Make most rooms free (70% chance) to avoid forcing users into paid rooms
    const isPaid = Math.random() > 0.7
    const maxPlayers = Math.floor(Math.random() * 5) + 3 // 3-7 players
    const playerCount = Math.floor(Math.random() * (maxPlayers - 1)) + 1 // At least 1 player, but not full

    // Select random players
    const players = []
    const shuffledAddresses = [...mockWalletAddresses].sort(() => 0.5 - Math.random())

    for (let j = 0; j < playerCount; j++) {
      players.push(shuffledAddresses[j])
    }

    const host = players[0]
    const entryFee = isPaid ? (Math.floor(Math.random() * 10) + 1) / 10 : 0 // 0.1 to 1.0 SOL
    const totalPot = isPaid ? entryFee * playerCount : 0

    // Some players have confirmed payment
    const paymentConfirmed = isPaid
      ? players.filter(() => Math.random() > 0.3) // 70% chance of payment confirmed
      : players

    rooms.push({
      id: uuidv4(),
      name: roomNames[i % roomNames.length],
      host,
      players,
      maxPlayers,
      callInterval: Math.floor(Math.random() * 5) + 3, // 3-7 seconds
      calledNumbers: [],
      currentNumber: null,
      status: "waiting",
      winner: null,
      createdAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 10), // Up to 10 minutes ago
      isPaid,
      entryFee,
      totalPot,
      paymentConfirmed,
      spectators: [],
    })
  }

  return rooms
}

// Generate mock leaderboard data
export function generateLeaderboardData() {
  return mockWalletAddresses
    .map((address, index) => {
      const gamesPlayed = Math.floor(Math.random() * 40) + 10 // 10-50 games
      const gamesWon = Math.floor(Math.random() * gamesPlayed * 0.6) // Up to 60% win rate
      const winRate = (gamesWon / gamesPlayed) * 100
      const earnings = gamesWon * (Math.floor(Math.random() * 100) + 50) // 50-150 per win

      return {
        rank: index + 1,
        address,
        displayName: mockDisplayNames[address],
        gamesPlayed,
        gamesWon,
        winRate,
        earnings,
      }
    })
    .sort((a, b) => b.earnings - a.earnings) // Sort by earnings
    .map((entry, index) => ({ ...entry, rank: index + 1 })) // Reassign ranks
}

// Generate mock game statistics
export function generateGameStats() {
  // Weekly games data
  const weeklyGames = [
    { day: "Sun", count: Math.floor(Math.random() * 20) + 5 },
    { day: "Mon", count: Math.floor(Math.random() * 20) + 5 },
    { day: "Tue", count: Math.floor(Math.random() * 20) + 5 },
    { day: "Wed", count: Math.floor(Math.random() * 20) + 5 },
    { day: "Thu", count: Math.floor(Math.random() * 20) + 5 },
    { day: "Fri", count: Math.floor(Math.random() * 20) + 5 },
    { day: "Sat", count: Math.floor(Math.random() * 20) + 5 },
  ]

  // Game type distribution
  const freeGames = Math.floor(Math.random() * 40) + 30 // 30-70%
  const paidGames = 100 - freeGames

  const gameTypeData = [
    { name: "Free Games", value: freeGames },
    { name: "Paid Games", value: paidGames },
  ]

  // Summary statistics
  const totalGames = Math.floor(Math.random() * 1000) + 500
  const activePlayers = Math.floor(Math.random() * 300) + 100
  const totalPotValue = Math.floor(Math.random() * 20000) + 5000

  return {
    weeklyGames,
    gameTypeData,
    totalGames,
    activePlayers,
    totalPotValue,
  }
}

// Generate mock recent games for admin panel
export function generateRecentGames(count = 10) {
  const games = []

  for (let i = 0; i < count; i++) {
    const playerCount = Math.floor(Math.random() * 5) + 2 // 2-6 players
    const isPaid = Math.random() > 0.4 // 60% chance of paid game
    const pot = isPaid ? (playerCount * (Math.floor(Math.random() * 10) + 1)) / 10 : 0

    // Random winner from mock addresses
    const winnerIndex = Math.floor(Math.random() * mockWalletAddresses.length)
    const winner = mockWalletAddresses[winnerIndex]
    const displayName = mockDisplayNames[winner] || `${winner.slice(0, 4)}...${winner.slice(-4)}`

    games.push({
      id: `game-${100 + i}`,
      name: `Game #${100 + i}`,
      players: playerCount,
      pot,
      winner: displayName,
      timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24), // Within last 24 hours
    })
  }

  return games.sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent
}
