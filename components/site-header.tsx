"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { GameNotifications } from "@/components/game-notifications"
import { cn } from "@/lib/utils"
import { Menu, X, Settings, Trophy, Home, Gamepad2, Coins } from "lucide-react"
import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { TokenBalanceDisplay } from "@/components/token-balance-display"
import { motion } from "framer-motion"
import { useSolanaToken } from "@/context/solana-token-context"

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { publicKey } = useWallet()
  const { isAdmin } = useSolanaToken()

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
      icon: <Home className="h-4 w-4" />,
    },
    {
      href: "/play",
      label: "Play",
      active: pathname === "/play",
      icon: <Gamepad2 className="h-4 w-4" />,
    },
    {
      href: "/token",
      label: "Token",
      active: pathname === "/token",
      icon: <Coins className="h-4 w-4" />,
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      active: pathname === "/leaderboard",
      icon: <Trophy className="h-4 w-4" />,
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <motion.span
              className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Solana Bingo
            </motion.span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {routes.map((route, index) => (
              <motion.div
                key={route.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={route.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 px-3 py-2 rounded-md",
                    route.active
                      ? "text-white bg-gradient-to-r from-purple-600 to-blue-600"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {route.icon}
                  {route.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {publicKey && <TokenBalanceDisplay showRefresh />}

          <GameNotifications />

          {isAdmin && (
            <Link href="/admin" className="hidden md:flex items-center gap-1 px-3 py-2 rounded-md hover:bg-muted">
              <Settings className="h-5 w-5" />
              <span>Admin Panel</span>
            </Link>
          )}

          <div className="hidden md:block">
            <WalletMultiButton className="wallet-adapter-button" />
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden border-t"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary p-2 rounded-md flex items-center gap-2",
                    route.active
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {route.icon}
                  {route.label}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary p-2 rounded-md flex items-center gap-2",
                    pathname === "/admin"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Link>
              )}
            </nav>

            {publicKey && (
              <div className="p-3 border rounded-md bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <TokenBalanceDisplay variant="full" showRefresh />
              </div>
            )}

            <div className="pt-4 border-t">
              <WalletMultiButton className="wallet-adapter-button w-full" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom styling for wallet button */}
      <style jsx global>{`
        .wallet-adapter-button {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          height: 2.5rem;
          padding: 0 1rem;
          border-radius: 0.375rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .wallet-adapter-button:hover {
          background-color: hsl(var(--primary) / 0.9);
          transform: translateY(-1px);
        }
        .wallet-adapter-button:not([disabled]):hover {
          background-color: hsl(var(--primary) / 0.9);
        }
        .wallet-adapter-modal-wrapper {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
        }
        .wallet-adapter-modal-button-close {
          background-color: hsl(var(--secondary));
        }
        .wallet-adapter-modal-title {
          color: hsl(var(--foreground));
        }
      `}</style>
    </header>
  )
}
