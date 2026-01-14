import React from "react";
import { Transaction } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  filter: "Semua" | "Masuk" | "Keluar";
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  showDateFilter?: boolean;
}

export default function TransactionList({
  transactions,
  filter,
  selectedDate,
  onDateSelect,
  showDateFilter = false,
}: TransactionListProps) {
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(num));
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const formatDateLabel = (dateStr: string) => {
    const date = parseDate(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hari Ini";
    if (date.toDateString() === yesterday.toDateString()) return "Kemarin";

    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  };

  // Get unique dates sorted
  const availableDates = Array.from(
    new Set(transactions.map((t) => t.tanggal))
  ).sort((a, b) => parseDate(b).getTime() - parseDate(a).getTime());

  // Filter by type and optionally by date
  const filteredData = transactions
    .filter((item) => {
      if (filter !== "Semua" && item.tipe !== filter) return false;
      if (showDateFilter && selectedDate && item.tanggal !== selectedDate)
        return false;
      return true;
    })
    .map((item, index) => ({ ...item, originalIndex: index })) // Track original position
    .sort((a, b) => {
      const dateA = parseDate(a.tanggal).getTime();
      const dateB = parseDate(b.tanggal).getTime();

      // Primary sort: by date (newest first)
      if (dateB !== dateA) {
        return dateB - dateA;
      }

      // Secondary sort: by original index descending (newest entries last in sheet, so reverse)
      return b.originalIndex - a.originalIndex;
    });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p className="text-sm">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Horizontal Date Filter (Optional) */}
      {showDateFilter && availableDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {availableDates.map((date) => (
            <button
              key={date}
              onClick={() => onDateSelect?.(date)}
              className={`flex flex-col items-center min-w-[70px] px-4 py-2 rounded-xl border transition-all shrink-0 ${
                selectedDate === date
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:bg-neutral-900"
              }`}
            >
              <span className="text-xs font-semibold">
                {formatDateLabel(date)}
              </span>
              <span className="text-[10px] opacity-60">{date}</span>
            </button>
          ))}
        </div>
      )}

      {/* Transaction List */}
      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <p className="text-sm">Tidak ada transaksi untuk filter ini</p>
        </div>
      ) : (
        /* Group by Date */
        filteredData
          .reduce((groups, transaction) => {
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.date === transaction.tanggal) {
              lastGroup.items.push(transaction);
            } else {
              groups.push({ date: transaction.tanggal, items: [transaction] });
            }
            return groups;
          }, [] as { date: string; items: typeof filteredData }[])
          .map((group) => (
            <div key={group.date} className="space-y-3 mb-6">
              {/* Date Header */}
              <h3 className="text-sm font-semibold text-neutral-400 sticky top-0 bg-neutral-950/80 backdrop-blur-sm py-2 z-10 px-1">
                {formatDateLabel(group.date)}
                <span className="text-xs font-normal text-neutral-600 ml-2">
                  {group.date}
                </span>
              </h3>

              {/* Items */}
              <div className="space-y-3">
                {group.items.map((item, idx) => (
                  <div
                    key={`${group.date}-${idx}`}
                    className="flex justify-between items-center p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-200">
                        {item.keterangan}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {item.dompet || "Tunai"}
                        </span>
                        {/* Date shown in header, maybe redundant here but ok to keep for specific context if needed, or remove? 
                            User asked for header, usually implies item date can include time or be simpler. 
                            Let's keep it simple or remove the date from item since it's in header. 
                            Actually let's remove the date from the item row since it's grouped.
                        */}
                      </div>
                    </div>
                    <div
                      className={`font-bold font-mono tracking-tight ${
                        item.tipe === "Masuk"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {item.tipe === "Masuk" ? "+" : "-"}{" "}
                      {formatRupiah(Number(item.jumlah))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
