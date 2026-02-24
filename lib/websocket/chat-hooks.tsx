"use client"

import { useEffect, useState, useCallback } from "react"
import { useWebSocketSend, useWebSocketMessage } from "@/lib/websocket/hooks"
import { WebSocketMessage } from "@/types/websocket"
import { toast } from "sonner"

interface RealtimeMessageUpdate {
  id: string
  roomId: string
  userId: string
  displayName: string
  content: string
  createdAt: number
  status: "sending" | "sent" | "delivered"
}

interface TypingIndicator {
  userId: string
  displayName: string
  roomId: string
}

interface RealtimeRoomUpdate {
  userId: string
  roomId: string
  displayName?: string
  action: "join" | "leave"
}

export function useRealtimeChat(roomId: string, userId?: string) {
  const [messages, setMessages] = useState<RealtimeMessageUpdate[]>([])
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingIndicator>>(new Map())
  const [roomUsers, setRoomUsers] = useState<Set<string>>(new Set())
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")

  const {
    sendMessage,
    joinRoom,
    leaveRoom,
    notifyTyping,
    notifyStopTyping,
  } = useWebSocketSend()

  // Join room on mount
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId)
    }

    return () => {
      if (roomId) {
        leaveRoom(roomId)
      }
    }
  }, [roomId, joinRoom, leaveRoom])

  // Listen for new messages
  useWebSocketMessage("message", (msg: WebSocketMessage) => {
    if ((msg.payload as any).roomId === roomId) {
      const messagePayload = msg.payload as any as RealtimeMessageUpdate
      setMessages((prev) => [...prev, messagePayload])
    }
  })

  // Listen for room joins
  useWebSocketMessage("room_join", (msg: WebSocketMessage) => {
    if ((msg.payload as any).roomId === roomId) {
      setRoomUsers((prev) => new Set([...prev, (msg.payload as any).userId]))
      toast.info(`${(msg.payload as any).displayName} joined the room`)
    }
  })

  // Listen for room leaves
  useWebSocketMessage("room_leave", (msg: WebSocketMessage) => {
    if ((msg.payload as any).roomId === roomId) {
      setRoomUsers((prev) => {
        const updated = new Set(prev)
        updated.delete((msg.payload as any).userId)
        return updated
      })
    }
  })

  // Listen for typing indicators
  useWebSocketMessage("user_typing", (msg: WebSocketMessage) => {
    const payload = msg.payload as any
    if (payload.roomId === roomId) {
      setTypingUsers((prev) => {
        const updated = new Map(prev)
        updated.set(payload.userId, {
          userId: payload.userId,
          displayName: payload.displayName,
          roomId: roomId,
        })
        return updated
      })
    }
  })

  // Listen for stop typing
  useWebSocketMessage("user_stop_typing", (msg: WebSocketMessage) => {
    const payload = msg.payload as any
    if (payload.roomId === roomId) {
      setTypingUsers((prev) => {
        const updated = new Map(prev)
        updated.delete(payload.userId)
        return updated
      })
    }
  })

  // Listen for wallet events
  useWebSocketMessage("wallet_connect", (msg: WebSocketMessage) => {
    const payload = msg.payload as any
    toast.info(`${payload.userId} connected wallet`)
  })

  useWebSocketMessage("wallet_disconnect", (msg: WebSocketMessage) => {
    const payload = msg.payload as any
    toast.info(`${payload.userId} disconnected wallet`)
  })

  // Listen for presence updates
  useWebSocketMessage("presence_update", (msg: WebSocketMessage) => {
    const payload = msg.payload as any
    // Update presence status in UI if needed
    const status = payload.status
    if (status === "offline") {
      setRoomUsers((prev) => {
        const updated = new Set(prev)
        updated.delete(payload.userId)
        return updated
      })
    }
  })

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !roomId) return

      // Optimistically add message
      const optimisticMessage: RealtimeMessageUpdate = {
        id: `temp-${Date.now()}`,
        roomId,
        userId: userId || "unknown",
        displayName: "You",
        content,
        createdAt: Date.now(),
        status: "sending",
      }

      setMessages((prev) => [...prev, optimisticMessage])

      // Send via WebSocket
      sendMessage(roomId, content)
    },
    [roomId, userId, sendMessage],
  )

  const handleTyping = useCallback(() => {
    if (roomId) {
      notifyTyping(roomId)
    }
  }, [roomId, notifyTyping])

  const handleStopTyping = useCallback(() => {
    if (roomId) {
      notifyStopTyping(roomId)
    }
  }, [roomId, notifyStopTyping])

  return {
    messages,
    typingUsers: Array.from(typingUsers.values()),
    roomUsers: Array.from(roomUsers),
    connectionStatus,
    handlers: {
      sendMessage: handleSendMessage,
      typing: handleTyping,
      stopTyping: handleStopTyping,
    },
  }
}

export function TypingIndicatorComponent({ typingUsers }: { typingUsers: TypingIndicator[] }) {
  if (typingUsers.length === 0) return null

  const names = typingUsers.map((u) => u.displayName).join(", ")
  const isPlural = typingUsers.length > 1

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
      <div className="flex gap-1">
        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
        <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
      </div>
      <span>
        {names} {isPlural ? "are" : "is"} typing...
      </span>
    </div>
  )
}

export function RoomUsersList({ users }: { users: string[] }) {
  if (users.length === 0) return null

  return (
    <div className="text-xs text-muted-foreground px-4 py-2">
      <span className="font-medium">{users.length} user</span>
      {users.length > 1 && "s"} online
    </div>
  )
}
