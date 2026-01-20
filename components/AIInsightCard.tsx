"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/types";

interface AIInsightCardProps {
  transactions: Transaction[];
  currentDate: Date;
  visible: boolean; // Only fetch if visible/authenticated
}

export default function AIInsightCard({
  transactions,
  currentDate,
  visible,
}: AIInsightCardProps) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchInsight = async () => {
    if (!visible || transactions.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions,
          currentMonth: currentDate.getMonth(),
          currentYear: currentDate.getFullYear(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInsight(data.insight);
        setHasFetched(true);
      }
    } catch (error) {
      console.error("Failed to fetch insight", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch ONLY once when component mounts and data is available
  // To avoid spamming API on every render, we check !hasFetched
  // We can also let user trigger it manually if preferred, but "Monthly Insight" usually implies auto.
  useEffect(() => {
    if (visible && transactions.length > 0 && !hasFetched && !loading) {
      // Small timeout to let UI settle
      const timeout = setTimeout(() => {
        fetchInsight();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [visible, transactions.length, hasFetched]); // Depend on length to refetch if data changes significantly? Maybe not for now.

  if (!visible || transactions.length === 0) return null;

  return (
    <div className="relative overflow-hidden p-[1px] rounded-2xl bg-gradient-to-br from-indigo-500/50 via-purple-500/50 to-pink-500/50 mb-4">
      {/* Inner Content */}
      <div className="bg-neutral-900/90 backdrop-blur-xl rounded-2xl p-5 relative">
        <div className="flex items-start gap-4">
          {/* AI Icon */}
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 shrink-0">
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
              className="text-white"
            >
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5 12 12l3.5-3.5" />
              <path d="M12 12l3.5 3.5L12 19l-3.5-3.5L12 12" />
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Assistant Insight
              </h3>
              <button
                onClick={fetchInsight}
                disabled={loading}
                className="text-xs text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={loading ? "animate-spin" : ""}
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16l5 5h-5" />
                </svg>
                {loading ? "Menganalisis..." : "Refresh"}
              </button>
            </div>

            <div className="min-h-[60px]">
              {loading && !insight ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-neutral-300 text-sm leading-relaxed font-medium italic">
                  &quot;{insight || "Mengintip dompetmu..."}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
