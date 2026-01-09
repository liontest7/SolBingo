import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LeaderboardPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
        Leaderboard
      </h1>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger
            value="players"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
          >
            Top Players
          </TabsTrigger>
          <TabsTrigger
            value="games"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
          >
            Recent Games
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-6">
          <Card className="border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <CardTitle className="text-2xl">Top Bingo Players</CardTitle>
              <CardDescription className="text-base">
                The most successful players ranked by wins and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="mt-6">
          <Card className="border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <CardTitle className="text-2xl">Recent Games</CardTitle>
              <CardDescription className="text-base">Latest games and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Game history will be available soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
