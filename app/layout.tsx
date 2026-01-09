import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import WalletConnectionWrapper from "@/components/wallet/wallet-connection-wrapper"
import { SiteHeader } from "@/components/site-header"
import { NotificationProvider } from "@/context/notification-context"
import { SolanaTokenProvider } from "@/context/solana-token-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Solana Bingo - Play, Win, and Earn with SBINGO",
  description:
    "The first decentralized Bingo game on Solana blockchain. Play for free or stake SBINGO tokens to win big!",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WalletConnectionWrapper>
            <SolanaTokenProvider>
              <NotificationProvider>
                <div className="flex min-h-screen flex-col">
                  <SiteHeader />
                  <div className="flex-1">{children}</div>
                  <footer className="border-t py-6 md:py-8">
                    <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                      <p className="text-center text-sm text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} Solana Bingo. All rights reserved.
                      </p>
                      <p className="text-center text-sm text-muted-foreground md:text-right">Built on Solana</p>
                    </div>
                  </footer>
                </div>
                <Toaster />
              </NotificationProvider>
            </SolanaTokenProvider>
          </WalletConnectionWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
