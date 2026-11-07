"use client";

import React from "react";
import { GrievanceOfficer } from "@/content/legal/types";
import { Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import { renderWithPlaceholders } from "./Placeholder";

interface LegalContactCardProps {
  title: string;
  note: string;
  officer: GrievanceOfficer;
}

export default function LegalContactCard({
  title,
  note,
  officer,
}: LegalContactCardProps) {
  return (
    <div className="mt-14 p-6 sm:p-8 rounded-[24px] border border-[#F1DFAE] shadow-sm bg-gradient-to-br from-[#FFF8E6] to-[#FBF1D6]">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-[12px] bg-white/80 border border-[#C4912A]/30 text-[#C4912A] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[17px] font-[800] text-[#15130D]">
            {renderWithPlaceholders(title)}
          </h3>
          <p className="text-xs text-[#7A560A] font-semibold">
            Statutory Compliance & Redressal
          </p>
        </div>
      </div>

      <p className="text-[14px] text-[#4A483F] leading-relaxed mb-6">
        {renderWithPlaceholders(note)}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#F0ECE0]/80">
        <div>
          <p className="text-[11px] font-[800] uppercase tracking-[0.14em] text-[#7A560A] mb-1">
            Designated Officer
          </p>
          <p className="text-[15px] font-[800] text-[#15130D]">
            {renderWithPlaceholders(officer.name)}
          </p>
          <p className="text-xs font-semibold text-[#6B6A66]">
            {renderWithPlaceholders(officer.designation)}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#3A382F]">
            <Mail className="w-4 h-4 text-[#C4912A] shrink-0" />
            <a
              href={`mailto:${officer.email}`}
              className="font-bold text-[#7A560A] hover:underline"
            >
              {officer.email}
            </a>
          </div>
          {officer.phone && (
            <div className="flex items-center gap-2 text-[#3A382F]">
              <Phone className="w-4 h-4 text-[#C4912A] shrink-0" />
              <span className="font-medium">{officer.phone}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-[#6B6A66]">
            <MapPin className="w-4 h-4 text-[#C4912A] shrink-0 mt-0.5" />
            <span className="leading-snug">{officer.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

