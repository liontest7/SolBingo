"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
})

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  // Add a new notification
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
      // Check if a similar notification already exists (same title and message)
      const existingSimilarNotification = notifications.find(
        (n) => n.title === notification.title && n.message === notification.message && !n.read,
      )

      // If a similar notification exists and is unread, don't add a new one
      if (existingSimilarNotification) {
        console.log("Similar notification already exists, not adding duplicate")
        return
      }

      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date(),
        read: false,
      }

      setNotifications((prev) => [newNotification, ...prev])

      // Show toast for the notification
      const toastOptions: any = {
        title: notification.title,
        description: notification.message,
      }

      // Only add action if it exists
      if (notification.action) {
        toastOptions.action = (
          <ToastAction altText={notification.action.label} onClick={notification.action.onClick}>
            {notification.action.label}
          </ToastAction>
        )
      }

      toast(toastOptions)
    },
    [toast, notifications],
  )

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem("sbingo_notifications")
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications)
        // Convert string dates back to Date objects
        const notifications = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }))
        setNotifications(notifications)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }, [])

  // Save notifications to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("sbingo_notifications", JSON.stringify(notifications))
    } catch (error) {
      console.error("Error saving notifications:", error)
    }
  }, [notifications])

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
