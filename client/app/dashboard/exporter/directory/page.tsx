"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { authFetch, formatCurrency, getInitials } from "@/lib/api-utils";
import {
 X, 
 Package, 
 History, 
 Search, 
 Globe, 
 ShieldCheck, 
 ArrowRight, 
 MessageCircle,
 Video,
 Waves,
 CalendarClock,
 ChevronLeft,
 Send,
 Loader2,
 Mic,
 MicOff,
 VideoOff,
 Phone,
 PhoneOff,
 Users2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCallController } from "@/components/session/GlobalCallProvider";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// Session components
import { VideoPlayer } from "@/components/session/VideoPlayer";
import ScheduleCallModal from "@/components/calls/ScheduleCallModal";
import SendQuotationModal from "@/components/dashboard/SendQuotationModal";
import QuotationOfferCard, { parseQuotationOffer } from "@/components/messaging/QuotationOfferCard";
import { FileText } from "lucide-react";

interface Partner {
 id: string;
 name: string;
 businessName: string | null;
 country: string | null;
 orderCount: number;
 totalValue: number;
 avatar?: string | null;
 unreadCount: number;
}

interface DirectoryResponse {
 role: string;
 partners: Partner[];
 pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface TradeHistoryOrder {
 id: string;
 orderNumber: string;
 quantity: number;
 totalPrice: number;
 currency: string;
 status: string;
 paymentStatus: string;
 createdAt: string;
 product: {
 name: string;
 category: string;
 unit: string;
 images: string[];
 };
}

export default function ExporterBuyersPage() {
 // 1. Data Hooks
 const callController = useCallController();
 const { user: currentUser } = useAuth();
 
 // 2. Local State
 const [data, setData] = useState<DirectoryResponse | null>(null);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [page, setPage] = useState(1);
 
 // Selection state
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [selectedUser, setSelectedUser] = useState<any>(null);

 useEffect(() => {
   if (typeof window !== "undefined") {
     const params = new URLSearchParams(window.location.search);
     const partnerId = params.get("partnerId");
     if (partnerId) setSelectedId(partnerId);
   }
 }, []);
 const [isHistoryOpen, setIsHistoryOpen] = useState(false);
 const [historyLoading, setHistoryLoading] = useState(false);
 const [tradeHistory, setTradeHistory] = useState<TradeHistoryOrder[]>([]);

 // Comms state
 const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
 const [isSendQuoteModalOpen, setIsSendQuoteModalOpen] = useState(false);
 const { messages, sendMessage, loading: messagesLoading } = useChat(selectedId);
 const [msgInput, setMsgInput] = useState("");
 const scrollRef = useRef<HTMLDivElement>(null);

 // 3. Data Fetching
 const fetchPartners = useCallback(() => {
 setLoading(true);
 const params = new URLSearchParams({ page: String(page), limit: "50" });
 if (search) params.set("search", search);
 authFetch<DirectoryResponse>(`/api/dashboard/directory?${params}`)
 .then(setData)
 .catch(() => { })
 .finally(() => setLoading(false));
 }, [page, search]);

 useEffect(() => {
 const t = setTimeout(fetchPartners, 300);
 return () => clearTimeout(t);
 }, [fetchPartners]);

 // Fetch history when partner selected
 const fetchHistory = async (partnerId: string) => {
 setHistoryLoading(true);
 try {
 const res = await authFetch<{ orders: TradeHistoryOrder[] }>(
 `/api/dashboard/directory/${partnerId}`
 );
 setTradeHistory(res.orders);
 } catch (e) {
 setTradeHistory([]);
 } finally {
 setHistoryLoading(false);
 }
 };

 // 4. Selection Management
 useEffect(() => {
  if (!selectedId) {
  setSelectedUser(null);
  return;
  }

  const partner = data?.partners.find(p => p.id === selectedId);
  if (partner) {
  setSelectedUser({
  id: partner.id,
  name: partner.name,
  avatar: partner.avatar,
  role: "Verified Importer",
  address: partner.country || "Global"
  });
  
  // CRITICAL: Only clear unread count if it's > 0 to avoid infinite loops
  if (partner.unreadCount > 0) {
  setData(prev => {
    if (!prev) return null;
    return {
      ...prev,
      partners: prev.partners.map(p => p.id === selectedId ? { ...p, unreadCount: 0 } : p)
    };
  });
  }
  }
 }, [selectedId, data?.partners]);

 // 5. History Fetching (Separate effect to break loop)
 useEffect(() => {
  if (selectedId) {
  void fetchHistory(selectedId);
  } else {
  setTradeHistory([]);
  }
 }, [selectedId]);

 // Auto-scroll chat
 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [messages]);

 // 4. Handlers
 const handleSendMsg = async (e?: React.FormEvent) => {
 e?.preventDefault();
 if (!msgInput.trim()) return;
 try {
 await sendMessage(msgInput);
 setMsgInput("");
 } catch (err) {
 toast.error("Comms_Failure: Signal not transmitted.");
 }
 };

 const initiateCall = (type: "AUDIO" | "VIDEO") => {
 if (!selectedId || !selectedUser) return;
 void callController.startCall({
 target: { id: selectedId, name: selectedUser.name },
 callType: type
 });
 };



 return (
 <div className="h-full flex overflow-hidden bg-background">
 {/* LEFT PANEL: Importer Hub */}
 <div className={`flex flex-col border-r border-border shrink-0 transition-all duration-500 ${selectedId ? "w-0 md:w-80 lg:w-[400px]" : "w-full md:w-80 lg:w-[400px]"}`}>
 <div className="p-10 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
 <Users2 className="w-8 h-8 text-primary" />
 Buyers hub
 </h1>
 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2 opacity-50">Global Importer Directory</p>
 </div>
 </div>

 {/* Search */}
 <div className="relative group/search">
 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
 <input
 type="text"
 placeholder="Identify Importer node..."
 className="w-full bg-muted/20 border border-border rounded-lg pl-14 pr-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold shadow-inner uppercase tracking-wider"
 value={search}
 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-2">
 {loading ? (
 <div className="p-20 text-center flex flex-col items-center gap-6 opacity-30">
 <Loader2 className="w-8 h-8 animate-spin" />
 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Syncing Partner Registry...</span>
 </div>
 ) : !data?.partners?.length ? (
 <div className="p-20 text-center opacity-30 flex flex-col items-center gap-5">
 <Users2 className="w-12 h-12 grayscale" />
 <span className="text-xs font-black uppercase tracking-widest text-center ">No Importers Found in Registry</span>
 <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px]">The global trade network is currently searching for compatible importer nodes.</p>
 </div>
 ) : (
 <div className="space-y-3 pb-20">
 {data.partners.map((p) => {
 const isSelected = selectedId === p.id;
 return (
 <button
 key={p.id}
 onClick={() => setSelectedId(p.id)}
 className={`w-full group relative bg-card/30 border transition-all duration-500 rounded-lg p-6 text-left ${isSelected ? "border-primary ring-1 ring-primary/20 shadow-2xl shadow-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
 >
 <div className="flex items-center gap-5">
 <div className="relative">
 <div className="size-16 rounded-lg bg-gradient-to-br from-primary to-blue-600/10 flex shrink-0 items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform">
 {getInitials(p.name)}
 </div>
 {p.unreadCount > 0 && (
 <span className="absolute -top-2 -right-2 size-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-bounce-subtle border-2 border-background">
 {p.unreadCount > 9 ? "9+" : p.unreadCount}
 </span>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-1">
 <h3 className="font-black text-sm uppercase tracking-tight truncate group-hover:text-primary transition-colors">{p.name}</h3>
 <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 shrink-0 ml-2 ">{p.country || "Global"}</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/10 ">
 Importer node
 </div>
 <span className="w-1 h-1 rounded-full bg-border" />
 <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">{p.orderCount} Sigs</span>
 </div>
 </div>
 </div>
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Pagination minimal */}
 {data && data.pagination.totalPages > 1 && (
 <div className="p-6 border-t border-border bg-card/20 flex justify-center gap-3">
 {Array.from({ length: Math.min(5, data.pagination.totalPages) }).map((_, i) => (
 <button 
 key={i}
 onClick={() => setPage(i + 1)}
 className={`size-8 rounded-xl text-[9px] font-black transition-all ${page === i + 1 ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
 >
 {i + 1}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* RIGHT PANEL: Workspace hub */}
 <div className={`flex-1 flex flex-col relative overflow-hidden bg-muted/5 ${!selectedId ? "hidden md:flex flex-col items-center justify-center" : "flex"}`}>
 {selectedId && selectedUser ? (
 <>
 {/* Hub Header */}
 <header className="p-8 border-b border-border bg-card/60 backdrop-blur-3xl flex items-center justify-between z-20 sticky top-0">
 <div className="flex items-center gap-6">
 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedId(null)}>
 <ChevronLeft className="w-6 h-6" />
 </Button>
 <div className="flex items-center gap-5">
 <div className="size-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xl shadow-lg">
 {getInitials(selectedUser.name)}
 </div>
 <div>
 <h3 className="font-black text-xl uppercase tracking-tighter text-foreground">{selectedUser.name}</h3>
 <div className="flex items-center gap-2 mt-1">
 <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
 <span className="text-[11px] font-black text-primary uppercase tracking-widest">Trade Partner Active</span>
 </div>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <Button 
 className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-2.5 h-14 px-6 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95"
 onClick={() => setIsSendQuoteModalOpen(true)}
 >
 <FileText className="w-5 h-5" />
 <span className="hidden lg:inline text-[11px] font-black uppercase tracking-[0.2em]">Send Quotation</span>
 </Button>
 <Button 
 className="rounded-lg border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 gap-3 h-14 px-8"
 onClick={() => initiateCall("AUDIO")}
 >
 <Waves className="w-5 h-5" />
 <span className="hidden lg:inline text-[11px] font-black uppercase tracking-[0.2em]">Voice Link</span>
 </Button>
 <Button 
 className="rounded-lg border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary gap-3 h-14 px-8"
 onClick={() => initiateCall("VIDEO")}
 >
 <Video className="w-5 h-5" />
 <span className="hidden lg:inline text-[11px] font-black uppercase tracking-[0.2em]">Video Signal</span>
 </Button>
 <Button 
 variant="ghost" 
 size="icon" 
 className={`rounded-lg size-14 border border-border transition-all ${isHistoryOpen ? "bg-primary text-white border-primary" : ""}`}
 onClick={() => setIsHistoryOpen(!isHistoryOpen)}
 >
 <History className="w-6 h-6" />
 </Button>
 <Button variant="ghost" size="icon" className="rounded-lg size-14 border border-border" onClick={() => setIsScheduleModalOpen(true)}>
 <CalendarClock className="w-6 h-6" />
 </Button>
 </div>
 </header>

 <div className="flex-1 flex overflow-hidden">
 {/* Main Chat Area */}
 <div className="flex-1 flex flex-col min-w-0 bg-[url('/grid.svg')] bg-fixed">
 <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-10 flex flex-col custom-scrollbar">
 {messagesLoading && messages.length === 0 ? (
 <div className="flex-1 flex items-center justify-center opacity-30">
 <Loader2 className="w-8 h-8 animate-spin" />
 </div>
 ) : messages.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-center max-sm mx-auto opacity-30 space-y-8">
 <div className="p-8 rounded-lg bg-primary/10 border border-primary/10 rotate-6">
 <MessageCircle className="w-16 h-16 text-primary" />
 </div>
 <div className="space-y-3">
 <p className="text-sm font-black uppercase tracking-[0.3em]">Communication Tunnel Established</p>
 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 text-center">Secure p2p signal active. Transmit trade intelligence.</p>
 </div>
 </div>
 ) : (
 messages.map((msg) => {
 const isMe = msg.senderId !== selectedId;
 const quoteOffer = parseQuotationOffer(msg.body);

 if (quoteOffer) {
 return (
 <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
 <QuotationOfferCard offer={quoteOffer} isBuyer={false} />
 </div>
 );
 }

 return (
 <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
 <div className={`max-w-[85%] lg:max-w-[70%] px-8 py-6 rounded-lg shadow-2xl text-[13px] leading-relaxed transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 ${isMe ? "bg-primary text-white rounded-tr-none shadow-primary/20" : "bg-card border border-border text-foreground rounded-tl-none shadow-black/5"}`}>
 {msg.body}
 <div className={`mt-4 text-[10px] font-black uppercase opacity-20 flex items-center gap-3 ${isMe ? "justify-end text-white/60" : "justify-start"}`}>
 {format(new Date(msg.createdAt), "HH:mm")}
 {isMe && <ShieldCheck className="w-3 h-3" />}
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Input Footer */}
 <footer className="p-10 border-t border-border bg-card/40 backdrop-blur-3xl">
 <form onSubmit={handleSendMsg} className="flex items-end gap-6 max-w-5xl mx-auto">
 <div className="flex-1 relative bg-background border border-border rounded-lg overflow-hidden shadow-inner group/input focus-within:ring-4 focus-within:ring-primary/10 transition-all">
 <textarea
 className="w-full bg-transparent px-8 py-6 pr-20 text-[13px] focus:outline-none resize-none min-h-[72px] max-h-48 custom-scrollbar font-medium"
 placeholder="Transmit buyer intelligence..."
 rows={1}
 value={msgInput}
 onChange={(e) => setMsgInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleSendMsg();
 }
 }}
 />
 <div className="absolute right-8 bottom-6 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] hidden sm:block ">
 Signal Verified
 </div>
 </div>
 <Button 
 type="submit" 
 className="size-20 rounded-lg shadow-2xl shadow-primary/30 bg-primary hover:bg-primary-hover shrink-0 active:scale-90 transition-all flex items-center justify-center p-0"
 disabled={!msgInput.trim()}
 >
 <Send className="w-8 h-8 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
 </Button>
 </form>
 </footer>
 </div>

 {/* Right Panel: Mental Manifest (Trade History) */}
 <AnimatePresence>
 {isHistoryOpen && (
 <motion.div
 initial={{ width: 0, opacity: 0 }}
 animate={{ width: 400, opacity: 1 }}
 exit={{ width: 0, opacity: 0 }}
 className="border-l border-border bg-card/40 backdrop-blur-3xl flex flex-col shrink-0 overflow-hidden relative"
 >
 <div className="p-10 border-b border-border flex items-center justify-between">
 <div>
 <h3 className="text-xl font-black uppercase tracking-tighter">Trade Feed</h3>
 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2 opacity-50 ">Neural Order Sequence</p>
 </div>
 <Button variant="ghost" size="icon" className="rounded-xl border border-border" onClick={() => setIsHistoryOpen(false)}>
 <X className="w-5 h-5" />
 </Button>
 </div>

 <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
 {historyLoading ? (
 <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-5">
 <Globe className="w-10 h-10 animate-spin-slow" />
 <span className="text-[9px] font-black uppercase tracking-[0.3em]">Streaming Telemetry...</span>
 </div>
 ) : tradeHistory.length === 0 ? (
 <div className="text-center py-20 opacity-20 space-y-5">
 <Package className="w-12 h-12 mx-auto" />
 <p className="text-[9px] font-black uppercase tracking-[0.3em]">Null_History_Record</p>
 </div>
 ) : (
 tradeHistory.map((order) => (
 <div key={order.id} className="group relative bg-muted/20 border border-border rounded-lg p-6 hover:bg-card/60 transition-all duration-500 overflow-hidden">
 <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-3xl bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">
 {order.status}
 </div>
 <div className="flex items-center gap-4 mb-5">
 <div className="size-14 rounded-lg bg-black/5 border border-border overflow-hidden p-1 group-hover:scale-105 transition-transform">
 {order.product?.images?.[0] ? (
 <img src={order.product.images[0]} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
 ) : (
 <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/20" /></div>
 )}
 </div>
 <div className="min-w-0">
 <h4 className="font-black text-xs uppercase tracking-tight truncate group-hover:text-primary transition-colors">{order.product?.name || "Null_Asset"}</h4>
 <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1 ">#{order.orderNumber}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <span className="text-[7px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 ">Quantity</span>
 <div className="text-[11px] font-black ">{order.quantity} {order.product?.unit || 'Units'}</div>
 </div>
 <div className="text-right">
 <span className="text-[7px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 ">Net_Yield</span>
 <div className="text-[11px] font-black text-primary">{formatCurrency(order.totalPrice)}</div>
 </div>
 </div>
 <Link 
 href={`/dashboard/exporter/orders/${order.id}`}
 className="mt-5 w-full py-3 bg-card border border-border rounded-xl text-[8px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-primary hover:text-white hover:border-transparent transition-all group/btn"
 >
 Inspect node
 <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
 </Link>
 </div>
 ))
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </>
 ) : (
 /* Initial Empty State */
 <div className="text-center max-w-md space-y-12 animate-in fade-in zoom-in duration-1000">
 <div className="relative mx-auto">
 <div className="size-48 mx-auto rounded-lg bg-gradient-to-br from-primary to-blue-600/[0.05] p-[1.5px] shadow-2xl shadow-primary/20 rotate-[-6deg] group">
 <div className="h-full w-full bg-background/90 backdrop-blur-3xl rounded-lg flex items-center justify-center group-hover:rotate-[6deg] transition-transform duration-700">
 <Users2 className="w-20 h-20 text-primary" />
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground flex items-center justify-center gap-4">
 Buyer terminal
 </h2>
 <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground leading-loose opacity-60">
 Select intelligence node to view manifest.<br/>
 Comms sequence and history feed enabled.
 </p>
 </div>
 <div className="flex gap-4 justify-center">
 <div className="px-6 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 ">Global Partner</div>
 <div className="px-6 py-3 bg-muted/30 border border-border rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ">Comms Link Secured</div>
 </div>
 </div>
 )}

 {/* Live Session Overlay is now rendered globally by DashboardCallWrapper */}
 </div>

 {/* MODALS */}
 <ScheduleCallModal
 open={isScheduleModalOpen}
 onOpenChange={setIsScheduleModalOpen}
 receiver={selectedUser ? { id: selectedId!, name: selectedUser.name } : null}
 onScheduled={() => toast.success("Negotiation session requested.")}
 />
 <SendQuotationModal
 open={isSendQuoteModalOpen}
 onClose={() => setIsSendQuoteModalOpen(false)}
 buyer={selectedUser}
 onQuotationSent={() => {
   if (selectedId) void fetchHistory(selectedId);
 }}
 />
 </div>
 );
}
