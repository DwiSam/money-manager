"use client";

import { useState } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { useBills, Bill } from "@/hooks/useBills";
import { useWallets } from "@/hooks/useWallets";
import DeleteModal from "./DeleteModal"; // Import DeleteModal

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"anggaran" | "tagihan" | "dompet">(
    "anggaran",
  );

  const {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    loading: loadingBudgets,
  } = useBudgets();

  const {
    bills,
    addBill,
    updateBill,
    deleteBill,
    loading: loadingBills,
  } = useBills();

  const {
    walletData: wallets,
    addWallet,
    updateWallet,
    deleteWallet,
    loading: loadingWallets,
  } = useWallets();

  // Form States
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(""); // Kategori or Nama

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<
    "budget" | "bill" | "wallet" | null
  >(null);
  const [deleteId, setDeleteId] = useState("");

  const handleConfirmDelete = async () => {
    if (!deleteType || !deleteId) return;

    try {
      if (deleteType === "budget") {
        await deleteBudget(deleteId);
      } else if (deleteType === "bill") {
        await deleteBill(deleteId);
      } else if (deleteType === "wallet") {
        await deleteWallet(deleteId);
      }
    } finally {
      setDeleteModalOpen(false);
      setDeleteType(null);
      setDeleteId("");
    }
  };

  const [budgetForm, setBudgetForm] = useState({ kategori: "", limit: "" });
  const [billForm, setBillForm] = useState({
    nama: "",
    jumlah: "",
    tanggal: "",
  });
  const [billType, setBillType] = useState<"Rutin" | "Sekali">("Rutin"); // New State
  const [walletForm, setWalletForm] = useState({ nama: "", logo: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editMode) {
        await updateBudget(editingId, budgetForm);
      } else {
        await addBudget(budgetForm);
      }
      setBudgetForm({ kategori: "", limit: "" });
      setEditMode(false);
      setEditingId("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editMode) {
        await updateBill(editingId, billForm);
      } else {
        await addBill(billForm);
      }
      setBillForm({ nama: "", jumlah: "", tanggal: "" });
      setEditMode(false);
      setEditingId("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editMode) {
        await updateWallet(editingId, walletForm);
      } else {
        await addWallet(walletForm);
      }
      setWalletForm({ nama: "", logo: "" });
      setEditMode(false);
      setEditingId("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (num: string) => {
    return new Intl.NumberFormat("id-ID").format(Number(num));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur-xl rounded-t-2xl z-10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Kelola Data
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-400"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => {
              setActiveTab("anggaran");
              setEditMode(false);
            }}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "anggaran"
                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Anggaran
          </button>
          <button
            onClick={() => {
              setActiveTab("tagihan");
              setEditMode(false);
            }}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "tagihan"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Tagihan
          </button>
          <button
            onClick={() => {
              setActiveTab("dompet");
              setEditMode(false);
            }}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "dompet"
                ? "border-purple-500 text-purple-400 bg-purple-500/5"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Dompet
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "anggaran" ? (
            <div className="space-y-6">
              {/* Form Budget */}
              <form
                onSubmit={handleBudgetSubmit}
                className="bg-neutral-800/50 p-4 rounded-xl space-y-4 border border-neutral-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                      Kategori
                    </label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="Contoh: Makanan"
                      value={budgetForm.kategori}
                      onChange={(e) =>
                        setBudgetForm({
                          ...budgetForm,
                          kategori: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                      Limit (IDR)
                    </label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/50 outline-none"
                      placeholder="1000000"
                      type="number"
                      inputMode="decimal"
                      value={
                        budgetForm.limit
                          ? new Intl.NumberFormat("id-ID").format(
                              Number(budgetForm.limit),
                            )
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setBudgetForm({ ...budgetForm, limit: val });
                      }}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setBudgetForm({ kategori: "", limit: "" });
                      }}
                      className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : editMode
                        ? "Update Budget"
                        : "Tambah Budget"}
                  </button>
                </div>
              </form>

              {/* List Budget */}
              {loadingBudgets ? (
                <div className="text-center text-neutral-500">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {budgets.map((item) => (
                    <div
                      key={item.kategori}
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-neutral-200">
                          {item.kategori}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono">
                          Limit: Rp {formatRupiah(item.limit)}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditMode(true);
                            setEditingId(item.kategori);
                            setBudgetForm({
                              kategori: item.kategori || "",
                              limit: item.limit || "",
                            });
                          }}
                          className="p-2 bg-neutral-800 hover:bg-blue-900/30 text-neutral-400 hover:text-blue-400 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteType("budget");
                            setDeleteId(item.kategori);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 bg-neutral-800 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 rounded-lg"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "tagihan" ? (
            <div className="space-y-6">
              {/* Form Tagihan */}
              <form
                onSubmit={handleBillSubmit}
                className="bg-neutral-800/50 p-4 rounded-xl space-y-4 border border-neutral-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider block mb-2">
                      Tipe Tagihan
                    </label>
                    <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-700 w-fit">
                      <button
                        type="button"
                        onClick={() => setBillType("Rutin")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          billType === "Rutin"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Rutin (Bulanan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillType("Sekali")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          billType === "Sekali"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Sekali Bayar
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                        Nama Tagihan
                      </label>
                      <input
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        placeholder={
                          billType === "Rutin"
                            ? "Contoh: WiFi Rumah"
                            : "Contoh: Pinjaman Teman"
                        }
                        value={billForm.nama}
                        onChange={(e) =>
                          setBillForm({ ...billForm, nama: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                        Jumlah (IDR)
                      </label>
                      <input
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        placeholder="0 (Jika variabel)"
                        type="number"
                        inputMode="decimal"
                        value={
                          billForm.jumlah
                            ? new Intl.NumberFormat("id-ID").format(
                                Number(billForm.jumlah),
                              )
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setBillForm({ ...billForm, jumlah: val });
                        }}
                        required
                      />
                      {billForm.jumlah === "0" && (
                        <p className="text-xs text-neutral-500 text-right">
                          (Menyesuaikan)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                      Tanggal Jatuh Tempo
                    </label>
                    {billType === "Rutin" ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="31"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        placeholder="Tanggal (1-31)"
                        value={billForm.tanggal}
                        onChange={(e) =>
                          setBillForm({ ...billForm, tanggal: e.target.value })
                        }
                        required
                      />
                    ) : (
                      <input
                        type="date"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none text-white scheme-dark"
                        value={
                          // Convert DD/MM/YYYY back to YYYY-MM-DD for input
                          billForm.tanggal.includes("/")
                            ? billForm.tanggal.split("/").reverse().join("-")
                            : ""
                        }
                        onChange={(e) => {
                          // Save as DD/MM/YYYY
                          const dateVal = e.target.value; // YYYY-MM-DD
                          if (dateVal) {
                            const [y, m, d] = dateVal.split("-");
                            setBillForm({
                              ...billForm,
                              tanggal: `${d}/${m}/${y}`,
                            });
                          } else {
                            setBillForm({ ...billForm, tanggal: "" });
                          }
                        }}
                        required
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setBillForm({ nama: "", jumlah: "", tanggal: "" });
                      }}
                      className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : editMode
                        ? "Update Tagihan"
                        : "Tambah Tagihan"}
                  </button>
                </div>
              </form>

              {/* List Bills */}
              {loadingBills ? (
                <div className="text-center text-neutral-500">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {bills.map((item) => (
                    <div
                      key={item.nama}
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-neutral-200">
                          {item.nama}
                        </p>
                        <div className="flex gap-3 text-xs text-neutral-500 font-mono mt-1">
                          <span>
                            Rp{" "}
                            {item.jumlah === "0"
                              ? "Menyesuaikan"
                              : formatRupiah(item.jumlah)}
                          </span>
                          <span className="text-neutral-700">•</span>
                          <span>Tanggal {item.tanggal}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditMode(true);
                            setEditingId(item.nama);
                            // Detect Type
                            const isOneTime = item.tanggal.includes("/");
                            setBillType(isOneTime ? "Sekali" : "Rutin");
                            setBillForm({
                              nama: item.nama || "",
                              jumlah: item.jumlah || "",
                              tanggal: item.tanggal || "",
                            });
                          }}
                          className="p-2 bg-neutral-800 hover:bg-emerald-900/30 text-neutral-400 hover:text-emerald-400 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteType("bill");
                            setDeleteId(item.nama);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 bg-neutral-800 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 rounded-lg"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form Wallet */}
              <form
                onSubmit={handleWalletSubmit}
                className="bg-neutral-800/50 p-4 rounded-xl space-y-4 border border-neutral-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                      Nama Dompet
                    </label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none"
                      placeholder="Contoh: BCA, OVO, Tunai"
                      value={walletForm.nama}
                      onChange={(e) =>
                        setWalletForm({ ...walletForm, nama: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">
                      Logo (Optional)
                    </label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none"
                      placeholder="Contoh: bca.svg"
                      value={walletForm.logo}
                      onChange={(e) =>
                        setWalletForm({ ...walletForm, logo: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setWalletForm({ nama: "", logo: "" });
                      }}
                      className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : editMode
                        ? "Update Dompet"
                        : "Tambah Dompet"}
                  </button>
                </div>
              </form>

              {/* List Wallets */}
              {loadingWallets ? (
                <div className="text-center text-neutral-500">Loading...</div>
              ) : (
                <div className="space-y-3">
                  {wallets.map((item) => (
                    <div
                      key={item.nama}
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition-colors group"
                    >
                      <div>
                        <p className="font-medium text-neutral-200">
                          {item.nama}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono">
                          Logo: {item.logo || "-"}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditMode(true);
                            setEditingId(item.nama);
                            setWalletForm({
                              nama: item.nama || "",
                              logo: item.logo || "",
                            });
                          }}
                          className="p-2 bg-neutral-800 hover:bg-purple-900/30 text-neutral-400 hover:text-purple-400 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteType("wallet");
                            setDeleteId(item.nama);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 bg-neutral-800 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 rounded-lg"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteType(null);
          setDeleteId("");
        }}
        onConfirm={handleConfirmDelete}
        title={`Hapus ${deleteType === "budget" ? "Anggaran" : deleteType === "bill" ? "Tagihan" : "Dompet"}?`}
        message={`Apakah Anda yakin ingin menghapus ${deleteType === "budget" ? "anggaran" : deleteType === "bill" ? "tagihan" : "dompet"} ini?`}
      />
    </div>
  );
}
