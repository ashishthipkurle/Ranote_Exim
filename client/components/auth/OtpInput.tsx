"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  length?: number;
  className?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  value = "",
  onChange,
  onComplete,
  disabled = false,
  length = 6,
  className,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of single-digit strings
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Keep only numbers 0-9
    const cleanDigits = rawVal.replace(/\D/g, "");

    if (!cleanDigits) {
      // Empty / cleared
      const newDigits = [...digits];
      newDigits[index] = "";
      const newCode = newDigits.join("");
      onChange(newCode);
      return;
    }

    if (cleanDigits.length > 1) {
      // Handle paste or multiple digits typed into one slot
      const newDigits = [...digits];
      let lastFilledIndex = index;

      for (let i = 0; i < cleanDigits.length && index + i < length; i++) {
        newDigits[index + i] = cleanDigits[i];
        lastFilledIndex = index + i;
      }

      const newCode = newDigits.join("");
      onChange(newCode);

      const nextFocus = Math.min(lastFilledIndex + 1, length - 1);
      inputRefs.current[nextFocus]?.focus();

      if (newCode.length === length && onComplete) {
        onComplete(newCode);
      }
      return;
    }

    // Single digit entered
    const singleDigit = cleanDigits.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    const newCode = newDigits.join("");
    onChange(newCode);

    // Auto-advance to next slot
    if (singleDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.length === length && onComplete) {
      onComplete(newCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous box and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const cleanNumbers = pastedData.replace(/\D/g, "").slice(0, length);

    if (cleanNumbers) {
      onChange(cleanNumbers);
      const focusIndex = Math.min(cleanNumbers.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      if (cleanNumbers.length === length && onComplete) {
        onComplete(cleanNumbers);
      }
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || "";
          const isFilled = Boolean(digit);

          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={disabled}
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={cn(
                "w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black font-mono rounded-xl border-2 transition-all outline-none select-none",
                "bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100",
                isFilled
                  ? "border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
                "focus:border-primary focus:ring-4 focus:ring-primary/20",
                disabled && "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
              )}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between w-full px-1 pt-1 text-[11px] text-muted-foreground font-semibold">
        <span>Digits only (0-9)</span>
        <span className={cn(value.length === length ? "text-primary font-bold" : "")}>
          {value.length}/{length} entered
        </span>
      </div>
    </div>
  );
}

