"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useRef, useEffect, useState } from "react"
import { Coins, Trophy, Users, Zap } from "lucide-react"

export function HeroSection() {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -150])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Floating bingo balls
  const [balls, setBalls] = useState<
    { number: number; x: number; y: number; size: number; color: string; delay: number }[]
  >([])

  useEffect(() => {
    // Generate random bingo balls
    const newBalls = Array.from({ length: 15 }, (_, i) => {
      const letter = ["B", "I", "N", "G", "O"][Math.floor(Math.random() * 5)]
      const number = Math.floor(Math.random() * 15) + 1 + ["B", "I", "N", "G", "O"].indexOf(letter) * 15
      return {
        number,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 40,
        color: [
          "from-purple-500 to-blue-500",
          "from-pink-500 to-purple-500",
          "from-blue-500 to-cyan-500",
          "from-green-500 to-emerald-500",
          "from-amber-500 to-orange-500",
        ][Math.floor(Math.random() * 5)],
        delay: Math.random() * 5,
      }
    })
    setBalls(newBalls)
  }, [])

  return (
    <div ref={containerRef} className="relative py-24 md:py-32 overflow-hidden">
      {/* 3D Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-blue-900/20" />
        <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]" />
      </div>

      {/* Animated floating bingo balls */}
      {balls.map((ball, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full bg-gradient-to-br ${ball.color} shadow-lg flex items-center justify-center text-white font-bold z-0`}
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
            width: ball.size,
            height: ball.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.1, 1],
            x: [0, 10, -10, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            delay: ball.delay,
            ease: "easeInOut",
          }}
        >
          {ball.number}
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div ref={ref} className="relative z-10 max-w-5xl mx-auto text-center px-4" style={{ y, opacity }}>
        <motion.div
          className="mb-8 inline-block"
          initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
          animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.5, rotateY: 90 }}
          transition={{ duration: 0.7, type: "spring" }}
        >
          <div className="relative">
            <div className="text-6xl md:text-8xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 perspective-text">
              SOLANA BINGO
            </div>
            <div className="absolute -inset-4 -z-10 blur-xl opacity-40 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"></div>
          </div>
        </motion.div>

        <motion.p
          className="text-xl md:text-2xl mb-8 text-white drop-shadow-md max-w-3xl mx-auto font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          The first decentralized Bingo game on the Solana blockchain - Play, Win, and Earn!
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link href="/play">
            <Button
              size="lg"
              className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 rounded-xl"
            >
              Play Now
            </Button>
          </Link>
          <Link href="/token">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-purple-500/50 hover:bg-purple-500/10 rounded-xl"
            >
              Learn About SBINGO
            </Button>
          </Link>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {[
            { icon: <Coins className="h-8 w-8 mb-2" />, value: "1B+", label: "Total Tokens", delay: 0 },
            { icon: <Zap className="h-8 w-8 mb-2" />, value: "2%", label: "Game Fee", delay: 0.1 },
            { icon: <Trophy className="h-8 w-8 mb-2" />, value: "Instant", label: "Winnings", delay: 0.2 },
            { icon: <Users className="h-8 w-8 mb-2" />, value: "Global", label: "Community", delay: 0.3 },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.8 + item.delay, duration: 0.5 }}
            >
              <motion.div
                className="flex justify-center text-purple-400"
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 1 + item.delay, type: "spring" }}
              >
                {item.icon}
              </motion.div>
              <motion.h3
                className="text-3xl font-bold text-white mb-2"
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 1.1 + item.delay, type: "spring" }}
              >
                {item.value}
              </motion.h3>
              <p className="text-sm font-medium text-white">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* 3D perspective effect for text */}
      <style jsx global>{`
        .perspective-text {
          transform-style: preserve-3d;
          text-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px 0 rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 30px 10px rgba(139, 92, 246, 0.6); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
