"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSolanaToken } from "@/context/solana-token-context"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, RefreshCw, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { ADMIN_WALLET_ADDRESS } from "@/context/solana-token-context"

const formSchema = z.object({
  tokenAddress: z
    .string()
    .min(32, {
      message: "Token address must be a valid Solana address",
    })
    .max(44, {
      message: "Token address must be a valid Solana address",
    }),
})

export default function TokenSetup() {
  const { tokenAddress, setTokenAddress, isInitialized, tokenBalance, refreshBalance, isLoadingBalance } =
    useSolanaToken()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenAddress: tokenAddress || "",
    },
    mode: "onSubmit", // Set explicit mode
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      setTokenAddress(values.tokenAddress)
    } catch (error) {
      console.error("Failed to set token address:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SBINGO Token Configuration</CardTitle>
              <CardDescription>Configure the SBINGO token address for the game</CardDescription>
            </div>
            <Badge variant={isInitialized ? "default" : "outline"} className={isInitialized ? "bg-green-500" : ""}>
              {isInitialized ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Configured
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Not Configured
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-200 rounded-md flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div className="text-sm">
              <p className="font-medium text-blue-600">Admin Wallet Connected</p>
              <p className="text-muted-foreground">{ADMIN_WALLET_ADDRESS}</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SBINGO Token Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Solana token address" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the Solana address of the SBINGO token. This address will be used for all paid games.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Saving..." : "Save Token Address"}
                </Button>

                {isInitialized && (
                  <Button type="button" variant="outline" onClick={() => refreshBalance()} disabled={isLoadingBalance}>
                    {isLoadingBalance ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          {isInitialized && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Token Balance:</span>
                <span className="font-bold text-lg">
                  {isLoadingBalance ? <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> : tokenBalance} SBINGO
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start text-sm text-muted-foreground bg-muted/50">
          <p>Note: Currently, payments are simulated since the token hasn't been created yet.</p>
          <p>Once you create your token, simply add the address here to enable real payments.</p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
