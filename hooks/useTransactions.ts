"use client";

import { useState } from "react";

export function useTransactions() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sheet");
      const json = await res.json();

      if (Array.isArray(json)) {
        setData(json);
      } else {
        console.error("API returned invalid format:", json);
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleCreateTransaction = async (
    formData: any,
    onClose: () => void,
  ) => {
    setLoading(true);
    let formattedDate = formData.tanggal;

    // Check if format is YYYY-MM-DD (standard HTML date input)
    if (formData.tanggal.includes("-")) {
      const parts = formData.tanggal.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        formattedDate = `${parseInt(day)}/${parseInt(month)}/${year}`;
      }
    }
    // Else assume it is already DD/MM/YYYY or compatible string

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
          }`,
        );
        // Rollback
        setData((prev) =>
          prev.filter(
            (item) =>
              item !== outgoingTransaction && item !== incomingTransaction,
          ),
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
          }`,
        );
        setData((prev) => prev.filter((item) => item !== newItem));
      } finally {
        setLoading(false);
      }
    }
  };

  const updateTransaction = async (rowIndex: number, formData: any) => {
    setLoading(true);
    let formattedDate = formData.tanggal;
    if (formData.tanggal.includes("-")) {
      const parts = formData.tanggal.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        formattedDate = `${parseInt(day)}/${parseInt(month)}/${year}`;
      }
    }

    const updatedItem = {
      ...formData,
      tanggal: formattedDate,
      kategori: formData.kategori || "Lainnya",
    };

    try {
      const response = await fetch("/api/sheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex, data: updatedItem }),
      });

      if (!response.ok) throw new Error("Gagal update data");

      // Refetch to ensure sync
      await fetchData();
    } catch (error) {
      console.error("Update error:", error);
      alert("Gagal update transaksi");
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (rowIndex: number) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    setLoading(true);

    try {
      const response = await fetch("/api/sheet", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex }),
      });

      if (!response.ok) throw new Error("Gagal hapus data");

      // Optimistic update or Refetch
      setData((prev) => prev.filter((item) => item.rowIndex !== rowIndex));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal hapus transaksi");
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    fetchData,
    createTransaction: handleCreateTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
