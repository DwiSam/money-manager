"use client";

import { useState, useMemo } from "react";
import TransactionList from "./TransactionList";
import CalendarView from "./CalendarView";
import { Transaction } from "@/types";

interface HistoryViewProps {
  data: Transaction[];
  filter: "Semua" | "Masuk" | "Keluar";
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (rowIndex: number) => void;
}

type Period = "weekly" | "monthly";
type ViewMode = "list" | "calendar";

export default function HistoryView({
  data,
  filter,
  onEdit,
  onDelete,
}: HistoryViewProps) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  // Filter data based on period (Used for LIST VIEW)
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
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Period Filter */}
        <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800 self-start sm:self-auto">
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

        {/* View Toggle */}
        <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "list"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            aria-label="List View"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "calendar"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            aria-label="Calendar View"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Date Navigation */}
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

      {/* Content View */}
      {viewMode === "list" ? (
        <TransactionList
          transactions={filteredData}
          filter={filter}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <CalendarView data={data} currentDate={currentDate} />
      )}
    </div>
  );
}
