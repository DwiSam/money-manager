"use client";

import { useState, useEffect } from "react";

interface TransactionFormProps {
  onSubmit: (formData: any) => Promise<void>;
  loading: boolean;
  wallets: string[];
  categories: string[]; // New Prop
}

export default function TransactionForm({
  onSubmit,
  loading,
  wallets,
  categories,
}: TransactionFormProps) {
  // Use first category as default if available, otherwise "Lainnya"
  const defaultCategory = categories.length > 0 ? categories[0] : "Lainnya";

  const [form, setForm] = useState({
    keterangan: "",
    tipe: "Keluar",
    kategori: defaultCategory,
    dompet: wallets[0] || "",
    fromWallet: wallets[0] || "",
    toWallet: wallets[1] || "",
    jumlah: "",
    tanggal: new Date().toISOString().split("T")[0],
  });

  // Effect to update default category if categories load late
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(form.kategori)) {
      setForm((prev) => ({ ...prev, kategori: categories[0] }));
    }
  }, [categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    // Reset form to defaults
    setForm({
      keterangan: "",
      tipe: "Keluar",
      kategori: categories.length > 0 ? categories[0] : "Lainnya",
      dompet: wallets[0] || "",
      fromWallet: wallets[0] || "",
      toWallet: wallets[1] || "",
      jumlah: "",
      tanggal: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Tanggal
        </label>
        <input
          type="date"
          max={new Date().toISOString().split("T")[0]}
          className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-700 [color-scheme:dark]"
          value={form.tanggal}
          onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
          required
        />
      </div>

      <div className="flex gap-3">
        <div className="space-y-1 flex-1">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Tipe
          </label>
          <select
            className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
            value={form.tipe}
            onChange={(e) => setForm({ ...form, tipe: e.target.value })}
          >
            <option value="Keluar">Pengeluaran</option>
            <option value="Masuk">Pemasukan</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>

        {/* Conditional Wallet Fields */}
        {form.tipe === "Transfer" ? (
          <>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Dari
              </label>
              <select
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                value={form.fromWallet}
                onChange={(e) =>
                  setForm({ ...form, fromWallet: e.target.value })
                }
              >
                {wallets.map((wallet) => (
                  <option key={wallet} value={wallet}>
                    {wallet}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Ke
              </label>
              <select
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                value={form.toWallet}
                onChange={(e) => setForm({ ...form, toWallet: e.target.value })}
              >
                {wallets.map((wallet) => (
                  <option key={wallet} value={wallet}>
                    {wallet}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Dompet
            </label>
            <select
              className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
              value={form.dompet}
              onChange={(e) => setForm({ ...form, dompet: e.target.value })}
            >
              {wallets.map((wallet) => (
                <option key={wallet} value={wallet}>
                  {wallet}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KATEGORI DROPDOWN (Hanya untuk Pengeluaran/Pemasukan) */}
      {form.tipe !== "Transfer" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Kategori
          </label>
          <select
            className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
          >
            {categories.length === 0 ? (
              <option value="Lainnya">Lainnya</option>
            ) : (
              categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Jumlah (Rp)
        </label>
        <input
          type="number"
          placeholder="0"
          className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-700"
          value={form.jumlah}
          onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Keterangan{" "}
          {form.tipe === "Transfer" && (
            <span className="text-neutral-600">(Opsional)</span>
          )}
        </label>
        <input
          type="text"
          placeholder={
            form.tipe === "Transfer"
              ? "Otomatis: Transfer dari ... ke ..."
              : "Contoh: Nasi Goreng Spesial"
          }
          className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-700"
          value={form.keterangan}
          onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          required={form.tipe !== "Transfer"}
        />
      </div>

      <button
        disabled={loading}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold p-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Menyimpan..." : "Simpan Transaksi"}
      </button>
    </form>
  );
}
