"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { useToast } from "@/components/ui/use-toast"
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

// Admin wallet address - this is the only address that can access admin features
export const ADMIN_WALLET_ADDRESS = "DajB37qp74UzwND3N1rVWtLdxr55nhvuK2D4x476zmns"

// Liquidity pool address - all game fees go to this address (admin wallet)
// For now, we'll use a separate address for the liquidity pool to simulate the separation
// In a real implementation, this would be a program-derived address or a multisig wallet
const LIQUIDITY_POOL_ADDRESS = "DajB37qp74UzwND3N1rVWtLdxr55nhvuK2D4x476zmns"
const ADMIN_FEE_PERCENT = 2 // 2% fee for admin

interface SolanaTokenContextType {
  tokenAddress: string | null
  setTokenAddress: (address: string) => void
  makePayment: (amount: number, recipientAddress?: string) => Promise<boolean>
  tokenBalance: number
  isInitialized: boolean
  isLoadingBalance: boolean
  refreshBalance: () => Promise<void>
  distributePrize: (winnerAddress: string, totalPot: number) => Promise<boolean>
  isAdmin: boolean
  requestRefund: (roomId: string) => Promise<boolean>
  solBalance: number
}

const SolanaTokenContext = createContext<SolanaTokenContextType>({
  tokenAddress: null,
  setTokenAddress: () => {},
  makePayment: async () => false,
  tokenBalance: 0,
  isInitialized: false,
  isLoadingBalance: false,
  refreshBalance: async () => {},
  distributePrize: async () => false,
  isAdmin: false,
  requestRefund: async () => false,
  solBalance: 0,
})

export const useSolanaToken = () => useContext(SolanaTokenContext)

export function SolanaTokenProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, sendTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()
  const [tokenAddress, setTokenAddressState] = useState<string | null>(null)
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [solBalance, setSolBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false)

  // Track payments made by users to rooms for potential refunds
  const [userPayments, setUserPayments] = useState<{
    [roomId: string]: {
      amount: number
      timestamp: number
    }
  }>({})

  // Check if the connected wallet is the admin wallet
  const isAdmin = publicKey?.toBase58() === ADMIN_WALLET_ADDRESS

  // Check if the token is initialized
  const isInitialized = !!tokenAddress || true // For now, we'll consider SOL as initialized

  // Set the token address
  const setTokenAddress = useCallback(
    (address: string) => {
      if (!address) return

      setTokenAddressState(address)
      localStorage.setItem("sbingo_token_address", address)

      toast({
        title: "Token Address Set",
        description: "SBINGO token address has been configured successfully.",
      })

      // Refresh balance after setting token
      refreshBalance()
    },
    [toast],
  )

  // Fetch SOL balance from wallet
  const fetchSolBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setSolBalance(0)
      return 0
    }

    try {
      const balance = await connection.getBalance(publicKey)
      const solBalance = balance / LAMPORTS_PER_SOL
      setSolBalance(solBalance)
      return solBalance
    } catch (error) {
      console.error("Error fetching SOL balance:", error)
      setSolBalance(0)
      return 0
    }
  }, [connected, publicKey, connection])

  // Fetch token balance from wallet
  const refreshBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setTokenBalance(0)
      setSolBalance(0)
      return
    }

    setIsLoadingBalance(true)
    try {
      // Always fetch SOL balance
      await fetchSolBalance()

      if (tokenAddress) {
        // In a real implementation, this would fetch the actual token balance
        // For now, we'll simulate it with a random balance between 100-5000

        // This is where you would use getAssociatedTokenAddress and getAccount to get the real balance
        // const tokenPublicKey = new PublicKey(tokenAddress)
        // const associatedTokenAddress = await getAssociatedTokenAddress(tokenPublicKey, publicKey)
        // const tokenAccount = await getAccount(connection, associatedTokenAddress)
        // const realBalance = Number(tokenAccount.amount) / (10 ** tokenMintInfo.decimals)

        // For demo purposes:
        const mockBalance = Math.floor(Math.random() * 4900) + 100
        setTokenBalance(mockBalance)
      } else {
        // If no token is set, we'll use SOL balance as the token balance for demo purposes
        setTokenBalance(solBalance)
      }
    } catch (error) {
      console.error("Error fetching token balance:", error)
      // If token account doesn't exist yet, set balance to 0
      setTokenBalance(0)
    } finally {
      setIsLoadingBalance(false)
    }
  }, [connected, publicKey, tokenAddress, connection, fetchSolBalance, solBalance])

  // Make a payment with SOL or the token
  const makePayment = useCallback(
    async (amount: number, roomId?: string): Promise<boolean> => {
      if (!connected || !publicKey) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to make a payment",
          variant: "destructive",
        })
        return false
      }

      try {
        // Check if we have enough balance
        const currentBalance = tokenAddress ? tokenBalance : await fetchSolBalance()

        if (currentBalance < amount) {
          toast({
            title: "Insufficient balance",
            description: `You need ${amount} ${tokenAddress ? "SBINGO" : "SOL"} tokens to make this payment`,
            variant: "destructive",
          })
          return false
        }

        // Create a transaction to send SOL to the liquidity pool
        if (!tokenAddress) {
          // Using SOL for payments
          try {
            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(LIQUIDITY_POOL_ADDRESS),
                lamports: amount * LAMPORTS_PER_SOL,
              }),
            )

            // Set recent blockhash and sign transaction
            const { blockhash } = await connection.getLatestBlockhash()
            transaction.recentBlockhash = blockhash
            transaction.feePayer = publicKey

            // Send the transaction
            const signature = await sendTransaction(transaction, connection)

            // Wait for confirmation
            const confirmation = await connection.confirmTransaction(signature, "confirmed")

            if (confirmation.value.err) {
              throw new Error("Transaction failed to confirm")
            }

            // Update SOL balance
            await fetchSolBalance()

            // If roomId is provided, track this payment for potential refund
            if (roomId) {
              setUserPayments((prev) => ({
                ...prev,
                [roomId]: {
                  amount: amount,
                  timestamp: Date.now(),
                },
              }))
            }

            toast({
              title: "Payment successful",
              description: `Paid ${amount} SOL to the liquidity pool`,
            })

            return true
          } catch (error) {
            console.error("SOL payment error:", error)
            toast({
              title: "Payment failed",
              description: "An error occurred while processing your SOL payment",
              variant: "destructive",
            })
            return false
          }
        } else {
          // Using custom token for payments
          // This would be implemented when the token is created
          // For now, we'll simulate a successful payment

          // Simulate transaction delay
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Update balance
          setTokenBalance((prev) => prev - amount)

          // If roomId is provided, track this payment for potential refund
          if (roomId) {
            setUserPayments((prev) => ({
              ...prev,
              [roomId]: {
                amount: amount,
                timestamp: Date.now(),
              },
            }))
          }

          toast({
            title: "Payment successful",
            description: `Paid ${amount} SBINGO tokens to the liquidity pool`,
          })

          return true
        }
      } catch (error) {
        console.error("Payment error:", error)
        toast({
          title: "Payment failed",
          description: "An error occurred while processing your payment",
          variant: "destructive",
        })
        return false
      }
    },
    [connected, publicKey, tokenAddress, tokenBalance, fetchSolBalance, toast, connection, sendTransaction],
  )

  // Request a refund for a room payment
  const requestRefund = useCallback(
    async (roomId: string): Promise<boolean> => {
      if (!connected || !publicKey) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to request a refund",
          variant: "destructive",
        })
        return false
      }

      // Check if the user has made a payment for this room
      const payment = userPayments[roomId]
      if (!payment) {
        toast({
          title: "No payment found",
          description: "No payment record found for this room",
          variant: "destructive",
        })
        return false
      }

      // Check if the payment was made more than 10 minutes ago
      const tenMinutesInMs = 10 * 60 * 1000
      const now = Date.now()
      const paymentTime = payment.timestamp

      if (now - paymentTime < tenMinutesInMs) {
        const remainingMinutes = Math.ceil((tenMinutesInMs - (now - paymentTime)) / 60000)
        toast({
          title: "Refund not available yet",
          description: `You can request a refund after waiting for ${remainingMinutes} more minutes`,
          variant: "destructive",
        })
        return false
      }

      try {
        // In a real implementation, this would create a transaction to refund the user
        // For now, we'll simulate a successful refund

        if (!tokenAddress) {
          // Using SOL for refunds
          // This would be a transaction from the liquidity pool to the user
          // For demo purposes, we'll just update the balance
          await fetchSolBalance()

          toast({
            title: "Refund processed",
            description: `Refunded ${payment.amount} SOL to your wallet`,
          })
        } else {
          // Using custom token for refunds
          setTokenBalance((prev) => prev + payment.amount)

          toast({
            title: "Refund processed",
            description: `Refunded ${payment.amount} SBINGO tokens to your wallet`,
          })
        }

        // Remove the payment record
        setUserPayments((prev) => {
          const newPayments = { ...prev }
          delete newPayments[roomId]
          return newPayments
        })

        return true
      } catch (error) {
        console.error("Refund error:", error)
        toast({
          title: "Refund failed",
          description: "An error occurred while processing your refund",
          variant: "destructive",
        })
        return false
      }
    },
    [connected, publicKey, userPayments, tokenAddress, fetchSolBalance, toast],
  )

  // Distribute prize to winner
  const distributePrize = useCallback(
    async (winnerAddress: string, totalPot: number): Promise<boolean> => {
      if (!connected || !publicKey) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to distribute prizes",
          variant: "destructive",
        })
        return false
      }

      try {
        // Calculate winner's prize (98% of the pot)
        const winnerPrize = Math.floor(totalPot * (1 - ADMIN_FEE_PERCENT / 100))
        const adminFee = totalPot - winnerPrize

        if (!tokenAddress) {
          // Using SOL for prize distribution
          try {
            // Create a transaction to send SOL from liquidity pool to winner
            // In a real implementation, this would be done by the admin or a program
            // For demo purposes, we'll simulate it

            // Simulate transaction delay
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // If the winner is the current user, update their balance
            if (publicKey.toBase58() === winnerAddress) {
              await fetchSolBalance()

              toast({
                title: "You received the prize!",
                description: `${winnerPrize} SOL has been transferred to your wallet`,
              })
            } else {
              toast({
                title: "Prize distributed",
                description: `${winnerPrize} SOL has been transferred to the winner`,
              })
            }

            return true
          } catch (error) {
            console.error("SOL prize distribution error:", error)
            toast({
              title: "Prize distribution failed",
              description: "An error occurred while distributing the prize",
              variant: "destructive",
            })
            return false
          }
        } else {
          // Using custom token for prize distribution
          // This would be implemented when the token is created
          // For now, we'll simulate a successful distribution

          // Simulate transaction delay
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // If the winner is the current user, update their balance
          if (publicKey.toBase58() === winnerAddress) {
            setTokenBalance((prev) => prev + winnerPrize)

            toast({
              title: "You received the prize!",
              description: `${winnerPrize} SBINGO tokens have been transferred to your wallet`,
            })
          } else {
            toast({
              title: "Prize distributed",
              description: `${winnerPrize} SBINGO tokens have been transferred to the winner`,
            })
          }

          return true
        }
      } catch (error) {
        console.error("Prize distribution error:", error)
        toast({
          title: "Prize distribution failed",
          description: "An error occurred while distributing the prize",
          variant: "destructive",
        })
        return false
      }
    },
    [connected, publicKey, tokenAddress, toast, fetchSolBalance],
  )

  // Load token address from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("sbingo_token_address")
    if (savedAddress) {
      setTokenAddressState(savedAddress)
    }
  }, [])

  // Refresh balance when wallet or token changes
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance()
    }
  }, [connected, publicKey, refreshBalance])

  const value = {
    tokenAddress,
    setTokenAddress,
    makePayment,
    tokenBalance,
    isInitialized,
    isLoadingBalance,
    refreshBalance,
    distributePrize,
    isAdmin,
    requestRefund,
    solBalance,
  }

  return <SolanaTokenContext.Provider value={value}>{children}</SolanaTokenContext.Provider>
}
