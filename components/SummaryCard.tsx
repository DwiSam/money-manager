import React from "react";

interface SummaryCardProps {
  title: string;
  amount: number;
  type: "balance" | "income" | "expense";
  visible?: boolean;
  trend?: number; // Added trend prop
}

export default function SummaryCard({
  title,
  amount,
  type,
  visible = true,
  trend,
}: SummaryCardProps) {
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getColors = () => {
    switch (type) {
      case "income":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "expense":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "income":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
          >
            <path d="m22 7-8.5 8.5a1.41 1.41 0 0 1-2 0L8 12.5 2 18.5" />
            <path d="M16 7h6v6" />
          </svg>
        );
      case "expense":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
          >
            <path d="m22 17-8.5-8.5a1.41 1.41 0 0 0-2 0L8 11.5 2 5.5" />
            <path d="M16 17h6v-6" />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`flex flex-col p-4 rounded-xl border ${getColors()} backdrop-blur-sm relative overflow-hidden`}
    >
      {/* Watermark Icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <div className="w-16 h-16">{getIcon()}</div>
      </div>

      {/* Content */}
      <span className="text-sm font-medium opacity-80 relative z-10">
        {title}
      </span>
      <span className="text-xl font-bold font-mono mt-1 tracking-tight relative z-10">
        {visible ? formatRupiah(amount) : "Rp •••••••"}
      </span>

      {/* Trend Indicator */}
      {visible && trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 relative z-10">
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              trend > 0
                ? type === "expense"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-emerald-500/20 text-emerald-400"
                : trend < 0
                ? type === "expense"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
                : "bg-neutral-500/20 text-neutral-400"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          <span className="text-xs text-neutral-500">vs bulan lalu</span>
        </div>
      )}
    </div>
  );
}
