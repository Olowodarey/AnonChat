"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  PresenceIndicator,
  type PresenceStatus,
} from "@/components/presence-indicator";
import ConnectWallet from "@/components/wallet-connector";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PresenceIndicator, type PresenceStatus } from "@/components/presence-indicator"
import ConnectWallet from "@/components/wallet-connector"
import { RoomMembersDialog } from "@/components/room-members-dialog"
import { cn } from "@/lib/utils"
import { getPublicKey, onDisconnect } from "@/app/stellar-wallet-kit"
import {
  Search,
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Clock,
  Wallet,
  Share2,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
} from "lucide-react";

type ChatPreview = {
  id: string;
  name: string;
  address: string;
  lastMessage: string;
  lastSeen: string;
  unreadCount: number;
  status: PresenceStatus;
};

type ChatMessage = {
  id: string;
  author: "me" | "them";
  text: string;
  time: string;
  delivered: boolean;
  read: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
};

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [messageText, setMessageText] = useState("");

  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    const el = document.getElementById("connect-wrap");
    if (!el) return;

    const observer = new MutationObserver(() => {
      const hasAddress = el.textContent && el.textContent.includes("...");
      setWalletConnected(Boolean(hasAddress));
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, []);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [roomMembersOpen, setRoomMembersOpen] = useState(false)

  const [walletConnected, setWalletConnected] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)

  // Sync wallet state properly
  useEffect(() => {
    const checkWallet = async () => {
      const address = await getPublicKey()
      setWalletConnected(!!address)
      setUserAddress(address)
    }

    checkWallet()

    // Listen for disconnects
    const unsubscribe = onDisconnect(() => {
      setWalletConnected(false)
      setUserAddress(null)
    })

    // Heuristic: Check on interval or simple event as well since kit doesn't have onConnect yet
    const interval = setInterval(checkWallet, 1000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const initialChats: ChatPreview[] = useMemo(
    () => [
      {
        id: "1",
        name: "Anon Whisper",
        address: "GABC...1234",
        lastMessage: "Got your message, will reply soon.",
        lastSeen: "Today • 14:32",
        unreadCount: 2,
        status: "online",
      },
      {
        id: "2",
        name: "Room #xf23",
        address: "GCDE...5678",
        lastMessage: "Pinned the latest proposal for review.",
        lastSeen: "Today • 09:10",
        unreadCount: 0,
        status: "recently_active",
      },
      {
        id: "3",
        name: "Collector",
        address: "GHJK...9012",
        lastMessage: "Let’s sync tomorrow.",
        lastSeen: "Yesterday • 18:04",
        unreadCount: 0,
        status: "offline",
      },
    ],
    [],
  );

  const [chats, setChats] = useState<ChatPreview[]>(initialChats)

  const markRoomRead = async (roomId: string) => {
    try {
      await fetch("/api/rooms/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      })
    } catch (err) {
      console.error("Failed to mark room read", err)
    }
  }

  const handleSelectChat = async (id: string) => {
    setSelectedChatId(id)
    // update server and local unread count
    await markRoomRead(id)
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
  }

  const messagesByChat: Record<string, ChatMessage[]> = useMemo(
    () => ({
      "1": [
        {
          id: "m1",
          author: "them",
          text: "Hey, welcome to AnonChat 👋",
          time: "14:20",
          delivered: true,
          read: true,
        },
        {
          id: "m2",
          author: "me",
          text: "Love how clean this feels on desktop.",
          time: "14:22",
          delivered: false,
          read: false,
          status: "sending",
        },
        {
          id: "m2b",
          author: "me",
          text: "Just sent another update.",
          time: "14:23",
          delivered: false,
          read: false,
          status: "sent",
        },
        {
          id: "m2c",
          author: "me",
          text: "Let me know once it lands.",
          time: "14:24",
          delivered: true,
          read: false,
          status: "delivered",
        },
        {
          id: "m2d",
          author: "me",
          text: "Seen it?",
          time: "14:24",
          delivered: true,
          read: true,
          status: "read",
        },
        {
          id: "m3",
          author: "them",
          text: "Messages stay end‑to‑end encrypted here.",
          time: "14:25",
          delivered: true,
          read: false,
        },
      ],
      "2": [
        {
          id: "m4",
          author: "them",
          text: "New governance draft is live.",
          time: "09:02",
          delivered: true,
          read: true,
        },
      ],
      "3": [
        {
          id: "m5",
          author: "me",
          text: "Let’s catch up on the drop.",
          time: "17:40",
          delivered: true,
          read: true,
        },
      ],
    }),
    [],
  );

  const getDeliveryStatus = (message: ChatMessage) => {
    if (message.status) return message.status;
    if (message.read) return "read";
    if (message.delivered) return "delivered";
    return "sent";
  };

  const filteredChats = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.toLowerCase();
    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q),
    );
  }, [chats, query]);

  const selectedChat = selectedChatId
    ? (chats.find((c) => c.id === selectedChatId) ?? null)
    : null;
  const messages = selectedChat ? (messagesByChat[selectedChat.id] ?? []) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-8 px-2 sm:px-4 lg:px-8 flex justify-center">
        <div className="w-full max-w-6xl h-[min(82vh,760px)] bg-card border border-border/60 rounded-2xl shadow-lg overflow-hidden flex">
          {/* Sidebar */}
          <aside className="w-[340px] border-r border-border/60 bg-[#0a0a10] flex flex-col">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-3 bg-[#0f0f16]">
          <aside className="w-[340px] border-r border-border/60 bg-card flex flex-col">
            {/* Sidebar header */}
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-3 bg-card">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
                  <Image
                    src="/anonchat-logo2.webp"
                    alt="AnonChat logo"
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-tight">
                    AnonChat
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    End‑to‑end encrypted
                  </div>
                </div>
              </div>
              <button className="inline-flex items-center justify-center rounded-full border border-primary/60 px-3 py-1.5 text-[11px] font-medium bg-primary/20 text-primary hover:bg-primary/30 transition">
                Create / Join room
              </button>
            </div>

            {walletConnected && (
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-[#12121a] gap-3">
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Wallet className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                      Connected
                    </span>
                    <span className="text-[11px] font-mono text-foreground">
                      {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "None"}
                    </span>
                  </div>
                </div>
                <button className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-md bg-[#1b1b24] hover:bg-[#232330] transition border border-border/60">
                  <Share2 className="h-3 w-3" />
                  <span>Share</span>
                </button>
              </div>
            )}

            <div className="px-4 pt-3 pb-2 space-y-2 border-b border-border/60 bg-[#11111a]">
            {/* Search + chats header */}
                <div className="px-4 pt-3 pb-2 space-y-2 border-b border-border/60 bg-card">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold tracking-wide uppercase text-foreground">
                  Messages
                </span>
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ENS or Wallet"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#181822] text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 placeholder:text-muted-foreground/70 transition"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-card text-sm border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/70 transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="h-full flex items-center justify-center px-6 text-xs text-muted-foreground text-center">
                  No rooms match this search.
                </div>
              ) : (
                <ul className="py-1">
                  {filteredChats.map((chat) => (
                    <li key={chat.id}>
                      <button
                        onClick={() => setSelectedChatId(chat.id)}
                        className={cn(
                          "w-full px-3.5 py-2.5 flex gap-3 items-center text-left hover:bg-[#181824] transition",
                          chat.id === selectedChatId &&
                            "bg-[#19192a] border-l-2 border-primary/80",
                        )}
                      >
                        <div className="relative">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-semibold text-white">
                            {chat.name.charAt(0).toUpperCase()}
                  {filteredChats.map((chat) => {
                    const isSelected = chat.id === selectedChatId
                    return (
                      <li key={chat.id}>
                          <button
                          onClick={() => void handleSelectChat(chat.id)}
                          className={cn(
                            "w-full px-3.5 py-2.5 flex gap-3 items-center text-left hover:bg-muted/10 transition cursor-pointer",
                              isSelected &&
                                "bg-primary/5 border-l-2 border-primary/80 shadow-[0_0_0_1px_rgba(168,85,247,0.08)]",
                            )}
                        >
                          <div className="relative">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-semibold text-white shadow-md">
                              {chat.name.charAt(0).toUpperCase()}
                            </div>
                            <PresenceIndicator
                              status={chat.status}
                              className="absolute -bottom-0.5 -right-0.5 scale-90"
                            />
                          </div>
                          <PresenceIndicator
                            status={chat.status}
                            className="absolute -bottom-0.5 -right-0.5 scale-90"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">
                              {chat.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {chat.lastSeen}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {chat.lastMessage}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border/60 bg-[#0f0f16] text-[11px] text-muted-foreground flex items-center justify-between gap-2">
              <span className="truncate">Wallet status for this device:</span>
            {/* Hidden wallet connector just to mirror status into chat UI */}
            <div className="px-4 py-2 border-t border-border/60 bg-card text-[11px] text-muted-foreground flex items-center justify-between gap-2">
              <span className="truncate">
                Wallet status for this device:
              </span>
              <ConnectWallet />
            </div>
          </aside>

          {/* Main chat area */}
          <section className="flex-1 flex flex-col bg-[#050509]">
            {!selectedChat ? (
          <section className="flex-1 flex flex-col bg-background">
            {/* Empty state when no chat selected */}
            {!selectedChat && (
              <div className="flex flex-1 flex-col items-center justify-center text-center px-8 gap-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Open a chat to get started
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Everything stays end‑to‑end encrypted.
                </p>
                <div className="space-y-1 max-w-md">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Open a chat to get started
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Just like WhatsApp on desktop, your conversations appear
                    here once you pick a room from the left. Everything stays
                    end‑to‑end encrypted.
                  </p>
                </div>
                <button className="mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium bg-background hover:bg-muted/60 transition cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                  Create or join a room
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 py-3 border-b border-border/60 bg-[#0f0f16] flex items-center justify-between gap-4">
                {/* Header with name + address */}
                <div className="px-6 py-3 border-b border-border/60 bg-card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-semibold text-white">
                        {selectedChat.name.charAt(0).toUpperCase()}
                      </div>
                      <PresenceIndicator
                        status={selectedChat.status}
                        className="absolute -bottom-0.5 -right-0.5 scale-90"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {selectedChat.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate font-mono">
                        {selectedChat.address}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-muted-foreground">
                    <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[#181822]">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[#181822]">
                      <Video className="h-4 w-4" />
                    </button>
                    <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[#181822]">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {walletConnected && (
                      <div className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary/10 border border-border/60">
                        <Wallet className="h-3.5 w-3.5 text-primary" />
                        <span>Wallet linked</span>
                      </div>
                    )}
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/60 transition">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/60 transition">
                      <Video className="h-4 w-4" />
                    </button>
                      <RoomMembersDialog
                        roomId={selectedChat.id}
                        open={roomMembersOpen}
                        onOpenChange={setRoomMembersOpen}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/60 transition"
                            aria-label="Room members and voting"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                      />
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-background">
                  {messages.map((message) => {
                    const isMine = message.author === "me";
                    const status = getDeliveryStatus(message);
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex w-full",
                          isMine ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm flex flex-col gap-1",
                            isMine
                              ? "bg-[#282834] rounded-br-md"
                              : "bg-[#181822] border border-border/40 rounded-bl-md",
                              ? "bg-primary/10 text-foreground rounded-br-md"
                              : "bg-card text-foreground rounded-bl-md",
                          )}
                        >
                          <span className="whitespace-pre-wrap break-words">
                            {message.text}
                          </span>
                          <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground/90">
                            <span>{message.time}</span>
                            {isMine && (
                              <span className="inline-flex items-center gap-1">
                                {status === "sending" ? (
                                  <Clock className="h-3 w-3 animate-pulse" />
                                ) : status === "sent" ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <CheckCheck
                                    className={cn(
                                      "h-3 w-3",
                                      status === "read" && "text-green-400",
                                    )}
                                  />
                                )}
                                <span
                                  className={cn(
                                    status === "read" && "text-green-400",
                                  )}
                                >
                                  {status === "read"
                                    ? "Seen"
                                    : status.charAt(0).toUpperCase() +
                                      status.slice(1)}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ENHANCED COMPOSER SECTION */}
                <div className="px-4 sm:px-6 py-4 border-t border-border/60 bg-[#0f0f16] flex flex-col gap-3">
                  {/* Branded Accessibility Label */}
                  <label
                    htmlFor="chat-input"
                    className="text-[10px] font-bold uppercase tracking-widest text-[#634fd1] ml-1 opacity-90"
                  >
                    Send message to {selectedChat.name}
                  </label>

                  <div className="flex items-center gap-3">
                    <button className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-[#181822] hover:text-[#887cc9] transition">
                      <Paperclip className="h-5 w-5" />
                    </button>

                    <div className="relative flex-1">
                      <input
                        id="chat-input"
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full rounded-xl border border-border/60 bg-[#181822] pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#887cc9]/40 focus:border-[#887cc9] placeholder:text-muted-foreground/50 transition-all shadow-inner"
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#887cc9] transition">
                        <Smile className="h-5 w-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (messageText.trim()) setMessageText("");
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#634fd1] text-black hover:bg-[#887cc9] shadow-[0_0_15px_rgba(79,209,197,0.2)] transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!messageText.trim()}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                {/* Composer */}
                <div className="px-4 sm:px-6 py-3 border-t border-border/60 bg-card flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message"
                    className="flex-1 rounded-full border border-border/60 bg-card px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/70"
                  />
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
