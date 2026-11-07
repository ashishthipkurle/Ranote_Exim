"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import axios from "axios";
import { ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { privacyDoc } from "@/content/legal/privacy";
import { termsDoc } from "@/content/legal/terms";

const CURRENT_TERMS_VERSION = termsDoc.version;
const CURRENT_PRIVACY_VERSION = privacyDoc.version;

export default function ReAcceptConsentModal() {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    // Check if user has accepted the latest versions in local state or via API
    const localConsentKey = `ranote-consent-v-${CURRENT_TERMS_VERSION}-${user.id}`;
    const localConsent = localStorage.getItem(localConsentKey);
    if (localConsent === "accepted") {
      return;
    }

    // Query API for server-side consent record
    axios
      .get("/api/legal/consent")
      .then((res) => {
        const consents = res.data?.consents || {};
        const acceptedTerms = consents["TERMS"] === CURRENT_TERMS_VERSION;
        const acceptedPrivacy = consents["PRIVACY_POLICY"] === CURRENT_PRIVACY_VERSION;

        if (!acceptedTerms || !acceptedPrivacy) {
          setShowModal(true);
        } else {
          localStorage.setItem(localConsentKey, "accepted");
        }
      })
      .catch(() => {
        // Silent catch
      });
  }, [user, loading]);

  const handleAccept = async () => {
    if (!agreed || !user) return;
    setIsSubmitting(true);

    try {
      await Promise.all([
        axios.post("/api/legal/consent", {
          userId: user.id,
          document: "TERMS",
          version: CURRENT_TERMS_VERSION,
        }),
        axios.post("/api/legal/consent", {
          userId: user.id,
          document: "PRIVACY_POLICY",
          version: CURRENT_PRIVACY_VERSION,
        }),
      ]);

      localStorage.setItem(`ranote-consent-v-${CURRENT_TERMS_VERSION}-${user.id}`, "accepted");
      setShowModal(false);
    } catch (e) {
      console.error("[Re-consent error]:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[9999] bg-[#14120B]/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(20,18,11,0.4)] border border-[#ECE7DA] text-[#15130D]">
        <div className="size-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h2 id="consent-title" className="text-xl sm:text-2xl font-[800] tracking-tight mb-2">
          Updated Legal Terms &amp; Privacy Policy
        </h2>

        <p className="text-sm text-[#6B6A66] leading-relaxed mb-6">
          We have updated our <strong>Terms &amp; Conditions (v{CURRENT_TERMS_VERSION})</strong> and <strong>Privacy Policy (v{CURRENT_PRIVACY_VERSION})</strong> to ensure full compliance with the Digital Personal Data Protection (DPDP) Act 2023, cross-border customs regulations, and global trade standards.
        </p>

        <div className="space-y-3 p-4 rounded-[18px] bg-[#FFFBF2] border border-[#ECE7DA] mb-6 text-xs text-[#4A483F]">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C4912A]" /> Terms &amp; Conditions
            </span>
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7A560A] font-bold underline hover:text-[#C4912A]"
            >
              Review Terms
            </Link>
          </div>
          <div className="h-px bg-[#ECE7DA]" />
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C4912A]" /> Privacy Policy
            </span>
            <Link
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7A560A] font-bold underline hover:text-[#C4912A]"
            >
              Review Policy
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <input
            type="checkbox"
            id="re-accept-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 size-4 rounded border-[#ECE7DA] text-[#C4912A] focus:ring-[#C4912A]/30 cursor-pointer"
          />
          <label htmlFor="re-accept-checkbox" className="text-xs text-[#3A382F] leading-snug cursor-pointer select-none">
            I confirm that I have read, understood, and accept the updated Terms &amp; Conditions and Privacy Policy on behalf of my enterprise.
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={!agreed || isSubmitting}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-[700] text-sm uppercase tracking-wider shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Recording Acceptance...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Accept &amp; Continue</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

