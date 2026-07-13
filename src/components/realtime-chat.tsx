"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: Timestamp | null;
}

export function RealtimeChat({
  chatId,
  userId,
  userName,
  userRole,
  className,
}: {
  chatId: string;
  userId: string;
  userName: string;
  userRole: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          msgs.push({ id: doc.id, ...d } as ChatMessage);
        });
        setMessages(msgs);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, [chatId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const db = getFirestoreDb();
    if (!db) {
      setSending(false);
      return;
    }
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        text,
        createdAt: serverTimestamp(),
      });
    } catch {
      setInput(text); // restore on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin p-3 space-y-2 min-h-[200px] max-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">এখনও কোনো বার্তা নেই</p>
            <p className="text-xs">প্রথম বার্তা পাঠান</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userId;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  )}
                >
                  {!isMe && (
                    <div className="text-[10px] font-semibold mb-0.5 opacity-80">
                      {msg.senderName}
                      <span className="ml-1 text-muted-foreground">
                        {msg.senderRole === "OWNER" ? "মালিক" : msg.senderRole === "SEEKER" ? "সিকার" : msg.senderRole}
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 p-2 border-t bg-background">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="বার্তা লিখুন…"
          className="flex-1"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
