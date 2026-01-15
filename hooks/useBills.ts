"use client";

import { useState, useEffect, useCallback } from "react";

export interface Bill {
  nama: string;
  jumlah: string;
  tanggal: string; // 1-31
  terakhirDibayar: string;
}

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bills");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBills(data);
      }
    } catch (error) {
      console.error("Failed to fetch bills", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const addBill = async (bill: Omit<Bill, "terakhirDibayar">) => {
    await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...bill }),
    });
    await fetchBills();
  };

  const updateBill = async (oldNama: string, bill: Partial<Bill>) => {
    await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        oldNama,
        newNama: bill.nama,
        jumlah: bill.jumlah,
        tanggal: bill.tanggal,
      }),
    });
    await fetchBills();
  };

  const deleteBill = async (nama: string) => {
    await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", nama }),
    });
    await fetchBills();
  };

  return {
    bills,
    loading,
    refreshBills: fetchBills,
    addBill,
    updateBill,
    deleteBill,
  };
}
