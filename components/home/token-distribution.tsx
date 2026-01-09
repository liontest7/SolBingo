"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

export function TokenDistribution() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const distribution = [
    { name: "Public Sale", percentage: 95, color: "bg-blue-500" },
    { name: "Team & Management", percentage: 2, color: "bg-orange-500" },
    { name: "Marketing & Promotion", percentage: 3, color: "bg-red-500" },
  ]

  return (
    <Card
      ref={ref}
      className="overflow-hidden border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg"
    >
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <CardTitle className="text-2xl">Token Distribution</CardTitle>
        <CardDescription className="text-base">Allocation of 1,000,000,000 SBINGO tokens</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="h-10 w-full rounded-full overflow-hidden flex shadow-inner">
            {distribution.map((item, index) => (
              <motion.div
                key={index}
                className={`${item.color} h-full`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.name}: ${item.percentage}%`}
                initial={{ width: 0 }}
                animate={inView ? { width: `${item.percentage}%` } : { width: 0 }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {distribution.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-2 p-4 rounded-lg border border-muted hover:bg-muted/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className={`w-6 h-6 rounded-full ${item.color}`} />
                <div>
                  <p className="text-base font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground font-medium">{item.percentage}%</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-base">
              The SBINGO token distribution focuses on community ownership with 95% allocated to public sale. The
              remaining 5% is reserved for the team (2%) and marketing efforts (3%) to ensure sustainable growth and
              development of the platform.
            </p>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
