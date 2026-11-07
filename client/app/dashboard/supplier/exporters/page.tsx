"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { authFetch, getInitials } from "@/lib/api-utils";
import { 
  Search, 
  ShieldCheck, 
  Video, 
  CalendarClock, 
  ChevronLeft, 
  Send, 
  Phone, 
  Handshake, 
  Paperclip,
  Smile,
  X,
  History,
} from "lucide-react";
import { useCallController } from "@/components/session/GlobalCallProvider";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ScheduleCallModal from "@/components/calls/ScheduleCallModal";
import GifLoader from "@/components/ui/GifLoader";

interface ExporterPartner {
  id: string;
  name: string | null;
  businessName: string | null;
  email: string | null;
  country: string | null;
  verificationStatus: string;
  avatar: string | null;
  orderCount?: number;
  unreadCount?: number;
}

export default function SupplierExportersPage() {
  const callController = useCallController();
  
  const [exporters, setExporters] = useState<ExporterPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterChip, setFilterChip] = useState<"All" | "Verified" | "Recent">("All");
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const { messages, sendMessage, loading: messagesLoading } = useChat(selectedId);
  const [msgInput, setMsgInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchExporters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch<{ partners: ExporterPartner[] }>(`/api/dashboard/directory?limit=50&role=EXPORTER`);
      setExporters(res.partners || []);
    } catch {
      toast.error("Failed to load exporter directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExporters();
  }, [fetchExporters]);

  useEffect(() => {
    if (selectedId) {
      const u = exporters.find((e) => e.id === selectedId);
      if (u) {
        setSelectedUser(u);
      }
    } else {
      setSelectedUser(null);
    }
  }, [selectedId, exporters]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!msgInput.trim()) return;
    try {
      await sendMessage(msgInput);
      setMsgInput("");
    } catch {
      toast.error("Failed to transmit message.");
    }
  };

  const initiateCall = (type: "AUDIO" | "VIDEO") => {
    if (!selectedId || !selectedUser) return;
    void callController.startCall({
      target: { id: selectedUser.id, name: selectedUser.name || "Exporter" },
      callType: type,
    });
  };

  const filteredExporters = useMemo(() => {
    let list = exporters;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        (e.name || "").toLowerCase().includes(q) ||
        (e.businessName || "").toLowerCase().includes(q) ||
        (e.country || "").toLowerCase().includes(q)
      );
    }
    if (filterChip === "Verified") {
      list = list.filter((e) => e.verificationStatus === "VERIFIED");
    } else if (filterChip === "Recent") {
      list = list.filter((e) => (e.orderCount ?? 0) > 0 || (e.unreadCount ?? 0) > 0);
    }
    return list;
  }, [exporters, search, filterChip]);

  return (
    <div className="flex-1 flex overflow-hidden rounded-[24px] border border-[#F0ECE0] bg-white min-h-[720px] shadow-sm">
      {/* ─── LEFT PANEL: Exporters List ─── */}
      <div
        className={`flex flex-col border-r border-[#F0ECE0] shrink-0 transition-all duration-300 ${
          selectedId ? "w-0 md:w-80 lg:w-[380px]" : "w-full md:w-80 lg:w-[380px]"
        }`}
      >
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

        {/* Exporters Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-1 space-y-1.5">
          {loading && exporters.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <GifLoader text="Indexing Verified Exporters..." />
            </div>
          ) : filteredExporters.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="size-16 rounded-[20px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Handshake className="w-8 h-8" />
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
            filteredExporters.map((exp) => {
              const isSelected = selectedId === exp.id;
              const displayName = (exp.businessName || exp.name || "VERIFIED EXPORTER").toUpperCase();
              return (
                <button
                  key={exp.id}
                  onClick={() => setSelectedId(exp.id)}
                  className={cn(
                    "w-full rounded-[18px] p-3.5 text-left transition-all duration-150 flex items-center gap-3.5 group",
                    isSelected
                      ? "bg-[#FFF8E6] border border-[#F1DFAE]"
                      : "border border-transparent bg-transparent hover:bg-[#F7F5F0]/70"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="size-12 rounded-[16px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold flex items-center justify-center text-sm shadow-sm overflow-hidden">
                      {exp.avatar ? (
                        <img src={exp.avatar} alt={exp.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(exp.businessName || exp.name || "EX")
                      )}
                    </div>
                    {(exp.unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-[#0B7A57] text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                        {exp.unreadCount}
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
                      {exp.country && (
                        <span className="text-[11px] text-[#6B6A66] font-medium truncate">
                          · {exp.country}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Messaging & Call View ─── */}
      <div
        className={`flex-1 flex flex-col relative overflow-hidden bg-[#FFFBF2] bg-gold-dots ${
          !selectedId ? "hidden md:flex items-center justify-center" : "flex"
        }`}
      >
        {selectedId && selectedUser ? (
          <>
            {/* Header: flex none */}
            <header className="h-[74px] px-6 md:px-8 border-b border-[#F0ECE0] bg-white flex items-center justify-between shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  className="md:hidden size-9 rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] text-[#15130D] flex items-center justify-center shrink-0 border border-[#ECE7DA]"
                  onClick={() => setSelectedId(null)}
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2]" />
                </button>
                <div className="size-11 rounded-[14px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0 overflow-hidden">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name || ""} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedUser.businessName || selectedUser.name || "EX")
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-[800] text-[16px] text-[#15130D] truncate">
                    {selectedUser.businessName || selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-[#0B7A57] animate-pulse" />
                    <span className="text-[10px] font-[700] uppercase tracking-wider text-[#0B7A57]">
                      Verified Exporter Node
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => initiateCall("AUDIO")}
                  className="h-11 px-4 rounded-[14px] bg-[#E2F5EE] hover:bg-[#d0efe4] text-[#0B7A57] text-xs font-[800] uppercase tracking-wider flex items-center gap-2 transition-colors border border-[#0B7A57]/20"
                >
                  <Phone className="w-4 h-4 stroke-[2]" />
                  <span className="hidden sm:inline">VOICE LINK</span>
                </button>
                <button
                  onClick={() => initiateCall("VIDEO")}
                  className="h-11 px-4 rounded-[14px] bg-[#FBF1D6] hover:bg-[#f3e5be] text-[#7A560A] text-xs font-[800] uppercase tracking-wider flex items-center gap-2 transition-colors border border-[#7A560A]/20"
                >
                  <Video className="w-4 h-4 stroke-[2]" />
                  <span className="hidden sm:inline">VIDEO SIGNAL</span>
                </button>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="size-11 rounded-[14px] border border-[#F0ECE0] bg-white hover:bg-[#F4F4F7] text-[#15130D] flex items-center justify-center transition-colors shadow-sm"
                  title="Schedule Call"
                >
                  <CalendarClock className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            </header>

            {/* Messages Area: flex-1 + overflow-y:auto */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8 space-y-4 custom-scrollbar"
            >
              {messagesLoading && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#6B6A66]">
                  Connecting encrypted communication line...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3">
                  <div className="size-14 rounded-[18px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shadow-sm">
                    <Handshake className="w-7 h-7 stroke-[1.8]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#15130D]">
                      Secure Exporter Channel
                    </h4>
                    <p className="text-xs text-[#6B6A66] mt-1">
                      Coordinate supplies, confirm quotas, and negotiate dispatch terms.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId !== selectedId;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] md:max-w-[70%] px-5 py-3.5 rounded-[20px] text-sm leading-relaxed shadow-sm",
                          isMe
                            ? "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-medium rounded-tr-none"
                            : "bg-white border border-[#F0ECE0] text-[#15130D] rounded-tl-none"
                        )}
                      >
                        <p>{msg.body}</p>
                        <div
                          className={cn(
                            "mt-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                            isMe ? "text-[#7A560A] justify-end" : "text-[#6B6A66] justify-start"
                          )}
                        >
                          <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
                          {isMe && <ShieldCheck className="w-3 h-3 stroke-[2]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Floating Composer: flex: none, always visible */}
            <footer className="p-4 md:p-6 bg-transparent flex-none">
              <form
                onSubmit={handleSend}
                className="h-[60px] bg-white border border-[#F0ECE0] rounded-[30px] px-3 md:px-5 flex items-center gap-2 md:gap-3 shadow-[0_12px_32px_rgba(80,60,10,0.08)] max-w-4xl mx-auto"
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
                  placeholder="Type your message to exporter..."
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
          </>
        ) : (
          /* Empty State: RE Logo Coin + OPS TERMINAL */
          <div className="text-center max-w-sm space-y-5 p-8">
            <div className="relative size-24 mx-auto rounded-[28px] bg-gradient-to-br from-[#FFFBF0] to-[#FBF1D6] border border-[#F0ECE0] flex items-center justify-center shadow-xl">
              <span className="text-[34px] font-[900] tracking-tighter bg-gradient-to-r from-[#C4912A] to-[#7A560A] bg-clip-text text-transparent">
                RE
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-[800] uppercase tracking-tight text-[#15130D]">
                OPS TERMINAL
              </h2>
              <p className="text-xs text-[#6B6A66] font-[600] uppercase tracking-[0.14em] mt-1.5 leading-relaxed">
                Start a conversation
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-[700] uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
                <span className="size-1.5 rounded-full bg-[#0B7A57]" />
                VERIFIED NODE
              </span>
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-[700] uppercase tracking-[0.14em] bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]">
                SECURE LINK ACTIVE
              </span>
            </div>
          </div>
        )}
      </div>

      <ScheduleCallModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        receiver={selectedUser ? { id: selectedUser.id, name: selectedUser.businessName || selectedUser.name } : null}
        onScheduled={() => toast.success("Negotiation session requested.")}
      />
    </div>
  );
}
