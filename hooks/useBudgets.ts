"use client";

import { useState, useEffect, useCallback } from "react";

export interface Budget {
  kategori: string;
  limit: string;
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/budget");
      const data = await res.json();

      if (Array.isArray(data)) {
        setBudgets(data);
        // Extract categories and sort them
        const cats = data
          .map((b: Budget) => b.kategori)
          .filter((k) => k) // Remove empty
          .sort();

        setCategories(cats);
      }
    } catch (error) {
      console.error("Failed to fetch budgets", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const addBudget = async (budget: { kategori: string; limit: string }) => {
    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...budget }),
    });
    await fetchBudgets();
  };

  const updateBudget = async (oldKategori: string, budget: Partial<Budget>) => {
    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        oldKategori,
        newKategori: budget.kategori,
        limit: budget.limit,
      }),
    });
    await fetchBudgets();
  };

  const deleteBudget = async (kategori: string) => {
    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", kategori }),
    });
    await fetchBudgets();
  };

  return {
    budgets,
    categories,
    loading,
    refreshBudgets: fetchBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
