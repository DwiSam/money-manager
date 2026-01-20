"use client";

import { useMemo, useState } from "react";
import { Transaction } from "@/types";

interface CalendarViewProps {
  data: Transaction[];
  currentDate: Date;
}

export default function CalendarView({ data, currentDate }: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Group data by date
  const dailyData = useMemo(() => {
    const map = new Map<number, { income: number; expense: number }>();

    data.forEach((item) => {
      const [d, m, y] = item.tanggal.split("/").map(Number);
      if (m - 1 === month && y === year) {
        const current = map.get(d) || { income: 0, expense: 0 };
        const amount = Number(item.jumlah);
        const keterangan = item.keterangan || "";

        if (item.tipe === "Masuk" && !keterangan.includes("(ke ")) {
          current.income += amount;
        } else if (item.tipe === "Keluar" && !keterangan.includes("(dari ")) {
          current.expense += amount;
        }
        map.set(d, current);
      }
    });

    return map;
  }, [data, month, year]);

  const days = [];
  // Add empty slots
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "jt";
    if (num >= 1000) return (num / 1000).toFixed(0) + "k";
    return num.toString();
  };

  const toIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Filter transactions for selected day (for the popup)
  const selectedTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return data.filter((item) => {
      const [d, m, y] = item.tanggal.split("/").map(Number);
      return d === selectedDay && m - 1 === month && y === year;
    });
  }, [data, selectedDay, month, year]);

  return (
    <>
      <div className="w-full">
        {/* Grid Header */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-neutral-500 font-medium uppercase tracking-wider">
          <div>Min</div>
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div>Sab</div>
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const stats = dailyData.get(day);
            const hasIncome = stats && stats.income > 0;
            const hasExpense = stats && stats.expense > 0;
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-lg border border-neutral-800/50 p-1 relative flex flex-col items-center justify-start cursor-pointer hover:bg-neutral-800 transition-colors ${
                  isToday
                    ? "bg-blue-500/10 border-blue-500/50"
                    : "bg-neutral-900"
                }`}
              >
                <span
                  className={`text-xs font-medium mb-1 ${
                    isToday ? "text-blue-400" : "text-neutral-400"
                  }`}
                >
                  {day}
                </span>

                {/* Dots/Indicators */}
                <div className="flex flex-col gap-0.5 w-full">
                  {hasIncome && (
                    <div className="w-full h-1.5 rounded-full bg-emerald-500/30 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                  )}
                  {hasExpense && (
                    <div className="w-full h-1.5 rounded-full bg-red-500/30 overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                  )}
                </div>

                {/* Amount snippet */}
                {(hasIncome || hasExpense) && (
                  <div className="mt-auto text-[0.55rem] text-neutral-500 hidden sm:block">
                    {stats?.expense
                      ? `-${formatCompact(stats.expense)}`
                      : `+${formatCompact(stats?.income || 0)}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL POPUP --- */}
      {selectedDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          />
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Transaksi tgl {selectedDay}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                {/* Close Icon (X) */}
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
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {selectedTransactions.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">
                  Tidak ada transaksi di tanggal ini.
                </p>
              ) : (
                selectedTransactions.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start bg-neutral-800/50 p-3 rounded-xl border border-neutral-800"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-white truncate max-w-[180px]">
                        {item.keterangan || item.kategori}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {item.dompet} • {item.kategori}
                      </span>
                    </div>
                    <div
                      className={`font-mono text-sm font-medium whitespace-nowrap ${
                        item.tipe === "Masuk"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.tipe === "Masuk" ? "+" : "-"}
                      {toIDR(Number(item.jumlah))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800 text-center">
              <button
                onClick={() => setSelectedDay(null)}
                className="text-sm text-neutral-400 hover:text-white w-full py-2"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
