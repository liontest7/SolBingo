"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Coins, Shield, Zap, Users } from "lucide-react"
import { useInView } from "react-intersection-observer"

export function TokenInfo() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const features = [
    {
      icon: <Coins className="h-8 w-8 text-primary" />,
      title: "Game Token",
      description: "SBINGO is used for paid games and winning prizes",
      delay: 0,
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Security",
      description: "Built on Solana blockchain for full security and transparency",
      delay: 0.1,
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Low Fees",
      description: "Only 2% fee on paid games, much lower than traditional gambling",
      delay: 0.2,
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Community",
      description: "95% of tokens allocated to public sale for the player community",
      delay: 0.3,
    },
  ]

  return (
    <div ref={ref} className="grid gap-6 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-full border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <CardTitle className="text-2xl">Token Details</CardTitle>
            <CardDescription className="text-base">Information about SBINGO token</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                { label: "Token Name", value: "Solana Bingo Token (SBINGO)" },
                { label: "Network", value: "Solana" },
                { label: "Total Supply", value: "1,000,000,000 SBINGO" },
                { label: "Decimals", value: "9 (Standard for Solana SPL tokens)" },
                { label: "Token Type", value: "SPL Token (Solana Program Library)" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="border-b pb-3 last:border-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h3 className="font-semibold text-lg">{item.label}</h3>
                  <p className="text-base">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="bg-card border-2 border-purple-500/10 hover:border-purple-500/30 rounded-lg p-4 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ delay: feature.delay, duration: 0.3 }}
          >
            <div className="mb-3 bg-primary/10 p-3 rounded-full">{feature.icon}</div>
            <h3 className="font-bold mb-2 text-lg">{feature.title}</h3>
            <p className="text-base">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
