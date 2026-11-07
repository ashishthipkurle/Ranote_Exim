'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    preferences: false,
    analytics: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    setShowBanner(false);

    if (prefs.analytics) {
      window.dispatchEvent(new CustomEvent('ranote-analytics-optin'));
    }
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      preferences: true,
      analytics: true,
    });
  };

  const rejectNonEssential = () => {
    saveConsent({
      essential: true,
      preferences: false,
      analytics: false,
    });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-5 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100]"
          role="dialog"
          aria-labelledby="cookie-consent-title"
        >
          <div className="bg-white border border-[#ECE7DA] rounded-[24px] p-5 sm:p-6 shadow-[0_20px_50px_-20px_rgba(20,18,11,0.25)] relative overflow-hidden text-[#15130D]">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 id="cookie-consent-title" className="text-sm font-[800] text-[#15130D]">
                    Cookie Preferences
                  </h3>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="size-7 rounded-full bg-[#F7F5F0] hover:bg-[#ECE7DA] text-[#6B6A66] hover:text-[#15130D] flex items-center justify-center transition-colors"
                    aria-label="Close cookie banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[#6B6A66] text-xs leading-relaxed mb-4">
                  We use cookies to maintain your encrypted session, remember preferences, and analyze platform telemetry. Learn more in our{' '}
                  <Link
                    href="/privacy-policy#cookies"
                    className="text-[#7A560A] font-[700] hover:underline"
                  >
                    Privacy Policy (Cookies)
                  </Link>.
                </p>

                {/* Granular Toggles when Expanded */}
                {showDetails && (
                  <div className="space-y-2.5 mb-4 p-3 rounded-[16px] bg-[#FFFBF2] border border-[#ECE7DA] text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-[700] text-[#15130D] block">Essential Cookies</span>
                        <span className="text-[10px] text-[#6B6A66]">Required for authentication &amp; security</span>
                      </div>
                      <span className="text-[10px] font-[800] uppercase tracking-wider text-[#0B7A57] bg-[#E2F5EE] px-2 py-0.5 rounded-full">
                        Always On
                      </span>
                    </div>

                    <div className="h-px bg-[#ECE7DA]" />

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-[700] text-[#15130D] block">Preference Cookies</span>
                        <span className="text-[10px] text-[#6B6A66]">Language, trade currency &amp; UI settings</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={(e) => setPreferences((p) => ({ ...p, preferences: e.target.checked }))}
                        className="size-4 rounded border-[#ECE7DA] text-[#C4912A] focus:ring-[#C4912A]/30 cursor-pointer"
                      />
                    </div>

                    <div className="h-px bg-[#ECE7DA]" />

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-[700] text-[#15130D] block">Analytics Telemetry</span>
                        <span className="text-[10px] text-[#6B6A66]">Anonymized trade speed &amp; latency metrics</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                        className="size-4 rounded border-[#ECE7DA] text-[#C4912A] focus:ring-[#C4912A]/30 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={acceptAll}
                      className="flex-1 h-9 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-[700] text-xs shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                    >
                      Accept All
                    </button>
                    {showDetails ? (
                      <button
                        onClick={saveCustom}
                        className="flex-1 h-9 rounded-full bg-[#FBF1D6] hover:bg-[#F5E6BF] text-[#7A560A] font-[700] text-xs transition-colors"
                      >
                        Save Choice
                      </button>
                    ) : (
                      <button
                        onClick={rejectNonEssential}
                        className="flex-1 h-9 rounded-full bg-[#F7F5F0] hover:bg-[#ECE7DA] text-[#4A483F] font-[700] text-xs transition-colors"
                      >
                        Essential Only
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full text-center text-[11px] font-[600] text-[#7A560A] hover:underline flex items-center justify-center gap-1 pt-1"
                  >
                    <span>{showDetails ? 'Hide Options' : 'Customize Options'}</span>
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
