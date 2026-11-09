'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, Check, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setConsentCookie(prefs: CookiePreferences) {
  if (typeof document === 'undefined') return;
  const payload = encodeURIComponent(
    JSON.stringify({
      essential: true,
      preferences: Boolean(prefs.preferences),
      analytics: Boolean(prefs.analytics),
      timestamp: new Date().toISOString(),
      version: '2026.1',
    })
  );
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `ranote_cookie_consent=${payload}; path=/; max-age=31536000; SameSite=Lax${secure}`;
}

function cleanupCookies(prefs: CookiePreferences) {
  if (typeof document === 'undefined') return;
  if (!prefs.analytics) {
    const analyticsCookies = ['_ga', '_gid', '_gat', 'va_session'];
    analyticsCookies.forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }
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
    let savedPrefs: CookiePreferences | null = null;

    // 1. Check real HTTP/browser cookie first
    const rawCookie = getCookie('ranote_cookie_consent');
    if (rawCookie) {
      try {
        const parsed = JSON.parse(rawCookie);
        if (typeof parsed.essential === 'boolean') {
          savedPrefs = {
            essential: true,
            preferences: Boolean(parsed.preferences),
            analytics: Boolean(parsed.analytics),
          };
        }
      } catch {}
    }

    // 2. Check localStorage fallback
    if (!savedPrefs && typeof localStorage !== 'undefined') {
      const rawStorage = localStorage.getItem('cookie-consent');
      if (rawStorage) {
        try {
          const parsed = JSON.parse(rawStorage);
          if (typeof parsed.essential === 'boolean') {
            savedPrefs = {
              essential: true,
              preferences: Boolean(parsed.preferences),
              analytics: Boolean(parsed.analytics),
            };
            setConsentCookie(savedPrefs);
          }
        } catch {}
      }
    }

    if (savedPrefs) {
      setPreferences(savedPrefs);
      setShowBanner(false);
      if (savedPrefs.analytics) {
        window.dispatchEvent(new CustomEvent('ranote-analytics-optin'));
      }
    } else {
      setShowBanner(true);
    }

    // Allow user to re-open settings anytime from the footer or cookie page
    const handleOpen = () => {
      setShowDetails(true);
      setShowBanner(true);
    };
    window.addEventListener('open-cookie-settings', handleOpen);
    return () => {
      window.removeEventListener('open-cookie-settings', handleOpen);
    };
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    // 1. Write real browser cookie
    setConsentCookie(prefs);

    // 2. Write localStorage backup
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'cookie-consent',
        JSON.stringify({
          ...prefs,
          timestamp: new Date().toISOString(),
        })
      );
    }

    setPreferences(prefs);
    setShowBanner(false);

    // 3. Dispatch analytics events
    if (prefs.analytics) {
      window.dispatchEvent(new CustomEvent('ranote-analytics-optin'));
    } else {
      window.dispatchEvent(new CustomEvent('ranote-analytics-optout'));
      cleanupCookies(prefs);
    }

    // 4. Audit recording in backend legal_consents
    try {
      fetch('/api/legal/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: 'COOKIE_POLICY',
          version: '2026.1',
          preferences: prefs,
        }),
      }).catch(() => {});
    } catch {}
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
                  <h3 id="cookie-consent-title" className="text-sm font-[800] text-[#15130D] flex items-center gap-2">
                    <span>Cookie Preferences</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B7A57] bg-[#E2F5EE] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Encrypted
                    </span>
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
                  We use cookies to maintain your encrypted trade session, remember wholesale preferences, and analyze platform telemetry. Learn more in our{' '}
                  <Link
                    href="/cookies"
                    className="text-[#7A560A] font-[700] hover:underline"
                  >
                    Cookie Policy
                  </Link>.
                </p>

                {/* Granular Toggles when Expanded */}
                {showDetails && (
                  <div className="space-y-2.5 mb-4 p-3.5 rounded-[16px] bg-[#FFFBF2] border border-[#ECE7DA] text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-[700] text-[#15130D] block">Essential Cookies</span>
                        <span className="text-[10px] text-[#6B6A66]">Required for authentication, trade security &amp; session</span>
                      </div>
                      <span className="text-[10px] font-[800] uppercase tracking-wider text-[#0B7A57] bg-[#E2F5EE] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Always Active
                      </span>
                    </div>

                    <div className="h-px bg-[#ECE7DA]" />

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-[700] text-[#15130D] block">Preference Cookies</span>
                        <span className="text-[10px] text-[#6B6A66]">Theme, trade currency (USD/INR/EUR) &amp; language</span>
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
                        <span className="text-[10px] text-[#6B6A66]">Anonymized trade speed, ping &amp; latency metrics</span>
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
