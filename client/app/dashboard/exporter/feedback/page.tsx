'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    Star,
    MessageSquare,
    AlertCircle,
    ShieldCheck,
    Zap,
    User,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExporterFeedback() {
    const [activeTab, setActiveTab] = useState('ALL');
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        const fetchFeedbacks = async () => {
            try {
                const res = await axios.get(`/api/reviews?userId=${user.id}`);
                setFeedbacks(res.data.reviews || []);
            } catch (error) {
                console.error("Error fetching feedbacks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedbacks();
    }, [user?.id]);

    const filteredFeedbacks = activeTab === 'ALL' ? feedbacks : feedbacks.filter(f => f.category === activeTab);

    return (
        <div className="h-full overflow-hidden flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
            {/* ── Header ── */}
            <header className="flex-shrink-0 px-8 py-6 border-b border-border dark:border-white/5 bg-background/40 backdrop-blur-3xl z-40">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Reviews & Feedback</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage and view verified importer ratings and customer reviews.
                        </p>
                    </div>

                    <div className="flex bg-black/5 dark:bg-white/10 p-1.5 rounded-lg border border-border dark:border-white/10 backdrop-blur-3xl">
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'ALL' ? 'bg-primary text-primary-foreground shadow-xl dark:shadow-2xl' : 'text-muted-foreground/40 hover:text-foreground dark:text-white'}`}
                        >
                            All Feedback
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-12 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="w-full space-y-12">
                    {loading ? (
                        <div className="flex justify-center items-center py-32">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : filteredFeedbacks.length === 0 ? (
                        <div className="bg-card/40 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 shadow-xl dark:shadow-2xl rounded-lg p-24 text-center">
                            <div className="flex flex-col items-center gap-8 opacity-40">
                                <div className="p-10 rounded-lg bg-black/5 dark:bg-white/10 border border-border dark:border-white/10">
                                    <MessageSquare className="w-16 h-16 text-foreground dark:text-white" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-black text-foreground dark:text-white uppercase tracking-tighter">No Feedback Yet</h2>
                                    <p className="text-[10px] text-foreground dark:text-white font-black uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed ">
                                        Market registry query returned no active reviews. Deliver successful consignments to accumulate feedback data.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredFeedbacks.map((item) => (
                                <div key={item.id} className="group flex flex-col bg-card/40 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 hover:border-border dark:border-white/20 transition-all duration-700 shadow-xl dark:shadow-2xl rounded-lg overflow-hidden hover:-translate-y-2">
                                    <div className="p-10 flex-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                            <MessageSquare className="w-32 h-32 text-foreground dark:text-white" />
                                        </div>

                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <span className="px-5 py-2 rounded-full bg-black/5 dark:bg-white/10 text-foreground dark:text-white text-[9px] font-black uppercase tracking-widest border border-border dark:border-white/10 ">
                                                VERIFIED_NODE
                                            </span>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-black/5 dark:bg-white/10 px-4 py-2 rounded-full">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center border border-border dark:border-white/10 text-muted-foreground overflow-hidden">
                                                {item.reviewer?.avatar ? (
                                                    <img src={item.reviewer.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-foreground dark:text-white tracking-tighter uppercase group-hover:translate-x-1 transition-transform">
                                                    {item.reviewer?.name || 'Anonymous'}
                                                </h3>
                                                <div className="flex items-center gap-1 mt-1 text-[#D4AF37]">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(item.rating) ? 'fill-current' : 'fill-transparent opacity-30 text-muted-foreground'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {item.product?.name && (
                                            <div className="mb-4 text-xs font-semibold text-primary truncate max-w-full">
                                                Product: {item.product.name}
                                            </div>
                                        )}

                                        <p className="text-muted-foreground/60 text-sm font-medium line-clamp-4 leading-relaxed group-hover:text-muted-foreground/80 transition-colors">
                                            "{item.comment || 'No comment provided'}"
                                        </p>
                                    </div>

                                    <div className="p-8 bg-black/5 dark:bg-white/[0.02] border-t border-border dark:border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-black/5 dark:bg-white/10 px-4 py-2 rounded-full">
                                                <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED_PURCHASE
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Banner */}
                    <div className="bg-card/60 dark:bg-white/[0.07] backdrop-blur-3xl border border-border dark:border-white/10 rounded-lg p-12 flex flex-col xl:flex-row items-center gap-10 shadow-xl dark:shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-6 transition-transform duration-1000">
                            <Zap className="w-40 h-40 text-foreground dark:text-white" />
                        </div>
                        <div className="size-20 rounded-lg bg-black/5 dark:bg-white/10 border border-border dark:border-white/10 flex items-center justify-center shrink-0 relative z-10">
                            <AlertCircle className="w-10 h-10 text-foreground dark:text-white" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-foreground dark:text-white font-black text-2xl uppercase tracking-tighter mb-4">Reputation Node Analytics</h3>
                            <p className="text-muted-foreground/40 text-xs font-medium leading-relaxed max-w-3xl uppercase tracking-tight group-hover:text-muted-foreground/80 transition-colors">
                                Your centralized repository for importer ratings and qualitative feedback. Sustaining a high registry satisfaction metric amplifies your visibility in the global marketplace portal.
                            </p>
                        </div>
                        <button className="xl:ml-auto border border-border dark:border-white/10 text-foreground dark:text-white hover:bg-primary hover:text-primary-foreground h-16 px-10 rounded-lg font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl dark:shadow-2xl relative z-10">
                            Intel_Terminal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
