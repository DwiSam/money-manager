"use client";

import { useState, useEffect } from "react";

interface WalletData {
  nama: string;
  logo?: string;
}

export function useWallets() {
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallets");
      const data = await res.json();
      if (data.wallets) {
        setWalletData(data.wallets);
      }
    } catch (err) {
      console.error("Failed to fetch wallets:", err);
      setError("Failed to load wallets");
      setWalletData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // Extract wallet names for dropdown usage
  const wallets = walletData.map((w) => w.nama);

  const addWallet = async (wallet: { nama: string; logo?: string }) => {
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...wallet }),
    });
    await fetchWallets();
  };

  const updateWallet = async (oldNama: string, wallet: Partial<WalletData>) => {
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        oldNama,
        newNama: wallet.nama,
        logo: wallet.logo,
      }),
    });
    await fetchWallets();
  };

  const deleteWallet = async (nama: string) => {
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", nama }),
    });
    await fetchWallets();
  };

  return {
    wallets, // string[] for dropdowns
    walletData, // full objects with logo info
    loading,
    error,
    refetch: fetchWallets,
    addWallet,
    updateWallet,
    deleteWallet,
  };
}
