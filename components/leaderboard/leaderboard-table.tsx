"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award } from "lucide-react"
import { motion } from "framer-motion"
import { generateLeaderboardData } from "@/lib/mock-data"

interface LeaderboardEntry {
  rank: number
  address: string
  displayName?: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  earnings: number
}

export function LeaderboardTable() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "allTime">("weekly")
  const [isLoading, setIsLoading] = useState(true)

  // Load leaderboard data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      try {
        // Generate mock leaderboard data
        const data = generateLeaderboardData()

        // Apply timeframe filtering (in a real app, this would be done on the server)
        let filteredData = [...data]
        if (timeframe === "daily") {
          // For daily, show fewer entries with lower stats
          filteredData = filteredData.slice(0, 7).map((entry) => ({
            ...entry,
            gamesPlayed: Math.floor(entry.gamesPlayed / 7),
            gamesWon: Math.floor(entry.gamesWon / 7),
            earnings: Math.floor(entry.earnings / 7),
          }))
        } else if (timeframe === "weekly") {
          // Weekly is the default data
        } else if (timeframe === "allTime") {
          // For all time, multiply the stats
          filteredData = filteredData.map((entry) => ({
            ...entry,
            gamesPlayed: entry.gamesPlayed * 4,
            gamesWon: entry.gamesWon * 4,
            earnings: entry.earnings * 4,
          }))
        }

        // Recalculate win rates
        filteredData = filteredData.map((entry) => ({
          ...entry,
          winRate: (entry.gamesWon / entry.gamesPlayed) * 100,
        }))

        setLeaderboardData(filteredData)
      } catch (error) {
        console.error("Error loading leaderboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [timeframe])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />
      default:
        return null
    }
  }

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.displayName) {
      return entry.displayName
    }

    return `${entry.address.slice(0, 4)}...${entry.address.slice(-4)}`
  }

  const getInitials = (entry: LeaderboardEntry) => {
    if (entry.displayName) {
      return entry.displayName.slice(0, 2).toUpperCase()
    }

    return entry.address.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leaderboard</h2>

        <Tabs defaultValue={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
          <TabsList>
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Daily
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Weekly
            </TabsTrigger>
            <TabsTrigger
              value="allTime"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
                <TableHead className="w-[60px] font-bold">Rank</TableHead>
                <TableHead className="font-bold">Player</TableHead>
                <TableHead className="text-right font-bold">Games</TableHead>
                <TableHead className="text-right font-bold">Wins</TableHead>
                <TableHead className="text-right font-bold">Win Rate</TableHead>
                <TableHead className="text-right font-bold">Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((entry, index) => (
                <motion.tr
                  key={entry.address}
                  className={`${entry.rank <= 3 ? "bg-gradient-to-r from-purple-500/5 to-blue-500/5" : ""} hover:bg-muted/50 transition-colors`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {getRankIcon(entry.rank)}
                      <span>{entry.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className={`
                          ${entry.rank === 1 ? "bg-yellow-500/20 text-yellow-700" : ""}
                          ${entry.rank === 2 ? "bg-gray-300/20 text-gray-700" : ""}
                          ${entry.rank === 3 ? "bg-amber-700/20 text-amber-800" : ""}
                          ${entry.rank > 3 ? "bg-purple-500/10 text-purple-700" : ""}
                        `}
                        >
                          {getInitials(entry)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getDisplayName(entry)}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{entry.gamesPlayed}</TableCell>
                  <TableCell className="text-right">{entry.gamesWon}</TableCell>
                  <TableCell className="text-right">{entry.winRate.toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-medium">{entry.earnings} SBINGO</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
