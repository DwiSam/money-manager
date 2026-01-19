"use client";

import { useMemo } from "react";
import { Transaction } from "@/types";

interface CalendarViewProps {
  data: Transaction[];
  currentDate: Date;
}

export default function CalendarView({ data, currentDate }: CalendarViewProps) {
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
  // Add empty slots for days before start of month
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

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Kalender Transaksi
      </h3>

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
              className={`aspect-square rounded-lg border border-neutral-800/50 p-1 relative flex flex-col items-center justify-start ${
                isToday ? "bg-blue-500/10 border-blue-500/50" : "bg-neutral-900"
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

              {/* Optional: Show minimal amount if space allows */}
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
  );
}
