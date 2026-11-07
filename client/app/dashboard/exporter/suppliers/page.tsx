"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Handshake,
  Plus,
  ChevronLeft,
  Waves,
  Video,
  CalendarClock,
  MoreVertical,
  ShieldCheck,
  Send,
  History,
  X,
  Package,
  ArrowRight,
  Building2,
  User,
  Mail,
  MapPin,
  Tag,
  FileText,
  MessageCircle,
  Globe,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { authFetch, formatCurrency, getInitials } from "@/lib/api-utils";
import { useCallController } from "@/components/session/GlobalCallProvider";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ScheduleCallModal from "@/components/calls/ScheduleCallModal";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  category: string | null;
  notes: string | null;
  importerId?: string | null;
  unreadCount: number;
  createdAt: string;
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

export default function ExporterSuppliersPage() {
  const callController = useCallController();
  const { user: currentUser } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryOrder[]>([]);

  const [isAddDealerModalOpen, setIsAddDealerModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    category: "",
    notes: "",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const targetUserId = useMemo(() => {
    return selectedUser?.importerId || selectedId || "";
  }, [selectedUser, selectedId]);

  const { messages, loading: messagesLoading, sendMessage } = useChat(targetUserId);
  const [msgInput, setMsgInput] = useState("");

  const fetchSuppliers = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      const res = await authFetch<{ suppliers: Supplier[] }>("/api/suppliers");
      if (res.suppliers) {
        setSuppliers(res.suppliers);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dealers");
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSuppliers();
  }, []);

  const filteredList = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    });
  }, [suppliers, searchQuery]);

  const activePartner = useMemo(() => {
    return suppliers.find((s) => s.id === selectedId) || null;
  }, [suppliers, selectedId]);

  useEffect(() => {
    if (activePartner) {
      setSelectedUser(activePartner);
      setTradeHistory([]);
    } else {
      setSelectedUser(null);
      setTradeHistory([]);
    }
  }, [selectedId, activePartner]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAddDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authFetch<{ supplier: Supplier }>("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (res.supplier) {
        toast.success("Dealer registered successfully.");
        setIsAddDealerModalOpen(false);
        setFormData({
          name: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          country: "",
          category: "",
          notes: "",
        });
        void fetchSuppliers(false);
        setSelectedId(res.supplier.id);
      }
    } catch (error) {
      toast.error("Failed to register dealer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMsg = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!msgInput.trim()) return;
    try {
      await sendMessage(msgInput);
      setMsgInput("");
    } catch (err) {
      toast.error("Failed to transmit message.");
    }
  };

  const initiateCall = (type: "AUDIO" | "VIDEO") => {
    if (!selectedId || !selectedUser) return;
    void callController.startCall({
      target: { id: selectedUser.id, name: selectedUser.name },
      callType: type,
    });
  };

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] rounded-[24px] overflow-hidden border border-[#F0ECE0] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      {/* ─── LEFT PANEL: Dealers List ─── */}
      <div
        className={`flex flex-col border-r border-[#F0ECE0] bg-white shrink-0 transition-all duration-300 ${
          selectedId ? "hidden md:flex md:w-80 lg:w-[380px]" : "w-full md:w-80 lg:w-[380px]"
        }`}
      >
        <div className="p-6 border-b border-[#F0ECE0] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                Network Directory
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#15130D]">
                Dealers Hub
              </h1>
            </div>
            <button
              onClick={() => setIsAddDealerModalOpen(true)}
              className="h-8 px-3 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-bold text-[11px] uppercase tracking-wider shadow-[0_2px_10px_rgba(196,145,42,0.22)] hover:shadow-[0_4px_14px_rgba(196,145,42,0.30)] hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              title="Add New Dealer"
            >
              <Plus className="w-3.5 h-3.5 text-[#15130D] stroke-[2.5]" />
              <span>Add Dealer</span>
            </button>
          </div>

          {/* Search Pill */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A66] stroke-[1.8]" />
            <input
              type="text"
              placeholder="Search dealers by name, category..."
              className="w-full h-11 bg-[#F4F4F7] border border-[#F0ECE0] rounded-full pl-11 pr-4 text-sm text-[#15130D] placeholder:text-[#6B6A66] focus:outline-none focus:border-[#C4912A] transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Dealers Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#6B6A66]">
              Loading dealer registry...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#6B6A66] flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Handshake className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="font-semibold text-[#15130D]">No dealers found</p>
              <p className="text-xs">Add a dealer or adjust your search filter.</p>
            </div>
          ) : (
            filteredList.map((node) => {
              const isSelected = selectedId === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  className={`w-full p-3.5 rounded-[18px] text-left transition-all flex items-center gap-3.5 border ${
                    isSelected
                      ? "bg-[#FBF1D6] border-[#C4912A] shadow-sm"
                      : "bg-white hover:bg-[#FFFBF0] border-[#F0ECE0]"
                  }`}
                >
                  <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                    {node.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-bold text-[#15130D] truncate">
                        {node.name}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] shrink-0">
                        {node.country || "India"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] bg-white border border-[#F0ECE0] text-[#7A560A]">
                        {node.category || "Supplier Node"}
                      </span>
                      <span className="text-[10px] text-[#6B6A66] truncate">
                        {node.contactPerson || "Verified Partner"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Conversation & Call View ─── */}
      <div
        className={`flex-1 flex flex-col relative overflow-hidden bg-[#FFFBF2] ${
          !selectedId ? "hidden md:flex items-center justify-center" : "flex"
        }`}
      >
        {selectedId && selectedUser ? (
          <>
            {/* Header */}
            <header className="h-[68px] px-6 border-b border-[#F0ECE0] bg-white flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 rounded-full hover:bg-[#F4F4F7] text-[#15130D]"
                  onClick={() => setSelectedId(null)}
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2]" />
                </button>
                <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#EBC964] to-[#C4912A] text-[#7A560A] font-extrabold flex items-center justify-center shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-[#15130D]">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0B7A57]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0B7A57]" />
                      Verified Dealer Node
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => initiateCall("AUDIO")}
                  className="h-10 px-4 rounded-full bg-[#E2F5EE] hover:bg-[#d0efe4] text-[#0B7A57] text-xs font-bold uppercase tracking-[0.14em] flex items-center gap-2 transition-colors"
                >
                  <Waves className="w-4 h-4 stroke-[2]" />
                  <span className="hidden sm:inline">Voice Call</span>
                </button>
                <button
                  onClick={() => initiateCall("VIDEO")}
                  className="h-10 px-4 rounded-full bg-[#FBF1D6] hover:bg-[#f3e5be] text-[#7A560A] text-xs font-bold uppercase tracking-[0.14em] flex items-center gap-2 transition-colors"
                >
                  <Video className="w-4 h-4 stroke-[2]" />
                  <span className="hidden sm:inline">Video Call</span>
                </button>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-10 h-10 rounded-full border border-[#F0ECE0] bg-white hover:bg-[#F4F4F7] text-[#15130D] flex items-center justify-center transition-colors"
                  title="Schedule Call"
                >
                  <CalendarClock className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            </header>

            {/* Chat Body */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#FFFBF2] bg-gold-dots">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar"
              >
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-20 text-xs text-[#6B6A66]">
                    Connecting encrypted communication line...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-20 space-y-4">
                    <div className="w-14 h-14 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shadow-sm">
                      <MessageCircle className="w-7 h-7 stroke-[1.8]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#15130D]">
                        Secure Dealer Channel
                      </h4>
                      <p className="text-xs text-[#6B6A66] mt-1">
                        Send specifications, supply inquiries, and negotiation terms directly.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId !== targetUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] px-5 py-3.5 rounded-[20px] text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-medium rounded-tr-none"
                              : "bg-white border border-[#F0ECE0] text-[#15130D] rounded-tl-none"
                          }`}
                        >
                          <p>{msg.body}</p>
                          <div
                            className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                              isMe ? "text-[#7A560A] justify-end" : "text-[#6B6A66] justify-start"
                            }`}
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

              {/* Message Composer */}
              <div className="p-4 md:p-6 bg-transparent">
                <form
                  onSubmit={handleSendMsg}
                  className="flex items-center gap-3 bg-white border border-[#F0ECE0] rounded-full p-2 pl-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                >
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Type trade message or inquiry..."
                    className="flex-1 bg-transparent text-sm text-[#15130D] placeholder:text-[#6B6A66] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!msgInput.trim()}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] flex items-center justify-center shrink-0 disabled:opacity-40 transition-transform active:scale-95 shadow-sm"
                  >
                    <Send className="w-4 h-4 stroke-[2]" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          /* Empty State: OPS TERMINAL */
          <div className="text-center max-w-md space-y-6 p-8">
            <div className="w-24 h-24 mx-auto rounded-[24px] bg-[#FBF1D6] border border-[#F0ECE0] flex items-center justify-center shadow-lg rotate-3 group hover:rotate-0 transition-transform duration-300">
              <Handshake className="w-12 h-12 text-[#C4912A] stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold uppercase tracking-tight text-[#15130D]">
                Dealers Operations
              </h2>
              <p className="text-xs text-[#6B6A66] font-semibold uppercase tracking-[0.14em] mt-2 leading-relaxed">
                Select a registered dealer node from the list to review supply records, negotiate pricing, or launch voice/video conferences.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                Verified Nodes
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#F7F5F0] text-[#6B6A66]">
                Secure P2P Feed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      <ScheduleCallModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        receiver={selectedUser ? { id: selectedUser.id, name: selectedUser.name } : null}
        onScheduled={() => toast.success("Negotiation session requested.")}
      />

      {/* Add Dealer Modal */}
      <AnimatePresence>
        {isAddDealerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-[#F0ECE0] w-full max-w-xl rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="p-6 border-b border-[#F0ECE0] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                    Registration
                  </span>
                  <h3 className="text-xl font-extrabold text-[#15130D]">
                    Register New Dealer
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddDealerModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#F4F4F7] hover:bg-[#ece7da] text-[#15130D] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

              <form onSubmit={handleAddDealer} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                      Company Name *
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full h-11 px-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                      placeholder="e.g. Apex Minerals Ltd"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full h-11 px-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                      placeholder="dealer@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                      placeholder="India"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                      Category
                    </label>
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A]"
                      placeholder="Chemicals, Areca Leaf, etc."
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] block mb-1.5">
                    Notes & Capabilities
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-4 bg-[#F4F4F7] border border-[#F0ECE0] rounded-xl text-sm text-[#15130D] focus:outline-none focus:border-[#C4912A] resize-none"
                    placeholder="Enter production capacity, minimum order requirements..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0ECE0]">
                  <button
                    type="button"
                    onClick={() => setIsAddDealerModalOpen(false)}
                    className="h-10 px-5 rounded-full bg-[#FBF1D6] hover:bg-[#F5E6BF] text-[#7A560A] text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-5 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(196,145,42,0.25)] hover:shadow-[0_6px_20px_rgba(196,145,42,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 stroke-[2]" />}
                    Save Dealer Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
