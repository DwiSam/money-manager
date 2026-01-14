"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Transaction } from "@/types";

// Helper to detect transfer transactions
const isTransfer = (item: any) => {
  const keterangan = item.keterangan || "";
  return keterangan.includes("(ke ") || keterangan.includes("(dari ");
};

interface ChartSectionProps {
  data: Transaction[];
  period: Period;
  currentDate: Date;
  onPeriodChange: (period: Period) => void;
  onDateChange: (date: Date) => void;
}

export type Period = "weekly" | "monthly" | "yearly";

export default function ChartSection({
  data,
  period,
  currentDate,
  onPeriodChange,
  onDateChange,
}: ChartSectionProps) {
  // Parse date from DD/MM/YYYY
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  // Process data based on selected period
  const chartData = useMemo(() => {
    if (period === "monthly") {
      // Group by day in current month
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      const filtered = data.filter((item) => {
        const itemDate = parseDate(item.tanggal);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      });

      // Get all days in month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const result = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayData = filtered.filter((item) => {
          const itemDate = parseDate(item.tanggal);
          return itemDate.getDate() === day;
        });

        const income = dayData
          .filter((item) => item.tipe === "Masuk" && !isTransfer(item))
          .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

        const expense = dayData
          .filter((item) => item.tipe === "Keluar" && !isTransfer(item))
          .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

        result.push({
          name: `${day}`,
          Pemasukan: income,
          Pengeluaran: expense,
        });
      }

      return result;
    } else if (period === "yearly") {
      // Group by month in current year
      const year = currentDate.getFullYear();

      const filtered = data.filter((item) => {
        const itemDate = parseDate(item.tanggal);
        return itemDate.getFullYear() === year;
      });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Ags",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      const result = [];

      for (let month = 0; month < 12; month++) {
        const monthData = filtered.filter((item) => {
          const itemDate = parseDate(item.tanggal);
          return itemDate.getMonth() === month;
        });

        const income = monthData
          .filter((item) => item.tipe === "Masuk" && !isTransfer(item))
          .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

        const expense = monthData
          .filter((item) => item.tipe === "Keluar" && !isTransfer(item))
          .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

        result.push({
          name: months[month],
          Pemasukan: income,
          Pengeluaran: expense,
        });
      }

      return result;
    } else {
      // Weekly: Last 7 days from current date
      const result = [];

      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() - i);

        const dayData = data.filter((item) => {
          const itemDate = parseDate(item.tanggal);
          return (
            itemDate.getDate() === targetDate.getDate() &&
            itemDate.getMonth() === targetDate.getMonth() &&
            itemDate.getFullYear() === targetDate.getFullYear()
          );
        });

        const income = dayData
          .filter((item) => item.tipe === "Masuk" && !isTransfer(item))
          .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

        const expense = dayData
          .filter((item) => item.tipe === "Keluar" && !isTransfer(item))
          .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

        result.push({
          name: `${targetDate.getDate()}/${targetDate.getMonth() + 1}`,
          Pemasukan: income,
          Pengeluaran: expense,
        });
      }

      return result;
    }
  }, [data, period, currentDate]);

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (period === "monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (period === "yearly") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (period === "yearly") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    onDateChange(newDate);
  };

  const getPeriodLabel = () => {
    if (period === "monthly") {
      return currentDate.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    } else if (period === "yearly") {
      return currentDate.getFullYear().toString();
    } else {
      const endDate = new Date(currentDate);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 6);
      return `${startDate.getDate()}/${
        startDate.getMonth() + 1
      } - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
    }
  };

  // Format Y-axis labels (compact notation)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}jt`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}rb`;
    }
    return value.toString();
  };

  // Format tooltip value (fix type issue)
  const formatTooltip = (
    value: number | string | (string | number)[] | undefined
  ) => {
    if (value === undefined) return "";
    const numValue = typeof value === "number" ? value : 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  return (
    <div className="space-y-6">
      {/* Period Filters */}
      <div className="flex items-center justify-between">
        <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
          {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                onPeriodChange(p);
                onDateChange(new Date()); // Reset to today
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {p === "weekly"
                ? "Mingguan"
                : p === "monthly"
                ? "Bulanan"
                : "Tahunan"}
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

      {/* Chart */}
      <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis
              dataKey="name"
              stroke="#a3a3a3"
              style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}
            />
            <YAxis
              stroke="#a3a3a3"
              style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}
              tickFormatter={formatYAxis}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#262626",
                border: "1px solid #404040",
                borderRadius: "8px",
                color: "#fff",
                fontFamily: "var(--font-mono)",
              }}
              formatter={formatTooltip}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Pemasukan"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncome)"
            />
            <Area
              type="monotone"
              dataKey="Pengeluaran"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
