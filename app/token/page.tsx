import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TokenDistribution } from "@/components/home/token-distribution"
import { TokenInfo } from "@/components/token/token-info"

export default function TokenPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
        SBINGO Token
      </h1>

      <div className="mb-12">
        <TokenInfo />
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          Token Distribution
        </h2>
        <TokenDistribution />
      </div>

      <Card className="mb-12 border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          <CardTitle className="text-2xl">Token Economics</CardTitle>
          <CardDescription className="text-base">Economic model of the SBINGO token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Initial Distribution</h3>
              <p className="text-base">
                The initial token distribution allocates 95% of tokens to public sale for maintenance and gameplay. The
                remaining 5% is reserved for the team, with 3% dedicated to marketing and promotion, and 2% for
                development and management.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Game Fee Structure</h3>
              <p className="text-base">
                Each paid game collects a 2% fee from the total pot, which is sent to the treasury wallet. These funds
                are used to support ongoing development, marketing initiatives, and community events.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Gas Fees</h3>
              <p className="text-base">
                All gas fees are paid by the players, ensuring that the system is as profitable as possible. These fees
                are very low thanks to the use of the Solana network, which offers exceptionally low transaction costs.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Payment System</h3>
              <p className="text-base">
                All payments are made directly through player wallets, without the need for a separate game account.
                Funds from paid games are transferred to a separate liquidity pool, and then directly to the winner at
                the end of the game, minus the 2% platform fee.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
