"use client";

import { useState } from "react";

export function useTransactions() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sheet");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleCreateTransaction = async (
    formData: any,
    onClose: () => void
  ) => {
    setLoading(true);
    const [year, month, day] = formData.tanggal.split("-");
    // Fix: Remove leading zeros to match inconsistent standard (e.g. 1/1/2026 vs 01/01/2026) -> force standard 1/1/2026
    const formattedDate = `${parseInt(day)}/${parseInt(month)}/${year}`;

    // Handle Transfer
    if (formData.tipe === "Transfer") {
      const keterangan = formData.keterangan || "Transfer";

      const outgoingTransaction = {
        tanggal: formattedDate,
        tipe: "Keluar",
        dompet: formData.fromWallet,
        jumlah: formData.jumlah,
        keterangan: `${keterangan} (ke ${formData.toWallet})`,
      };

      const incomingTransaction = {
        tanggal: formattedDate,
        tipe: "Masuk",
        dompet: formData.toWallet,
        jumlah: formData.jumlah,
        keterangan: `${keterangan} (dari ${formData.fromWallet})`,
      };

      // 1. Update UI Optimistic
      setData((prevData) => [
        ...prevData,
        outgoingTransaction,
        incomingTransaction,
      ]);
      onClose();

      try {
        // 2. Send both transactions as array
        const payload = [outgoingTransaction, incomingTransaction];

        console.log("📤 Sending transfer payload:", payload);

        const response = await fetch("/api/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        console.log("📥 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`Gagal ke API: ${response.status}`);
        }

        const result = await response.json();
        console.log("🎉 Transfer sukses tersimpan sekaligus!", result);
      } catch (error) {
        console.error("❌ Error during transfer:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        alert(
          `Gagal menyimpan transfer: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        // Rollback
        setData((prev) =>
          prev.filter(
            (item) =>
              item !== outgoingTransaction && item !== incomingTransaction
          )
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Handle normal transaction
      const newItem = {
        ...formData,
        kategori: formData.kategori || "Lainnya", // Include category, fallback to "Lainnya"
        tanggal: formattedDate,
      };

      setData((prevData) => [...prevData, newItem]);
      onClose();

      try {
        console.log("📤 Sending transaction:", newItem);

        const response = await fetch("/api/sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });

        console.log("📥 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`Gagal ke API: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Transaction saved!", result);
      } catch (error) {
        console.error("Error bro:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        alert(
          `Gagal menyimpan: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setData((prev) => prev.filter((item) => item !== newItem));
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    data,
    loading,
    fetchData,
    createTransaction: handleCreateTransaction,
  };
}
