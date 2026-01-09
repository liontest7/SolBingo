"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import confetti from "canvas-confetti"
import { motion } from "framer-motion"

interface AnimatedConfettiButtonProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

export function AnimatedConfettiButton({
  onClick,
  children,
  variant = "default",
  size = "default",
  className,
  disabled = false,
}: AnimatedConfettiButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (disabled) return

    setIsAnimating(true)

    // Create confetti effect
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 999,
    }

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.9 },
    })
    fire(0.2, {
      spread: 60,
      origin: { x: 0.5, y: 0.9 },
    })
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      origin: { x: 0.8, y: 0.9 },
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.9 },
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.9 },
    })

    // Call the provided onClick handler
    if (onClick) {
      onClick()
    }

    // Reset animation state after a delay
    setTimeout(() => {
      setIsAnimating(false)
    }, 1000)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <Button variant={variant} size={size} onClick={handleClick} className={className} disabled={disabled}>
        {children}
      </Button>
    </motion.div>
  )
}
