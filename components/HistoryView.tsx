"use client";

import { useState, useMemo } from "react";
import TransactionList from "./TransactionList";
import { Transaction } from "@/types";

interface HistoryViewProps {
  data: Transaction[];
  filter: "Semua" | "Masuk" | "Keluar";
}

type Period = "weekly" | "monthly";

export default function HistoryView({ data, filter }: HistoryViewProps) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  // Filter data based on period
  const filteredData = useMemo(() => {
    if (period === "monthly") {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      return data.filter((item) => {
        const itemDate = parseDate(item.tanggal);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      });
    } else {
      // Weekly: Last 7 days from current date
      const endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      return data.filter((item) => {
        const itemDate = parseDate(item.tanggal);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
  }, [data, period, currentDate]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (period === "monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const getPeriodLabel = () => {
    if (period === "monthly") {
      return currentDate.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    } else {
      const endDate = new Date(currentDate);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 6);
      return `${startDate.getDate()}/${
        startDate.getMonth() + 1
      } - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {(["weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setCurrentDate(new Date());
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {p === "weekly" ? "Mingguan" : "Bulanan"}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-white">{getPeriodLabel()}</h3>

        <button
          onClick={handleNext}
          className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Transaction List */}
      <TransactionList transactions={filteredData} filter={filter} />
    </div>
  );
}
