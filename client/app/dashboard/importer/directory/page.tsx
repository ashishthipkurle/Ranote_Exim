"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  Video,
  ShieldCheck,
  Send,
  MessageSquare,
  History,
  CalendarClock,
  X,
  Globe,
  Waves,
  TrendingUp,
  Verified,
  Paperclip,
  Smile,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authFetch, formatCurrency, getInitials } from "@/lib/api-utils";
import { useCallController } from "@/components/session/GlobalCallProvider";
import { useChat } from "@/hooks/useChat";
import ScheduleCallModal from "@/components/calls/ScheduleCallModal";
import QuotationOfferCard, { parseQuotationOffer } from "@/components/messaging/QuotationOfferCard";
import GifLoader from "@/components/ui/GifLoader";

interface Exporter {
  id: string;
  name: string;
  businessName: string | null;
  country: string | null;
  verificationStatus: string;
  avatar: string | null;
  orderCount: number;
  totalValue: number;
  unreadCount: number;
}

interface OrderHistory {
  id: string;
  orderNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  quantity: number;
  product?: {
    name: string;
    unit: string;
    images?: string[];
  };
}

export default function ImporterDirectoryPage() {
  const [exporters, setExporters] = useState<Exporter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar: string | null; role: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filterChip, setFilterChip] = useState<"All" | "Verified" | "Recent">("All");
  const [loading, setLoading] = useState(true);

  // Manifest (Trade History) State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<OrderHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Session / Calls
  const callController = useCallController();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Chat
  const [msgInput, setMsgInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, loading: messagesLoading, sendMessage } = useChat(selectedId);

  // 1. Fetch Exporters
  const fetchExporters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50", role: "EXPORTER" });
      if (search) params.set("search", search);
      const res = await authFetch<{ partners: Exporter[] }>(`/api/dashboard/directory?${params}`);
      setExporters(res.partners || []);
    } catch (err) {
      console.error("Directory fetch error:", err);
      toast.error("Failed to load exporters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExporters();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // 2. Fetch History
  const fetchHistory = async (partnerId: string) => {
    setHistoryLoading(true);
    try {
      const res = await authFetch<{ tradeHistory: OrderHistory[] }>(`/api/dashboard/directory/${partnerId}`);
      setTradeHistory(res.tradeHistory || []);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filtered Exporters based on Chip
  const filteredExporters = useMemo(() => {
    let list = exporters;
    if (filterChip === "Verified") {
      list = list.filter((e) => e.verificationStatus === "VERIFIED");
    } else if (filterChip === "Recent") {
      list = list.filter((e) => e.orderCount > 0 || e.unreadCount > 0);
    }
    return list;
  }, [exporters, filterChip]);

  // 3. Current active exporter
  const activeExporter = useMemo(() => {
    return exporters.find(e => e.id === selectedId);
  }, [selectedId, exporters]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedUser(null);
      return;
    }

    if (activeExporter) {
      setSelectedUser({
        id: selectedId,
        name: activeExporter.businessName || activeExporter.name,
        avatar: activeExporter.avatar,
        role: "Verified Exporter",
      });

      if (activeExporter.unreadCount > 0) {
        setExporters(prev => prev.map(e => e.id === selectedId ? { ...e, unreadCount: 0 } : e));
      }
    }
  }, [selectedId, activeExporter]);

  useEffect(() => {
    if (selectedId) {
      void fetchHistory(selectedId);
    } else {
      setTradeHistory([]);
    }
  }, [selectedId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMsg = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!msgInput.trim()) return;
    try {
      await sendMessage(msgInput);
      setMsgInput("");
    } catch (err) {
      toast.error("Signal error: Message not sent");
    }
  };

  const initiateCall = (type: "AUDIO" | "VIDEO") => {
    if (!selectedId || !selectedUser) return;
    void callController.startCall({
      target: { id: selectedId, name: selectedUser.name },
      callType: type,
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden rounded-[24px] border border-[#F0ECE0] bg-white min-h-[720px] shadow-sm">
      {/* ── LEFT PANEL: Exporters Directory ── */}
      <div className={`flex flex-col border-r border-[#F0ECE0] shrink-0 transition-all duration-300 ${selectedId ? "w-0 md:w-80 lg:w-[380px]" : "w-full md:w-80 lg:w-[380px]"}`}>
        <div className="p-6 pb-3 space-y-3">
          <div>
            <h2 className="text-xl font-[800] uppercase tracking-tight text-[#15130D]">
              Exporters
            </h2>
            <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
              GLOBAL EXPORTER DIRECTORY
            </p>
          </div>

          {/* Search Pill */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A66]" />
            <input
              type="text"
              placeholder="SEARCH EXPORTERS..."
              className="w-full bg-[#F7F5F0] border border-[#ECE7DA] focus:border-[#C4912A] rounded-full pl-10 pr-4 py-2 text-xs font-semibold text-[#15130D] placeholder:text-[#6B6A66] outline-none transition-all uppercase tracking-wider"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Chips: All / Verified / Recent */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {(["All", "Verified", "Recent"] as const).map((chip) => {
              const isActive = filterChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setFilterChip(chip)}
                  className={cn(
                    "px-3.5 py-1 rounded-full text-[13px] font-[600] transition-all",
                    isActive
                      ? "bg-[#15130D] text-white shadow-sm"
                      : "bg-[#F7F5F0] text-[#6B6A66] hover:text-[#15130D] border border-[#ECE7DA]"
                  )}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exporters List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-1 space-y-1.5">
          {loading && exporters.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <GifLoader text="Indexing Verified Exporters..." />
            </div>
          ) : filteredExporters.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="size-16 rounded-[20px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Globe className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#15130D]">
                  No Exporters Found
                </h4>
                <p className="text-[11px] text-[#6B6A66] mt-1 max-w-[220px]">
                  No verified exporters detected under this filter.
                </p>
              </div>
            </div>
          ) : (
            filteredExporters.map((exporter) => {
              const isSelected = selectedId === exporter.id;
              const displayName = (exporter.businessName || exporter.name).toUpperCase();
              return (
                <button
                  key={exporter.id}
                  onClick={() => setSelectedId(exporter.id)}
                  className={cn(
                    "w-full rounded-[18px] p-3.5 text-left transition-all duration-150 flex items-center gap-3.5 group",
                    isSelected
                      ? "bg-[#FFF8E6] border border-[#F1DFAE]"
                      : "border border-transparent bg-transparent hover:bg-[#F7F5F0]/70"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="size-12 rounded-[16px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold flex items-center justify-center text-sm shadow-sm overflow-hidden">
                      {exporter.avatar ? (
                        <img src={exporter.avatar} alt={exporter.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(exporter.businessName || exporter.name)
                      )}
                    </div>
                    {exporter.unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-[#0B7A57] text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                        {exporter.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="font-[800] text-[15px] uppercase text-[#15130D] truncate group-hover:text-[#7A560A] transition-colors">
                        {displayName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[700] uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
                        <ShieldCheck className="size-2.5" />
                        VERIFIED
                      </span>
                      {exporter.country && (
                        <span className="text-[11px] text-[#6B6A66] font-medium truncate">
                          · {exporter.country}
                        </span>
                      )}
                    </div>

                    {exporter.orderCount > 0 && (
                      <p className="text-[10px] text-[#6B6A66] font-semibold mt-1">
                        {exporter.orderCount} orders · {formatCurrency(exporter.totalValue)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Conversation + Call View ── */}
      <div className={`flex-1 flex flex-col min-h-0 relative overflow-hidden ${!selectedId ? "hidden md:flex items-center justify-center bg-[#FFFBF2]" : "flex bg-white"}`}>
        {selectedId && selectedUser ? (
          <>
            {/* Conversation Header */}
            <header className="p-4 md:px-6 border-b border-[#F0ECE0] bg-white flex items-center justify-between flex-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden size-9 rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center border border-[#ECE7DA]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="size-11 rounded-[16px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold flex items-center justify-center text-sm shadow-sm overflow-hidden shrink-0">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedUser.name)
                  )}
                </div>
                <div>
                  <h3 className="font-[800] text-sm md:text-base text-[#15130D] uppercase truncate">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-[#0B7A57]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B7A57]">
                      Trade Link Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Call & Utilities */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => initiateCall("AUDIO")}
                  className="h-[44px] px-4 rounded-[14px] bg-[#E2F5EE] hover:bg-[#D4EFE4] text-[#0B7A57] font-[700] text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                >
                  <Waves className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice Link</span>
                </button>

                <button
                  onClick={() => initiateCall("VIDEO")}
                  className="h-[44px] px-4 rounded-[14px] bg-[#FBF1D6] hover:bg-[#F5E6BF] text-[#7A560A] font-[700] text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Video Signal</span>
                </button>

                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={cn(
                    "size-[44px] rounded-[14px] flex items-center justify-center border transition-all",
                    isHistoryOpen
                      ? "bg-[#C4912A] text-white border-[#C4912A]"
                      : "bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#6B6A66] hover:text-[#7A560A] border-[#ECE7DA]"
                  )}
                  title="Trade History"
                >
                  <History className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setScheduleOpen(true)}
                  className="size-[44px] rounded-[14px] bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#6B6A66] hover:text-[#7A560A] flex items-center justify-center border border-[#ECE7DA] transition-all"
                  title="Schedule Session"
                >
                  <CalendarClock className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Chat Body with faint gold dot pattern */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-gold-dots">
                <div
                  ref={scrollRef}
                  className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 space-y-4 flex flex-col custom-scrollbar"
                >
                  {messagesLoading && messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <GifLoader showText={false} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4 opacity-70">
                      <div className="size-14 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-[#15130D]">
                          Communication Channel Ready
                        </p>
                        <p className="text-[11px] text-[#6B6A66] mt-1">
                          Direct encrypted channel active. Send a message or RFQ inquiry below.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId !== selectedId;
                      const quoteOffer = parseQuotationOffer(msg.body);

                      if (quoteOffer) {
                        return (
                          <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                            <QuotationOfferCard
                              offer={quoteOffer}
                              isBuyer={true}
                              onBargain={(text) => setMsgInput(text)}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] md:max-w-[70%] px-5 py-3.5 rounded-[20px] text-sm leading-relaxed shadow-sm transition-all",
                              isMe
                                ? "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-medium rounded-tr-sm"
                                : "bg-white text-[#15130D] border border-[#F0ECE0] rounded-tl-sm"
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.body}</p>
                            <div
                              className={cn(
                                "mt-1.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1",
                                isMe ? "justify-end text-[#7A560A]" : "justify-start text-[#6B6A66]"
                              )}
                            >
                              <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                              {isMe && <ShieldCheck className="w-3 h-3 text-[#7A560A]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Floating Rounded Composer - 60px tall, radius 30 */}
                <footer className="flex-none p-4 bg-transparent">
                  <form
                    onSubmit={handleSendMsg}
                    className="h-[60px] max-w-4xl mx-auto rounded-[30px] bg-white border border-[#F0ECE0] shadow-md px-3 md:px-4 flex items-center gap-2 md:gap-3"
                  >
                    <button
                      type="button"
                      className="size-9 rounded-full hover:bg-[#F7F5F0] text-[#6B6A66] hover:text-[#15130D] flex items-center justify-center shrink-0 transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="size-9 rounded-full hover:bg-[#F7F5F0] text-[#6B6A66] hover:text-[#15130D] flex items-center justify-center shrink-0 transition-colors"
                      title="Insert emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      className="flex-1 bg-transparent text-sm text-[#15130D] placeholder:text-[#6B6A66] outline-none"
                      placeholder="Type your message..."
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                    />

                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-[700] uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20 shrink-0">
                      <span className="size-1.5 rounded-full bg-[#0B7A57]" />
                      SIGNAL VERIFIED
                    </span>

                    <button
                      type="submit"
                      disabled={!msgInput.trim()}
                      className="size-[48px] rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-[#15130D]" />
                    </button>
                  </form>
                </footer>
              </div>

              {/* Trade History Manifest Sidebar */}
              <AnimatePresence>
                {isHistoryOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 340, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-[#F0ECE0] bg-white flex flex-col shrink-0 overflow-hidden"
                  >
                    <div className="p-5 border-b border-[#F0ECE0] flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#15130D]">
                          Trade Manifest
                        </h4>
                        <p className="text-[10px] text-[#6B6A66] uppercase tracking-wider mt-0.5">
                          Order History with this Exporter
                        </p>
                      </div>
                      <button
                        onClick={() => setIsHistoryOpen(false)}
                        className="size-8 rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#6B6A66] hover:text-[#7A560A] flex items-center justify-center border border-[#ECE7DA]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {historyLoading ? (
                        <div className="p-8 text-center text-xs text-[#6B6A66]">
                          Loading order telemetry...
                        </div>
                      ) : tradeHistory.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#6B6A66]">
                          No orders recorded with this partner.
                        </div>
                      ) : (
                        tradeHistory.map((order) => (
                          <div
                            key={order.id}
                            className="border border-[#F0ECE0] rounded-[18px] p-4 shadow-sm space-y-2"
                            style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-[#15130D]">
                                #{order.orderNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[#15130D]">
                              {order.product?.name || "Product Asset"}
                            </p>
                            <div className="flex justify-between items-center text-xs pt-1 border-t border-[#F0ECE0]">
                              <span className="text-[10px] text-[#6B6A66]">
                                {order.quantity} {order.product?.unit || "units"}
                              </span>
                              <span className="font-bold text-[#7A560A]">
                                {formatCurrency(order.totalPrice)}
                              </span>
                            </div>
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
          /* ── Initial Empty State: Logo Coin + Start a Conversation ── */
          <div className="text-center max-w-md p-8 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="size-28 mx-auto rounded-full bg-gradient-to-br from-[#EBC964] via-[#C4912A] to-[#B8861A] shadow-[0_12px_30px_rgba(196,145,42,0.35)] flex items-center justify-center transform hover:scale-105 transition-transform">
              <span className="text-3xl font-[900] text-[#15130D] tracking-tighter">RE</span>
            </div>

            <div>
              <h2 className="text-2xl font-[800] uppercase tracking-tight text-[#15130D]">
                OPS TERMINAL
              </h2>
              <p className="text-base font-[800] text-[#7A560A] mt-1">
                Start a conversation
              </p>
              <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mt-2 leading-relaxed">
                SELECT AN EXPORTER TO START MESSAGING.
                <br />
                COMMS SEQUENCE AND HISTORY FEED ENABLED.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-[700] uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
                <span className="size-1.5 rounded-full bg-[#0B7A57]" />
                VERIFIED NODE
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-[700] uppercase tracking-wider bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]">
                SECURE LINK ACTIVE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Call Modal */}
      <ScheduleCallModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        receiver={selectedUser ? { id: selectedId!, name: selectedUser.name } : null}
        onScheduled={() => toast.success("Negotiation session requested.")}
      />
    </div>
  );
}
