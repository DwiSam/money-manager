"use client";

import { useState, useEffect } from "react";

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletName: string;
  currentBalance: number;
  onConfirm: (diff: number) => void;
  loading?: boolean;
}

export default function AdjustmentModal({
  isOpen,
  onClose,
  walletName,
  currentBalance,
  onConfirm,
  loading = false,
}: AdjustmentModalProps) {
  const [actualBalance, setActualBalance] = useState<string>("");
  const [diff, setDiff] = useState<number>(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActualBalance(currentBalance.toString());
      setDiff(0);
    }
  }, [isOpen, currentBalance]);

  // Calculate difference whenever actualBalance changes
  useEffect(() => {
    const actual = parseFloat(actualBalance.replace(/,/g, "")) || 0;
    setDiff(actual - currentBalance);
  }, [actualBalance, currentBalance]);

  if (!isOpen) return null;

  const toIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(diff);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-white mb-1">Penyesuaian Saldo</h3>
        <p className="text-xs text-neutral-400 mb-6">
          Sesuaikan saldo aplikasi dengan saldo asli.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info Dompet & Saldo Sistem */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-800">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                Dompet
              </label>
              <div className="text-sm font-medium text-white">{walletName}</div>
            </div>
            <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-800">
              <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                Saldo Aplikasi
              </label>
              <div className="text-sm font-bold text-blue-400 font-mono">
                {toIDR(currentBalance)}
              </div>
            </div>
          </div>

          {/* Input Saldo Asli */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Saldo Asli (Saat Ini)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-sans">
                Rp
              </span>
              <input
                type="number"
                value={actualBalance}
                onChange={(e) => setActualBalance(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-lg font-mono"
                placeholder="0"
                autoFocus
              />
            </div>
          </div>

          {/* Preview Selisih */}
          {diff !== 0 && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                diff < 0
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              <span>Selisih (Akan dicatat):</span>
              <span className="font-bold font-mono">
                {diff > 0 ? "+" : ""}
                {toIDR(diff)}
              </span>
            </div>
          )}

          {/* Info Action */}
          <p className="text-[10px] text-neutral-500 italic text-center">
            {diff === 0
              ? "Tidak ada perubahan."
              : diff < 0
                ? `Sistem akan mencatat PENGELUARAN sebesar ${toIDR(
                    Math.abs(diff),
                  )}`
                : `Sistem akan mencatat PEMASUKAN sebesar ${toIDR(diff)}`}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 transition-all text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || diff === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menyesuaikan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
