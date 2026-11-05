"use client";

import { useEffect, useRef, useState } from "react";
import { Send, User, ChevronLeft, MoreVertical, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import QuotationOfferCard, { parseQuotationOffer } from "@/components/messaging/QuotationOfferCard";

interface ChatWindowProps {
 otherUserId: string;
 orderId?: string | null;
 onBack?: () => void;
}

export default function ChatWindow({ otherUserId, orderId, onBack }: ChatWindowProps) {
 const { user: currentUser } = useAuth();
 const { messages, loading, sendMessage } = useChat(otherUserId, orderId);
 const [input, setInput] = useState("");
 const [sending, setSending] = useState(false);
 const scrollRef = useRef<HTMLDivElement>(null);
 const [otherUser, setOtherUser] = useState<any>(null);

 useEffect(() => {
 // Fetch other user profile info
 const fetchOtherUser = async () => {
 try {
 const res = await fetch(`/api/users/${otherUserId}`);
 if (res.ok) {
 const data = await res.json();
 setOtherUser(data.user);
 }
 } catch (err) {
 console.error("Failed to fetch other user", err);
 }
 };
 fetchOtherUser();
 }, [otherUserId]);

 useEffect(() => {
 // Scroll to bottom on new messages
 if (scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [messages]);

 const handleSend = async (e?: React.FormEvent) => {
 e?.preventDefault();
 if (!input.trim() || sending) return;

 setSending(true);
 try {
 await sendMessage(input);
 setInput("");
 } catch (err) {
 console.error("Failed to send", err);
 } finally {
 setSending(false);
 }
 };

 if (loading && messages.length === 0) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground animate-pulse">
 <MoreVertical className="h-8 w-8 mb-4 animate-bounce" />
 <p className="text-sm font-bold">Synchronizing Encrypted Channel...</p>
 </div>
 );
 }

 return (
 <div className="flex flex-col h-full bg-background relative overflow-hidden">
 {/* Absolute background accents */}
 <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20">
 <div className="flex items-center gap-3">
 <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
 <ChevronLeft className="h-5 w-5" />
 </Button>
 
 <div className="relative h-10 w-10 flex-shrink-0">
 {otherUser?.avatar ? (
 <Image
 src={otherUser.avatar}
 alt={otherUser.name || "User"}
 fill
 className="rounded-full object-cover border border-border"
 />
 ) : (
 <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center text-primary border border-border">
 <User className="h-5 w-5" />
 </div>
 )}
 <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
 </div>
 
 <div>
 <h3 className="text-sm font-black leading-none">{otherUser?.name || "Anonymous"}</h3>
 <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">
 {otherUser?.role || "CHANNEL ACTIVE"}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {orderId && (
 <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
 <ShoppingBag className="h-3 w-3" />
 Order Context: #{orderId.slice(0, 8)}
 </div>
 )}
 <Button variant="ghost" size="icon">
 <MoreVertical className="h-5 w-5" />
 </Button>
 </div>
 </div>

 {/* Messages Feed */}
 <div 
 ref={scrollRef}
 className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
 >
 {messages.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-xs mx-auto">
 <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
 <MoreVertical className="h-6 w-6 text-primary/40" />
 </div>
 <p className="text-xs text-muted-foreground">
 Terminal secured. You can now exchange trade details regarding {orderId ? "this order" : "your operations"}.
 </p>
 </div>
 ) : (
 messages.map((msg, i) => {
 const isMe = msg.senderId === currentUser?.id;
 const prevMsg = messages[i-1];
 const isConsecutive = prevMsg?.senderId === msg.senderId;

 return (
 <div 
 key={msg.id} 
 className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
 >
 {!isConsecutive && (
 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 px-1">
 {isMe ? "Sent" : otherUser?.name || "Received"} • {format(new Date(msg.createdAt), "HH:mm")}
 </span>
 )}
 {(() => {
   const offer = parseQuotationOffer(msg.body);
   if (offer) {
     return (
       <QuotationOfferCard
         offer={offer}
         isBuyer={!isMe}
         onBargain={(text) => setInput(text)}
       />
     );
   }
   return (
     <div 
     className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 text-sm transition-all duration-300 ${
     isMe 
     ? "bg-primary text-primary-foreground rounded-lg rounded-tr-none shadow-[0_4px_15px_rgba(19,91,236,0.25)]" 
     : "bg-card border border-border text-foreground rounded-lg rounded-tl-none"
     }`}
     >
     {msg.body}
     </div>
   );
 })()}
 </div>
 );
 })
 )}
 </div>

 {/* Input */}
 <div className="p-4 border-t border-border bg-card/30 backdrop-blur-md">
 <form 
 onSubmit={handleSend}
 className="relative flex items-end gap-2"
 >
 <div className="flex-1 relative">
 <textarea
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleSend();
 }
 }}
 placeholder="Type your message..."
 className="w-full bg-background border border-border rounded-lg px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none min-h-[44px] max-h-[120px]"
 rows={1}
 />
 <div className="absolute right-3 bottom-3 flex items-center gap-2">
 <span className="text-[10px] text-muted-foreground/30 font-black hidden sm:block">SHIFT+ENTER ↵</span>
 </div>
 </div>
 <Button 
 type="submit" 
 size="icon" 
 className="h-[44px] w-[44px] rounded-xl flex-shrink-0 shadow-lg shadow-primary/20 transition-transform active:scale-95"
 disabled={!input.trim() || sending}
 >
 <Send className={`h-5 w-5 ${sending ? "animate-pulse" : ""}`} />
 </Button>
 </form>
 </div>
 </div>
 );
}
