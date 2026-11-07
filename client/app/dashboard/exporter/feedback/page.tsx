'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  User,
  Loader2,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExporterFeedback() {
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

  return (
    <div className="space-y-6">
      {/* ── Page Header: Title + Subtitle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D] uppercase">
            Reviews & Feedback
          </h1>
          <p className="text-sm text-[#6B6A66] mt-1">
            Manage and view verified importer ratings, performance signals, and customer feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
            <span className="size-1.5 rounded-full bg-[#0B7A57]" />
            Reputation Node Active
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#C4912A]" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px]">
          <div className="size-16 rounded-[20px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#15130D]">
            No Feedback Yet
          </h3>
          <p className="text-xs text-[#6B6A66] mt-1 max-w-sm mx-auto">
            Market registry query returned no active reviews. Deliver successful consignments to accumulate feedback data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.round(item.rating)
                            ? "fill-[#C4912A] text-[#C4912A]"
                            : "fill-transparent text-[#ECE7DA]"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#6B6A66] font-semibold">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-[14px] bg-[#FBF1D6] text-[#7A560A] font-extrabold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                    {item.reviewer?.avatar ? (
                      <img src={item.reviewer.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      item.reviewer?.name?.[0]?.toUpperCase() || <User className="w-4 h-4 text-[#7A560A]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-[#15130D]">
                      {item.reviewer?.name || "Verified Importer"}
                    </h4>
                    {item.product?.name && (
                      <p className="text-[10px] text-[#C4912A] font-bold truncate max-w-[180px]">
                        {item.product.name}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#15130D] leading-relaxed italic">
                  "{item.comment || "Consignment received in excellent quality."}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0ECE0] flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0B7A57]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Purchase
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
