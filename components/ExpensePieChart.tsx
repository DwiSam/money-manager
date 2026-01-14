"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface Transaction {
  tanggal: string;
  tipe: string;
  jumlah: string;
  kategori: string;
  keterangan: string;
  dompet: string;
}

interface ExpensePieChartProps {
  data: Transaction[];
  period: "weekly" | "monthly" | "yearly";
  currentDate: Date;
}

// Helper to detect transfer transactions
const isTransfer = (item: any) => {
  const keterangan = item.keterangan || "";
  return keterangan.includes("(ke ") || keterangan.includes("(dari ");
};

// Color palette for categories
const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // violet
];

export default function ExpensePieChart({
  data,
  period,
  currentDate,
}: ExpensePieChartProps) {
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const chartData = useMemo(() => {
    // Filter by period first
    let filteredData = data;

    if (period === "monthly") {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      filteredData = data.filter((item) => {
        if (!item.tanggal) return false;
        const itemDate = parseDate(item.tanggal);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      });
    } else if (period === "yearly") {
      const year = currentDate.getFullYear();
      filteredData = data.filter((item) => {
        if (!item.tanggal) return false;
        const itemDate = parseDate(item.tanggal);
        return itemDate.getFullYear() === year;
      });
    } else {
      // Weekly: Last 7 days from current date
      const endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      filteredData = data.filter((item) => {
        if (!item.tanggal) return false;
        const itemDate = parseDate(item.tanggal);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Filter only expense transactions (excluding transfers)
    const expenses = filteredData.filter(
      (item) => item.tipe === "Keluar" && !isTransfer(item)
    );

    // Group by keterangan and sum
    const grouped = expenses.reduce((acc, curr) => {
      const category = curr.kategori || "Lainnya";
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(curr.jumlah);
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by value
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 categories
  }, [data, period, currentDate]);

  const formatRupiah = (value: number) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}rb`;
    }
    return `Rp ${value}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium text-sm">{payload[0].name}</p>
          <p className="text-emerald-400 font-bold font-mono text-base">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          Breakdown Pengeluaran
        </h3>
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">Belum ada data pengeluaran</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">
        Breakdown Pengeluaran (Top 10)
      </h3>
      <ResponsiveContainer
        width="100%"
        height={Math.max(350, chartData.length * 40 + 40)}
      >
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              paddingTop: "20px",
              maxHeight: "150px",
              overflowY: "auto",
            }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-neutral-300 text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
