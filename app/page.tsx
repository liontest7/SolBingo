import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokenDistribution } from "@/components/home/token-distribution"
import { Roadmap } from "@/components/home/roadmap"
import { HeroSection } from "@/components/home/hero-section"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <HeroSection />

      <div className="mt-16 mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          About Solana Bingo
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-purple-500/10">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <CardTitle className="text-2xl">The Game</CardTitle>
              <CardDescription className="text-base">Play and earn with Solana Bingo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Solana Bingo combines the classic game of Bingo with blockchain technology, creating an exciting
                play-to-earn experience on the Solana network.
              </p>
              <p className="mb-4">
                Join free rooms to practice or stake SBINGO tokens in paid rooms for a chance to win the entire pot. Our
                automated number calling system ensures fair gameplay, while Solana's fast blockchain provides instant
                payouts to winners.
              </p>
              <p>
                Connect your Solana wallet, create or join a room, and experience the future of online gaming with
                Solana Bingo!
              </p>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <Link href="/play" className="w-full">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Play Now
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-purple-500/10">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <CardTitle className="text-2xl">The Token</CardTitle>
              <CardDescription className="text-base">SBINGO token utility and economics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The SBINGO token powers the Solana Bingo ecosystem, enabling players to participate in paid games and
                earn rewards.
              </p>
              <p className="mb-4">
                <strong>Total Supply:</strong> 1,000,000,000 SBINGO
              </p>
              <p className="mb-4">
                <strong>Token Utility:</strong>
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Stake in paid game rooms</li>
                <li>Earn rewards by winning games</li>
                <li>Participate in governance decisions</li>
                <li>Access to premium features and special events</li>
              </ul>
              <p>
                A 2% fee from each paid game goes to the treasury to support ongoing development and marketing efforts.
              </p>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
              <Link href="/token" className="w-full">
                <Button variant="outline" className="w-full border-purple-500/50 hover:bg-purple-500/10">
                  Learn More
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="distribution" className="mt-16">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger
            value="distribution"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
          >
            Token Distribution
          </TabsTrigger>
          <TabsTrigger
            value="roadmap"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
          >
            Roadmap
          </TabsTrigger>
        </TabsList>
        <TabsContent value="distribution" className="mt-6">
          <TokenDistribution />
        </TabsContent>
        <TabsContent value="roadmap" className="mt-6">
          <Roadmap />
        </TabsContent>
      </Tabs>
    </main>
  )
}
