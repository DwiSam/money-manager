"use client";

import { useEffect, useState } from "react";

import { Budget } from "@/hooks/useBudgets";

interface Transaction {
  kategori?: string;
  jumlah: string;
  tipe: string;
  tanggal: string;
  keterangan?: string; // Added to fix lint
}

interface BudgetSectionProps {
  transactions: Transaction[];
  currentDate: Date; // To filter current month expenses
  budgets: Budget[]; // New Prop
  loading?: boolean;
}

export default function BudgetSection({
  transactions,
  currentDate,
  budgets,
  loading = false,
}: BudgetSectionProps) {
  // Calculate generic spending per category for CURRENT MONTH
  const spendingByCategory = transactions.reduce((acc, curr) => {
    // Only current month
    const [day, month, year] = curr.tanggal.split("/").map(Number);
    // Note: Transaction date format is DD/MM/YYYY. JS Date month is 0-indexed.
    // currentDate month is 0-indexed.

    // Check Date
    const txDate = new Date(year, month - 1, day);
    if (
      txDate.getMonth() !== currentDate.getMonth() ||
      txDate.getFullYear() !== currentDate.getFullYear()
    ) {
      return acc;
    }

    // Only Expenses (Keluar)
    // FIX: Only exclude if Category is explicitly "Transfer", don't rely on description
    if (curr.tipe !== "Keluar" || curr.kategori?.toLowerCase() === "transfer")
      return acc;

    // Normalize Category (Trim + Title Case for display, or maintain strict if user prefers)
    // Better: Normalize to lowercase for counting, then map back?
    // Simplified: Just use the string as is but trim it.

    // Matched against Budget Keys (which are also case sensitive usually)
    // Let's rely on exact match for now but trim whitespace.
    const category = (curr.kategori || "Lainnya").trim();

    // Handle case insensitivity by finding the matching budget key
    const budgetKey =
      budgets.find((b) => b.kategori.toLowerCase() === category.toLowerCase())
        ?.kategori || category;

    if (!acc[budgetKey]) acc[budgetKey] = 0;
    acc[budgetKey] += Number(curr.jumlah);

    return acc;
  }, {} as Record<string, number>);

  const toIDR = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}jt`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`;
    return num.toString();
  };

  if (loading)
    return (
      <div className="p-6 text-center text-neutral-500">Memuat Anggaran...</div>
    );

  if (budgets.length === 0) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Anggaran Bulanan
        </h3>
        <p className="text-neutral-500 text-sm">
          Belum ada data anggaran. Buat sheet "Anggaran" (Kolom: Kategori,
          Limit) untuk mulai tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl mb-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">Anggaran Bulanan</h3>

      <div className="space-y-4">
        {budgets.map((budget) => {
          const limit = Number(budget.limit);
          const used = spendingByCategory[budget.kategori] || 0;
          const percentage = Math.min((used / limit) * 100, 100);

          let colorClass = "bg-emerald-500";
          if (percentage >= 80) colorClass = "bg-amber-500";
          if (percentage >= 100) colorClass = "bg-red-500";

          return (
            <div key={budget.kategori} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-300 font-medium">
                  {budget.kategori}
                </span>
                <span className="text-neutral-400 font-mono">
                  <span
                    className={
                      percentage >= 100
                        ? "text-red-400 font-bold"
                        : "text-white"
                    }
                  >
                    {toIDR(used)}
                  </span>
                  {" / "}
                  {toIDR(limit)}
                </span>
              </div>
              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorClass} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
