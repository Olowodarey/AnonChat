// WebSocket event types
export type WebSocketEventType =
  | "message"
  | "room_join"
  | "room_leave"
  | "user_typing"
  | "user_stop_typing"
  | "wallet_connect"
  | "wallet_disconnect"
  | "presence_update"
  | "error"
  | "connection_established"

export interface WebSocketMessage {
  type: WebSocketEventType
  payload: Record<string, any>
  timestamp: number
}

export interface UserPresence {
  userId: string
  displayName: string
  status: "online" | "offline" | "away"
  lastSeen: number
}

export interface RoomPresence {
  roomId: string
  users: UserPresence[]
}

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  displayName: string
  avatarUrl?: string
  content: string
  createdAt: number
  status?: "sending" | "sent" | "delivered"
}

export interface RoomMember {
  userId: string
  roomId: string
  displayName: string
  avatarUrl?: string
  joinedAt: number
}

export interface WalletEvent {
  userId: string
  action: "connect" | "disconnect"
  walletAddress: string
  timestamp: number
}

// WebSocket connection state
export type ConnectionState = "connecting" | "connected" | "disconnected" | "error"

export interface WebSocketContextType {
  connectionState: ConnectionState
  isConnected: boolean
  message: WebSocketMessage | null
  sendMessage: (event: WebSocketMessage) => void
  onMessage: (callback: (message: WebSocketMessage) => void) => void
  offMessage: (callback: (message: WebSocketMessage) => void) => void
}
