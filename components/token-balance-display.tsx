"use client"

import { useSolanaToken } from "@/context/solana-token-context"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { RefreshCw, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

interface TokenBalanceDisplayProps {
  variant?: "default" | "compact" | "full"
  showRefresh?: boolean
}

export function TokenBalanceDisplay({ variant = "default", showRefresh = false }: TokenBalanceDisplayProps) {
  const { tokenBalance, isInitialized, refreshBalance, isLoadingBalance, tokenAddress } = useSolanaToken()
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [showAnimation, setShowAnimation] = useState(false)
  const [solBalance, setSolBalance] = useState(0)

  // Fetch the actual SOL balance from the blockchain
  useEffect(() => {
    const fetchRealSolBalance = async () => {
      if (!connected || !publicKey || !connection) return

      try {
        const balance = await connection.getBalance(publicKey)
        setSolBalance(balance / LAMPORTS_PER_SOL)
      } catch (error) {
        console.error("Error fetching SOL balance:", error)
      }
    }

    fetchRealSolBalance()

    // Set up an interval to refresh the balance every 30 seconds
    const interval = setInterval(fetchRealSolBalance, 30000)

    return () => clearInterval(interval)
  }, [publicKey, connected, connection])

  // Determine which balance to show
  const displayBalance = tokenAddress ? tokenBalance : solBalance
  const currencySymbol = tokenAddress ? "SBINGO" : "SOL"

  // Animate when balance changes
  useEffect(() => {
    setShowAnimation(true)
    const timer = setTimeout(() => setShowAnimation(false), 1000)
    return () => clearTimeout(timer)
  }, [displayBalance])

  if (!connected || !publicKey) {
    return null
  }

  const handleRefresh = async () => {
    if (tokenAddress) {
      await refreshBalance()
    } else {
      // For SOL balance, fetch directly from the blockchain
      if (connection && publicKey) {
        try {
          const balance = await connection.getBalance(publicKey)
          setSolBalance(balance / LAMPORTS_PER_SOL)
        } catch (error) {
          console.error("Error refreshing SOL balance:", error)
        }
      }
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 text-sm">
        <Coins className="h-3 w-3 text-primary" />
        <motion.span animate={showAnimation ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3 }}>
          {isLoadingBalance ? <RefreshCw className="h-3 w-3 animate-spin" /> : displayBalance.toFixed(4)}
        </motion.span>
        <span className="text-xs text-muted-foreground">{currencySymbol}</span>
      </div>
    )
  }

  if (variant === "full") {
    return (
      <div className="flex flex-col p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-md border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium flex items-center gap-1">
            <Coins className="h-4 w-4 text-primary" />
            {currencySymbol} Balance
          </span>
          {showRefresh && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} disabled={isLoadingBalance}>
              <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
        <motion.div
          className="text-2xl font-bold mt-1"
          animate={showAnimation ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {isLoadingBalance ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            `${displayBalance.toFixed(4)} ${currencySymbol}`
          )}
        </motion.div>
      </div>
    )
  }

  // Default variant
  return (
    <motion.div
      className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-3 py-1.5 rounded-full"
      animate={showAnimation ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Coins className="h-4 w-4 text-primary" />
      <span className="text-muted-foreground font-medium">Balance:</span>
      <span className="font-medium">
        {isLoadingBalance ? <RefreshCw className="h-3 w-3 animate-spin inline" /> : displayBalance.toFixed(4)}{" "}
        {currencySymbol}
      </span>
      {showRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-1"
          onClick={handleRefresh}
          disabled={isLoadingBalance}
        >
          <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? "animate-spin" : ""}`} />
        </Button>
      )}
    </motion.div>
  )
}
