"use client";

import React, { useState } from "react";
import { 
  Shield, 
  FileDown, 
  FileEdit, 
  UserX, 
  Trash2, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  X,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/api-utils";

interface PrivacyGovernanceSectionProps {
  userEmail?: string;
}

type DialogType = "DOWNLOAD_DATA" | "CORRECT_DATA" | "WITHDRAW_CONSENT" | "DELETE_ACCOUNT" | null;

export default function PrivacyGovernanceSection({ userEmail = "" }: PrivacyGovernanceSectionProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (type: "DOWNLOAD_DATA" | "CORRECT_DATA" | "WITHDRAW_CONSENT" | "DELETE_ACCOUNT") => {
    if (type === "DELETE_ACCOUNT" && confirmEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
      toast.error("Please enter your exact account email to confirm account deletion petition.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch<any>("/api/user/privacy-request", {
        method: "POST",
        body: JSON.stringify({ requestType: type }),
      });
      toast.success(res.message || "Your statutory privacy petition has been registered.");
      setActiveDialog(null);
      setConfirmEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit petition. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-7 md:p-[28px] shadow-[0_4px_20px_rgba(21,19,13,0.04)] space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F0ECE0]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-[48px] h-[48px] rounded-[14px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center shrink-0 shadow-xs">
              <Shield className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[18px] font-[800] uppercase tracking-wide text-[#15130D]">
                PRIVACY & DATA GOVERNANCE
              </h3>
              <p className="text-[14px] text-[#4A483F] mt-0.5">
                Exercise your statutory data principal rights under DPDP Act 2023 &amp; GDPR
              </p>
            </div>
          </div>

          <div className="bg-[#FFF4D6] border border-[#F1DFAE] px-3.5 py-2 rounded-full flex items-center gap-2 self-start lg:self-auto shadow-xs">
            <span className="text-[11px] font-[800] uppercase tracking-wider text-[#7A560A]">
              Grievance Officer:
            </span>
            <span className="text-[12px] font-[700] text-[#15130D]">
              Ranjeet Subhash Pote
            </span>
            <span className="text-[#C4912A]">•</span>
            <a
              href="mailto:connect@ranoteexim.com?subject=DPDP%20Statutory%20Inquiry%20-%20Ranote%20Exim"
              className="text-[12px] font-[700] text-[#7A560A] hover:underline"
            >
              connect@ranoteexim.com
            </a>
          </div>
        </div>

        {/* 3-Column Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Download My Data */}
          <div className="bg-white border border-[#F0ECE0] rounded-[18px] p-4 hover:border-[#C4912A]/50 transition-all flex flex-col justify-between shadow-xs group">
            <div>
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center">
                <FileDown className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h4 className="text-[14px] font-[800] text-[#15130D] mt-3 group-hover:text-[#7A560A] transition-colors">
                Download My Data
              </h4>
              <p className="text-[13px] text-[#6B6A66] mt-1 leading-relaxed">
                Export verified KYC records, quotation logs, and trade telemetry archives.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveDialog("DOWNLOAD_DATA")}
              className="mt-4 w-full h-[40px] rounded-[12px] bg-[#FBF1D6] hover:bg-[#F5E6BF] border border-[#C4912A]/30 text-[#7A560A] font-[700] text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Request Export
            </button>
          </div>

          {/* Card 2: Correct My Data */}
          <div className="bg-white border border-[#F0ECE0] rounded-[18px] p-4 hover:border-[#C4912A]/50 transition-all flex flex-col justify-between shadow-xs group">
            <div>
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center">
                <FileEdit className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h4 className="text-[14px] font-[800] text-[#15130D] mt-3 group-hover:text-[#7A560A] transition-colors">
                Correct My Data
              </h4>
              <p className="text-[13px] text-[#6B6A66] mt-1 leading-relaxed">
                Lodge formal amendment for statutory tax IDs, corporate registry, or phone numbers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveDialog("CORRECT_DATA")}
              className="mt-4 w-full h-[40px] rounded-[12px] bg-[#FBF1D6] hover:bg-[#F5E6BF] border border-[#C4912A]/30 text-[#7A560A] font-[700] text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Lodge Correction
            </button>
          </div>

          {/* Card 3: Withdraw Consent */}
          <div className="bg-white border border-[#F0ECE0] rounded-[18px] p-4 hover:border-[#C4912A]/50 transition-all flex flex-col justify-between shadow-xs group">
            <div>
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center">
                <UserX className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h4 className="text-[14px] font-[800] text-[#15130D] mt-3 group-hover:text-[#7A560A] transition-colors">
                Withdraw Consent
              </h4>
              <p className="text-[13px] text-[#6B6A66] mt-1 leading-relaxed">
                Revoke marketing &amp; algorithmic trade-matching preferences across active nodes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveDialog("WITHDRAW_CONSENT")}
              className="mt-4 w-full h-[40px] rounded-[12px] bg-[#FBF1D6] hover:bg-[#F5E6BF] border border-[#C4912A]/30 text-[#7A560A] font-[700] text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Update Preferences
            </button>
          </div>

          {/* Row 2 - Card 4: Delete My Account (Red) */}
          <div className="bg-white border border-[#FEE4E2] rounded-[18px] p-4 hover:border-[#B42318]/40 transition-all flex flex-col justify-between shadow-xs group">
            <div>
              <div className="w-[40px] h-[40px] rounded-[12px] bg-[#FEE4E2] text-[#B42318] flex items-center justify-center">
                <Trash2 className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h4 className="text-[14px] font-[800] text-[#B42318] mt-3">
                Delete My Account
              </h4>
              <p className="text-[13px] text-[#6B6A66] mt-1 leading-relaxed">
                Subject to statutory customs retention under Indian FTDR Act &amp; GST compliance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveDialog("DELETE_ACCOUNT")}
              className="mt-4 w-full h-[40px] rounded-[12px] bg-[#FEE4E2] hover:bg-[#FECDCA] border border-[#FDA29B] text-[#B42318] font-[700] text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Petition Account Closure
            </button>
          </div>

          {/* Row 2 - Card 5: Contact Grievance Officer (Spans 2 columns) */}
          <div className="sm:col-span-2 bg-[#FFF4D6] border border-[#F1DFAE] rounded-[18px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-[44px] h-[44px] rounded-[14px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center shrink-0 border border-[#C4912A]/20">
                <Shield className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-[15px] font-[800] text-[#15130D]">
                  Contact Grievance Officer
                </h4>
                <p className="text-[13px] text-[#4A483F] mt-0.5 leading-relaxed">
                  Ranjeet Subhash Pote (Chief Legal &amp; Grievance Officer) · Statutory response guaranteed within 24 hours under DPDP Rules.
                </p>
              </div>
            </div>

            <a
              href="mailto:connect@ranoteexim.com?subject=Grievance%20Redressal%20Inquiry%20-%20Ranote%20Exim"
              className="h-[44px] px-5 rounded-[12px] bg-[#15130D] text-white hover:bg-black font-[700] text-[13px] transition-colors flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <Mail className="w-4 h-4" />
              Lodge Formal Grievance
            </a>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      {activeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-[#F0ECE0] p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    activeDialog === "DELETE_ACCOUNT"
                      ? "bg-[#FEE4E2] text-[#B42318]"
                      : "bg-[#FFF4D6] text-[#7A560A]"
                  }`}
                >
                  {activeDialog === "DELETE_ACCOUNT" ? (
                    <AlertTriangle className="w-6 h-6 stroke-[2]" />
                  ) : activeDialog === "DOWNLOAD_DATA" ? (
                    <FileDown className="w-6 h-6 stroke-[2]" />
                  ) : activeDialog === "CORRECT_DATA" ? (
                    <FileEdit className="w-6 h-6 stroke-[2]" />
                  ) : (
                    <UserX className="w-6 h-6 stroke-[2]" />
                  )}
                </div>
                <div>
                  <h4 className="text-[18px] font-[800] text-[#15130D]">
                    {activeDialog === "DOWNLOAD_DATA" && "Confirm Data Export Request"}
                    {activeDialog === "CORRECT_DATA" && "Submit Record Correction Notice"}
                    {activeDialog === "WITHDRAW_CONSENT" && "Withdraw Processing Consent"}
                    {activeDialog === "DELETE_ACCOUNT" && "Statutory Account Deletion Petition"}
                  </h4>
                  <p className="text-[12px] text-[#6B6A66] mt-0.5">
                    DPDP Act 2023 Statutory Principal Protection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDialog(null);
                  setConfirmEmail("");
                }}
                className="text-[#6B6A66] hover:text-[#15130D] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-[14px] text-[#4A483F] space-y-3 leading-relaxed">
              {activeDialog === "DOWNLOAD_DATA" && (
                <p>
                  You are requesting a cryptographically signed archive of your verified trade manifests, KYC identity records, quotation logs, and customs filings. The export link will be dispatched to <strong>{userEmail}</strong> within 48 hours.
                </p>
              )}

              {activeDialog === "CORRECT_DATA" && (
                <p>
                  A data rectification petition will be lodged with the Compliance Officer. Our verification team will review your business registry, IEC, or corporate identity documents before updating the global directory.
                </p>
              )}

              {activeDialog === "WITHDRAW_CONSENT" && (
                <p>
                  Withdrawing consent will disable algorithmic buyer-exporter matching and promotional trade updates. Mandatory customs compliance and transaction escrow records will remain maintained per regulatory mandates.
                </p>
              )}

              {activeDialog === "DELETE_ACCOUNT" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#FEE4E2]/50 border border-[#FDA29B] text-[13px] text-[#B42318] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Lock className="w-4 h-4 shrink-0" />
                      Statutory Retention Mandate
                    </p>
                    <p className="text-[12px] leading-relaxed">
                      Under Indian Foreign Trade (Development and Regulation) Act and Customs Act, commercial export transaction records and escrow contracts are subject to mandatory 7-year statutory retention.
                    </p>
                  </div>
                  <p className="text-[13px]">
                    To confirm this closure petition, please type your registered account email (<strong>{userEmail}</strong>) below:
                  </p>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={userEmail}
                    className="w-full h-11 bg-[#F7F5F0] border border-[#F0ECE0] rounded-xl px-4 text-sm text-[#15130D] focus:outline-none focus:border-[#B42318]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0ECE0]">
              <button
                type="button"
                onClick={() => {
                  setActiveDialog(null);
                  setConfirmEmail("");
                }}
                className="h-[44px] px-5 rounded-[12px] border border-[#F0ECE0] bg-[#F7F5F0] hover:bg-[#F0ECE0] text-[13px] font-[700] text-[#4A483F] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAction(activeDialog)}
                className={`h-[44px] px-6 rounded-[12px] font-[800] text-[13px] shadow-sm transition-all flex items-center gap-2 ${
                  activeDialog === "DELETE_ACCOUNT"
                    ? "bg-[#B42318] hover:bg-[#912018] text-white"
                    : "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D]"
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {activeDialog === "DELETE_ACCOUNT" ? "Confirm Deletion Petition" : "Confirm Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

