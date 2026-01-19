"use client";

import { useState } from "react";

interface PinAccessProps {
  onSuccess: () => void;
}

export default function PinAccess({ onSuccess }: PinAccessProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default hardcoded PIN for simplicity as requested
    // In production, this could be an ENV variable but client-side exposed anyway
    if (pin === process.env.NEXT_PUBLIC_ACCESS_PIN) {
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans text-neutral-200">
      <div className="w-full max-w-md bg-neutral-900/50 border border-neutral-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Akses Terbatas
          </h1>
          <p className="text-neutral-500 mt-2 text-sm">
            Websitenya gua pin wlekk
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Masukkan 6 digit PIN"
              className={`w-full text-center text-2xl tracking-[0.5em] p-4 bg-neutral-950 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:tracking-normal placeholder:text-base placeholder:text-neutral-700 ${
                error
                  ? "border-rose-500/50 focus:ring-rose-500/20 text-rose-500"
                  : "border-neutral-800 focus:border-blue-500/50 focus:ring-blue-500/20 text-white"
              }`}
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value.replace(/\D/g, ""));
              }}
              autoFocus
            />
            {error && (
              <p className="text-center text-rose-500 text-xs animate-pulse">
                PIN Salah! Silakan coba lagi.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold p-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            Buka Gembok
          </button>
        </form>

        <p className="text-center text-xs text-neutral-600 mt-8">
          &copy; 2025 Money Tracker by Dwi Samsiarto
        </p>
        <p className="text-center text-xs text-neutral-600 mt-8">
          version 1.0.3
        </p>
      </div>
    </div>
  );
}
