"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/context/notification-context"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

export function GameNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleNotificationClick = (id: string, action?: () => void) => {
    markAsRead(id)
    if (action) {
      action()
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {unreadCount}
            </motion.span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearNotifications} className="h-8 text-xs">
              Clear all
            </Button>
          </div>
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <AnimatePresence>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    className={`p-4 ${notification.read ? "" : "bg-muted/50"} cursor-pointer hover:bg-muted/80 transition-colors`}
                    onClick={() => handleNotificationClick(notification.id, notification.action?.onClick)}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-medium">{notification.title}</h5>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    {notification.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNotificationClick(notification.id, notification.action?.onClick)
                        }}
                      >
                        {notification.action.label}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[100px] text-center p-4">
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
