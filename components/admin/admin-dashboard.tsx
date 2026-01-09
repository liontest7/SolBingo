"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Download,
  Trash2,
  Settings,
  Users,
  BarChart3,
  Database,
} from "lucide-react"
import TokenSetup from "@/components/admin/token-setup"
import { useSolanaToken } from "@/context/solana-token-context"
import { useWallet } from "@solana/wallet-adapter-react"
import { ADMIN_WALLET_ADDRESS } from "@/context/solana-token-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { generateRecentGames, generateGameStats } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function AdminDashboard() {
  const { toast } = useToast()
  const { publicKey } = useWallet()
  const { tokenBalance, refreshBalance, isAdmin } = useSolanaToken()
  const [activeTab, setActiveTab] = useState("token")
  const [isLoading, setIsLoading] = useState(false)
  const [recentGames, setRecentGames] = useState(generateRecentGames(10))
  const [searchQuery, setSearchQuery] = useState("")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [autoApproveGames, setAutoApproveGames] = useState(true)
  const [mockPlayersEnabled, setMockPlayersEnabled] = useState(true)
  const [mockPlayerCount, setMockPlayerCount] = useState(3)

  // Get mock stats
  const stats = generateGameStats()
  const [adminStats, setAdminStats] = useState({
    totalGames: stats.totalGames,
    totalPlayers: stats.activePlayers,
    totalPot: stats.totalPotValue,
    adminFees: Math.floor(stats.totalPotValue * 0.02), // 2% fee
  })

  // Simulate loading admin data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsLoading(false)
    }

    loadData()
  }, [])

  const handleRefreshStats = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate new mock data
      const newStats = generateGameStats()
      setAdminStats({
        totalGames: newStats.totalGames,
        totalPlayers: newStats.activePlayers,
        totalPot: newStats.totalPotValue,
        adminFees: Math.floor(newStats.totalPotValue * 0.02), // 2% fee
      })

      // Generate new recent games
      setRecentGames(generateRecentGames(10))

      toast({
        title: "Data Updated",
        description: "Admin statistics have been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Could not update data at this time",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    try {
      // Get all data from localStorage
      const data = {
        rooms: localStorage.getItem("bingo_rooms") ? JSON.parse(localStorage.getItem("bingo_rooms")!) : [],
        notifications: localStorage.getItem("sbingo_notifications")
          ? JSON.parse(localStorage.getItem("sbingo_notifications")!)
          : [],
        tokenAddress: localStorage.getItem("sbingo_token_address") || null,
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(data, null, 2)

      // Create a blob and download link
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sbingo_backup_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Exported",
        description: "Game data has been exported successfully",
      })
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Could not export data",
        variant: "destructive",
      })
    }
  }

  const handleClearData = () => {
    try {
      // Clear all game-related localStorage items
      localStorage.removeItem("bingo_rooms")
      localStorage.removeItem("sbingo_notifications")
      // Don't remove token address as it's a configuration

      toast({
        title: "Data Cleared",
        description: "All game data has been cleared successfully",
      })
    } catch (error) {
      toast({
        title: "Clear Error",
        description: "Could not clear data",
        variant: "destructive",
      })
    }
  }

  const handleToggleMockPlayers = (enabled: boolean) => {
    setMockPlayersEnabled(enabled)

    // Save to localStorage for persistence
    try {
      localStorage.setItem("sbingo_mock_players_enabled", JSON.stringify(enabled))
      toast({
        title: "Mock Players Setting Updated",
        description: enabled ? "Mock players are now enabled" : "Mock players are now disabled",
      })
    } catch (error) {
      console.error("Error saving mock players setting:", error)
    }
  }

  const handleUpdateMockPlayerCount = (count: number) => {
    setMockPlayerCount(count)

    // Save to localStorage for persistence
    try {
      localStorage.setItem("sbingo_mock_player_count", count.toString())
      toast({
        title: "Mock Player Count Updated",
        description: `Mock player count set to ${count}`,
      })
    } catch (error) {
      console.error("Error saving mock player count:", error)
    }
  }

  const filteredGames = recentGames.filter(
    (game) =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.winner.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>Please connect your wallet to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button disabled>Connect Wallet</Button>
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            Only the admin wallet ({ADMIN_WALLET_ADDRESS.slice(0, 6)}...{ADMIN_WALLET_ADDRESS.slice(-4)}) can access
            this panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Unauthorized Access</AlertTitle>
            <AlertDescription>
              Your wallet ({publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}) does not have admin
              privileges.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="token">
            <Database className="h-4 w-4 mr-2" />
            Token Settings
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="games">
            <Users className="h-4 w-4 mr-2" />
            Recent Games
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="token" className="space-y-4">
          <TokenSetup />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Admin Statistics</CardTitle>
                <CardDescription>Overview of game activity and revenue</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshStats} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Games</div>
                  <div className="text-2xl font-bold">{adminStats.totalGames}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Players</div>
                  <div className="text-2xl font-bold">{adminStats.totalPlayers}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Pot</div>
                  <div className="text-2xl font-bold">{adminStats.totalPot} SBINGO</div>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600">Admin Fees (2%)</div>
                  <div className="text-2xl font-bold text-green-600">{adminStats.adminFees} SBINGO</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
              <CardDescription>List of recently completed games</CardDescription>

              <div className="mt-4 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by game name, ID, or winner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredGames.length > 0 ? (
                <div className="space-y-2">
                  {filteredGames.map((game) => (
                    <div key={game.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{game.name}</div>
                          <div className="text-xs text-muted-foreground">{game.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{game.players} players</div>
                          <div className="text-xs text-muted-foreground">{game.pot} SBINGO</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Winner:</span>
                        <span className="text-sm font-medium">{game.winner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No games matching your search</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings for the Bingo game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, the site will display a maintenance message and prevent new games
                    </p>
                  </div>
                  <Switch id="maintenance-mode" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-approve">Auto-Approve Games</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve new games without admin review
                    </p>
                  </div>
                  <Switch id="auto-approve" checked={autoApproveGames} onCheckedChange={setAutoApproveGames} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="mock-players">Enable Mock Players</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically add mock players to games to help with testing
                      </p>
                    </div>
                    <Switch id="mock-players" checked={mockPlayersEnabled} onCheckedChange={handleToggleMockPlayers} />
                  </div>

                  {mockPlayersEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="mock-player-count">Mock Players Count</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="mock-player-count"
                          type="number"
                          min={1}
                          max={10}
                          value={mockPlayerCount}
                          onChange={(e) => handleUpdateMockPlayerCount(Number.parseInt(e.target.value) || 1)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">players per game</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handleExportData} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button variant="destructive" onClick={handleClearData} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Technical details about the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Version:</span>
                  <span className="text-sm">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Storage:</span>
                  <span className="text-sm">Local Storage</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Network:</span>
                  <span className="text-sm">Solana Devnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Admin Wallet:</span>
                  <span className="text-sm">
                    {ADMIN_WALLET_ADDRESS.slice(0, 6)}...{ADMIN_WALLET_ADDRESS.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    Online
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
