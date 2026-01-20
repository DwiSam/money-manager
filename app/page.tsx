"use client";
import { useState, useEffect, useMemo } from "react";
import SummaryCard from "@/components/SummaryCard";
import TransactionList from "@/components/TransactionList";
import PinAccess from "@/components/PinAccess";
import BottomNav from "@/components/BottomNav";
import Modal from "@/components/Modal";
import TransactionForm from "@/components/TransactionForm";
import ChartSection from "@/components/ChartSection";
import HistoryView from "@/components/HistoryView";
import ExpensePieChart from "@/components/ExpensePieChart";
import BudgetSection from "@/components/BudgetSection"; // Import BudgetSection
import CalendarView from "@/components/CalendarView"; // Import CalendarView
import WalletIcon from "@/components/WalletIcon";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets"; // Import Hook
import SettingsModal from "@/components/SettingsModal"; // Import SettingsModal
import AdjustmentModal from "@/components/AdjustmentModal"; // Import Adjustment
import CollapsibleSection from "@/components/CollapsibleSection"; // Import CollapsibleSection
import AIInsightCard from "@/components/AIInsightCard"; // Import AIInsightCard
import { Transaction } from "@/types"; // Import Transaction Type
import DeleteModal from "@/components/DeleteModal"; // Import DeleteModal

// Helper to detect transfer transactions
const isTransfer = (item: any) => {
  const keterangan = item.keterangan || "";
  return keterangan.includes("(ke ") || keterangan.includes("(dari ");
};
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("finance_app_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Custom Hooks
  const { wallets } = useWallets();
  const {
    data,
    loading,
    fetchData,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  const { budgets, categories, loading: loadingBudgets } = useBudgets(); // Use Hook

  const [filter, setFilter] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [showSecrets, setShowSecrets] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // State for Editing
  // @ts-ignore
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const confirmDelete = async () => {
    if (itemToDelete !== null) {
      await deleteTransaction(itemToDelete);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };
  // Chart period filter state (shared between ChartSection and ExpensePieChart)
  const [chartPeriod, setChartPeriod] = useState<
    "weekly" | "monthly" | "yearly"
  >("monthly");
  const [chartDate, setChartDate] = useState(new Date());

  // Mobile view state
  const [activeTab, setActiveTab] = useState<
    "home" | "history" | "wallet" | "stats"
  >("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Settings Modal State

  // Adjustment State
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustData, setAdjustData] = useState<{
    wallet: string;
    currentBalance: number;
  } | null>(null);

  const [initialFormType, setInitialFormType] = useState("Keluar"); // Correct State Definition

  // Fetch data on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Calculate current month data for Home view
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const currentMonthData = data.filter((item) => {
    if (!item.tanggal) return false; // Skip items with no date
    const itemDate = parseDate(item.tanggal);
    return (
      itemDate.getMonth() === currentMonth &&
      itemDate.getFullYear() === currentYear
    );
  });

  const monthlyIncome = currentMonthData
    .filter((item) => item.tipe === "Masuk" && !isTransfer(item))
    .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const monthlyExpense = currentMonthData
    .filter((item) => item.tipe === "Keluar" && !isTransfer(item))
    .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

  // Auto-select latest date from current month
  useEffect(() => {
    if (currentMonthData.length > 0 && !selectedDate) {
      const dates = Array.from(
        new Set(currentMonthData.map((i: any) => i.tanggal)),
      ).sort(
        (a: any, b: any) =>
          parseDate(b as string).getTime() - parseDate(a as string).getTime(),
      );
      if (dates.length > 0) setSelectedDate(dates[0] as string);
    }
  }, [currentMonthData.length]);

  /* --- STATS CALCULATION (Dynamic per Period) --- */
  const { statsIncome, statsExpense } = useMemo(() => {
    let filtered = [];
    const year = chartDate.getFullYear();
    const month = chartDate.getMonth();

    if (chartPeriod === "monthly") {
      filtered = data.filter((item) => {
        if (!item.tanggal) return false;
        const d = parseDate(item.tanggal);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    } else if (chartPeriod === "yearly") {
      filtered = data.filter((item) => {
        if (!item.tanggal) return false;
        const d = parseDate(item.tanggal);
        return d.getFullYear() === year;
      });
    } else {
      // Weekly: Last 7 days including current date
      const endDate = new Date(chartDate);
      const startDate = new Date(chartDate);
      startDate.setDate(startDate.getDate() - 6);

      // Reset hours to compare dates only
      endDate.setHours(23, 59, 59, 999);
      startDate.setHours(0, 0, 0, 0);

      filtered = data.filter((item) => {
        if (!item.tanggal) return false;
        const d = parseDate(item.tanggal);
        return d >= startDate && d <= endDate;
      });
    }

    const income = filtered
      .filter((item) => item.tipe === "Masuk" && !isTransfer(item))
      .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

    const expense = filtered
      .filter((item) => item.tipe === "Keluar" && !isTransfer(item))
      .reduce((acc, curr) => acc + Number(curr.jumlah), 0);

    return { statsIncome: income, statsExpense: expense };
  }, [data, chartPeriod, chartDate]); // Recalculate when period/date changes

  const globalIncome = data
    .filter((item) => item.tipe === "Masuk" && !isTransfer(item))
    .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const globalExpense = data
    .filter((item) => item.tipe === "Keluar" && !isTransfer(item))
    .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  const globalBalance = globalIncome - globalExpense;

  // Trend Calculation
  const { incomeTrend, expenseTrend } = useMemo(() => {
    // Current Period Stats (already calculated in statsIncome/Expense but dependent on period)
    // We specifically want MONTHLY trend for the Summary Cards

    // Current Month
    const currMonth =
      activeTab === "stats" ? chartDate.getMonth() : new Date().getMonth();
    const currYear =
      activeTab === "stats"
        ? chartDate.getFullYear()
        : new Date().getFullYear();

    // Previous Month
    const prevDate = new Date(currYear, currMonth - 1, 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    const getStats = (m: number, y: number) => {
      const filtered = data.filter((item) => {
        if (!item.tanggal) return false;
        const d = parseDate(item.tanggal);
        return d.getMonth() === m && d.getFullYear() === y;
      });
      const income = filtered
        .filter((item) => item.tipe === "Masuk" && !isTransfer(item))
        .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
      const expense = filtered
        .filter((item) => item.tipe === "Keluar" && !isTransfer(item))
        .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
      return { income, expense };
    };

    const currStats = getStats(currMonth, currYear);
    const prevStats = getStats(prevMonth, prevYear);

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      incomeTrend: calcTrend(currStats.income, prevStats.income),
      expenseTrend: calcTrend(currStats.expense, prevStats.expense),
    };
  }, [data, chartDate, activeTab]);

  // Dynamic Label for Stats
  const statsLabel = useMemo(() => {
    if (chartPeriod === "monthly") {
      return chartDate.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    } else if (chartPeriod === "yearly") {
      return chartDate.getFullYear().toString();
    } else {
      return "7 Hari Terakhir";
    }
  }, [chartPeriod, chartDate]);

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  if (!isAuthenticated) {
    return (
      <PinAccess
        onSuccess={() => {
          setIsAuthenticated(true);
          sessionStorage.setItem("finance_app_auth", "true");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-blue-500/30 pb-24">
      <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto min-h-screen relative bg-neutral-950/50 shadow-2xl md:border-x border-neutral-900">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {activeTab === "home"
                ? "Beranda"
                : activeTab === "stats"
                  ? "Ringkasan"
                  : activeTab === "wallet"
                    ? "Dompet"
                    : "History"}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Masa depan ditentukan hari ini
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-neutral-900 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="p-2 bg-neutral-900 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-all"
            >
              {showSecrets ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                  <path d="m2 2 20 20" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
          {/* HOME VIEW */}
          {/* The original line `const [initialFormType, setInitialFormType] = useState("Keluar");` was removed from here as it was misplaced. */}
          {/* If a TransactionForm component exists elsewhere, ensure it receives initialType={initialFormType} */}
          {activeTab === "home" && (
            <>
              {/* 1. Total Balance Card */}
              <div className="bg-gradient-to-br from-blue-600/50 to-blue-800/50 p-6 rounded-3xl shadow-xl shadow-blue-900/30 text-white relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -right-4 -top-2 opacity-10 rotate-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-64 h-54"
                  >
                    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                  </svg>
                </div>

                <div className="relative z-10">
                  <p className="text-blue-100 text-sm font-medium mb-2">
                    Total Saldo Aktif
                  </p>
                  <h2 className="text-4xl font-bold font-mono tracking-tight mb-6">
                    {showSecrets
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(globalBalance)
                      : "Rp •••••••"}
                  </h2>

                  <div className="flex gap-3 sm:w-[80%] lg:w-[50%]">
                    <button
                      onClick={() => {
                        setInitialFormType("Masuk");
                        setIsModalOpen(true);
                      }}
                      className="flex-1 bg-white text-blue-700 font-semibold py-2.5 px-2 rounded-xl hover:bg-neutral-100 transition-colors shadow-sm active:scale-95 text-xs"
                    >
                      Top Up
                    </button>
                    <button
                      onClick={() => {
                        setInitialFormType("Transfer");
                        setIsModalOpen(true);
                      }}
                      className="flex-1 bg-blue-500/30 border border-blue-400/30 text-white font-semibold py-2.5 px-2 rounded-xl hover:bg-blue-500/40 transition-colors shadow-sm backdrop-blur-sm active:scale-95 text-xs"
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Monthly Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Income */}
                <div className="bg-emerald-500/30 border border-emerald-500/50 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 19V5" />
                        <path d="m5 12 7-7 7 7" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-white">
                      Pemasukan
                    </span>
                  </div>
                  <span className="text-lg font-bold text-white font-mono tracking-tight">
                    {showSecrets
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(monthlyIncome)
                      : "Rp •••"}
                  </span>
                </div>

                {/* Expense */}
                <div className="bg-red-500/30 border border-red-500/50 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-red-500/20 rounded-full text-red-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14" />
                        <path d="m19 12-7 7-7-7" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-white">
                      Pengeluaran
                    </span>
                  </div>
                  <span className="text-lg font-bold text-white font-mono tracking-tight">
                    {showSecrets
                      ? new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(monthlyExpense)
                      : "Rp •••"}
                  </span>
                </div>
              </div>

              {/* 3. Active Wallets Horizontal Scroll */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-lg font-bold text-white">Dompet Aktif</h2>
                  <button
                    onClick={() => setActiveTab("wallet")}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Lihat Semua
                  </button>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6 scrollbar-hide">
                  {wallets.map((wallet) => {
                    const lowerWallet = wallet.toLowerCase();
                    let bgClass = "bg-neutral-900 border-neutral-800"; // Default

                    if (lowerWallet.includes("gopay"))
                      bgClass =
                        "bg-gradient-to-br from-[#00AED6]/50 to-[#008CAC]/50 border-[#00AED6]/0";
                    else if (lowerWallet.includes("ovo"))
                      bgClass =
                        "bg-gradient-to-br from-[#4C3494]/50 to-[#3A2875]/50 border-[#4C3494]/0";
                    else if (lowerWallet.includes("dana"))
                      bgClass =
                        "bg-gradient-to-br from-[#118EE9]/50 to-[#0B63A5]/50 border-[#118EE9]/0";
                    else if (lowerWallet.includes("shopee"))
                      bgClass =
                        "bg-gradient-to-br from-[#EE4D2D]/50 to-[#C03E24]/50 border-[#EE4D2D]/0";
                    else if (lowerWallet.includes("bca"))
                      bgClass =
                        "bg-gradient-to-br from-[#00529C]/50 to-[#003B70]/50 border-[#00529C]/0";
                    else if (lowerWallet.includes("mandiri"))
                      bgClass =
                        "bg-gradient-to-br from-[#FFB700]/50 to-[#DA9D00]/50 border-[#FFB700]/0 text-black";
                    // Mandiri yellow/gold
                    else if (lowerWallet.includes("bni"))
                      bgClass =
                        "bg-gradient-to-br from-[#F15A23]/50 to-[#C4461B]/50 border-[#F15A23]/0";
                    else if (lowerWallet.includes("bri"))
                      bgClass =
                        "bg-gradient-to-br from-[#00529C]/50 to-[#00417A]/50 border-[#00529C]/0";
                    else if (lowerWallet.includes("jago"))
                      bgClass =
                        "bg-gradient-to-br from-[#F57C00]/50 to-[#E65100]/50 border-[#F57C00]/0";
                    else if (
                      lowerWallet.includes("tunai") ||
                      lowerWallet.includes("cash")
                    )
                      bgClass =
                        "bg-gradient-to-br from-emerald-600/50 to-emerald-800/50 border-emerald-500/0";
                    else if (lowerWallet.includes("bank"))
                      bgClass =
                        "bg-gradient-to-br from-slate-700/50 to-slate-900/50 border-slate-600/0";

                    // Calculate balance for this wallet
                    const walletBalance = data
                      .filter(
                        (item) => item.dompet?.toLowerCase() === lowerWallet,
                      )
                      .reduce((acc, curr) => {
                        return (
                          acc +
                          (curr.tipe === "Masuk"
                            ? Number(curr.jumlah)
                            : -Number(curr.jumlah))
                        );
                      }, 0);

                    return (
                      <div
                        key={wallet}
                        onClick={() => {
                          setAdjustData({
                            wallet,
                            currentBalance: walletBalance,
                          });
                          setIsAdjustmentOpen(true);
                        }}
                        className={`min-w-[160px] p-4 rounded-3xl flex flex-col gap-3 relative overflow-hidden group border shadow-lg transition-all cursor-pointer hover:scale-105 ${bgClass}`}
                      >
                        {/* Background Decoration */}
                        <div className="absolute -right-1 -bottom-1 opacity-25 scale-[2.5] rotate-12 pointer-events-none grayscale brightness-200">
                          <WalletIcon wallet={wallet} size={50} />
                        </div>

                        <div className="flex items-center gap-2 z-10">
                          <span
                            className={`text-sm font-bold truncate ${
                              bgClass.includes("mandiri")
                                ? "text-neutral-900"
                                : "text-white"
                            }`}
                          >
                            {wallet}
                          </span>
                        </div>
                        <div className="z-10">
                          <p
                            className={`text-base font-bold font-mono truncate ${
                              bgClass.includes("mandiri")
                                ? "text-neutral-950"
                                : "text-white"
                            }`}
                          >
                            {showSecrets
                              ? new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0,
                                }).format(walletBalance)
                              : "Rp •••"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Add 'New Wallet' dummy card if needed, or link to create */}
                </div>
              </div>

              {/* 4. Transactions List */}
              <div className="mt-2 space-y-4">
                {/* Reuse existing logic but remove duplicate filter buttons if needed, or keep them */}
                <div className="flex items-center justify-between">
                  {/* Maybe remove header since 'Dompet Aktif' is above? Or keep 'Riwayat' */}
                </div>

                {/* Existing Transaction List Component logic */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Riwayat</h2>
                  <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                    {["Semua", "Masuk", "Keluar"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          filter === f
                            ? "bg-neutral-800 text-white shadow-sm"
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <TransactionList
                  transactions={currentMonthData}
                  filter={filter}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  showDateFilter={true}
                  onEdit={(transaction) => {
                    setEditingTransaction(transaction);
                    setInitialFormType(transaction.tipe || "Keluar");
                    setIsModalOpen(true);
                  }}
                  onDelete={(rowIndex) => {
                    setItemToDelete(rowIndex);
                    setIsDeleteModalOpen(true);
                  }}
                />
              </div>
            </>
          )}
          {/* HISTORY VIEW */}
          {activeTab === "history" && (
            <>
              <HistoryView
                data={data}
                filter={filter}
                onEdit={(transaction) => {
                  setEditingTransaction(transaction);
                  setInitialFormType(transaction.tipe || "Keluar");
                  setIsModalOpen(true);
                }}
                onDelete={(rowIndex) => {
                  setItemToDelete(rowIndex);
                  setIsDeleteModalOpen(true);
                }}
              />
            </>
          )}

          {/* WALLET VIEW */}
          {activeTab === "wallet" && (
            <>
              <div className="grid grid-cols-1 gap-3">
                {wallets.map((wallet) => {
                  const lowerWallet = wallet.toLowerCase();
                  let bgClass = "bg-neutral-900 border-neutral-800"; // Default

                  if (lowerWallet.includes("gopay"))
                    bgClass =
                      "bg-gradient-to-br from-[#00AED6]/50 to-[#008CAC]/50 border-[#00AED6]/80";
                  else if (lowerWallet.includes("ovo"))
                    bgClass =
                      "bg-gradient-to-br from-[#4C3494]/50 to-[#3A2875]/50 border-[#4C3494]/80";
                  else if (lowerWallet.includes("dana"))
                    bgClass =
                      "bg-gradient-to-br from-[#118EE9]/50 to-[#0B63A5]/50 border-[#118EE9]/80";
                  else if (lowerWallet.includes("shopee"))
                    bgClass =
                      "bg-gradient-to-br from-[#EE4D2D]/50 to-[#C03E24]/50 border-[#EE4D2D]/80";
                  else if (lowerWallet.includes("bca"))
                    bgClass =
                      "bg-gradient-to-br from-[#00529C]/50 to-[#003B70]/50 border-[#00529C]/80";
                  else if (lowerWallet.includes("mandiri"))
                    bgClass =
                      "bg-gradient-to-br from-[#FFB700]/50 to-[#DA9D00]/50 border-[#FFB700]/80 text-black";
                  // Mandiri yellow/gold
                  else if (lowerWallet.includes("bni"))
                    bgClass =
                      "bg-gradient-to-br from-[#F15A23]/50 to-[#C4461B]/50 border-[#F15A23]/80";
                  else if (lowerWallet.includes("bri"))
                    bgClass =
                      "bg-gradient-to-br from-[#00529C]/50 to-[#00417A]/50 border-[#00529C]/80";
                  else if (lowerWallet.includes("jago"))
                    bgClass =
                      "bg-gradient-to-br from-[#F57C00]/50 to-[#E65100]/50 border-[#F57C00]/80";
                  else if (
                    lowerWallet.includes("tunai") ||
                    lowerWallet.includes("cash")
                  )
                    bgClass =
                      "bg-gradient-to-br from-emerald-600/50 to-emerald-800/50 border-emerald-500/80";
                  else if (lowerWallet.includes("bank"))
                    bgClass =
                      "bg-gradient-to-br from-slate-700/50 to-slate-900/50 border-slate-600/80";

                  const walletBalance = data
                    .filter(
                      (item) =>
                        item.dompet?.toLowerCase() === wallet.toLowerCase(),
                    )
                    .reduce((acc, curr) => {
                      return (
                        acc +
                        (curr.tipe === "Masuk"
                          ? Number(curr.jumlah)
                          : -Number(curr.jumlah))
                      );
                    }, 0);

                  return (
                    <div
                      key={wallet}
                      onClick={() => {
                        setAdjustData({
                          wallet,
                          currentBalance: walletBalance,
                        });
                        setIsAdjustmentOpen(true);
                      }}
                      className={`p-4 rounded-xl flex items-center justify-between transition-all relative overflow-hidden shadow-lg border cursor-pointer hover:scale-[1.02] active:scale-95 ${bgClass}`}
                    >
                      {/* Background Decoration */}
                      <div className="absolute -right-6 -bottom-6 opacity-10 scale-[3] rotate-12 pointer-events-none grayscale brightness-200">
                        <WalletIcon wallet={wallet} size={50} />
                      </div>

                      <div className="flex items-center gap-3 z-10">
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                          <WalletIcon wallet={wallet} />
                        </div>
                        <span
                          className={`text-base font-bold ${
                            bgClass.includes("mandiri")
                              ? "text-neutral-900"
                              : "text-white"
                          }`}
                        >
                          {wallet}
                        </span>
                      </div>
                      <span
                        className={`font-bold font-mono text-lg z-10 ${
                          bgClass.includes("mandiri")
                            ? "text-neutral-950"
                            : "text-white"
                        }`}
                      >
                        {showSecrets
                          ? new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(walletBalance)
                          : "Rp •••••••"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {/* STATS VIEW */}
          {activeTab === "stats" && (
            <>
              <div className="grid grid-cols-1 gap-4 pb-24">
                {/* AI Insight Card (New) */}
                <AIInsightCard
                  transactions={currentMonthData}
                  currentDate={chartDate} // Use chartDate filter period? Or consistently use current real month? Summary uses currentMonthData usually?
                  // Actually standard Summary uses statsIncome/statsExpense which respects chartPeriod.
                  // For "Monthly Insight", let's stick to the selected month if period is monthly.
                  visible={activeTab === "stats" && chartPeriod === "monthly"}
                />

                {/* 1. Ringkasan Saldo Section */}
                <CollapsibleSection title={`Ringkasan (${statsLabel})`}>
                  <div className="grid grid-cols-1 gap-4">
                    <SummaryCard
                      title="Pemasukan"
                      amount={statsIncome}
                      type="income"
                      visible={showSecrets}
                      trend={
                        chartPeriod === "monthly" ? incomeTrend : undefined
                      }
                    />
                    <SummaryCard
                      title="Pengeluaran"
                      amount={statsExpense}
                      type="expense"
                      visible={showSecrets}
                      trend={
                        chartPeriod === "monthly" ? expenseTrend : undefined
                      }
                    />
                    <SummaryCard
                      title="Total Saldo (All Time)"
                      amount={globalBalance}
                      type="balance"
                      visible={showSecrets}
                    />
                  </div>
                </CollapsibleSection>

                {/* 2. Budget Section */}
                <CollapsibleSection title="Anggaran Bulanan">
                  <BudgetSection
                    transactions={data}
                    currentDate={chartDate}
                    budgets={budgets}
                    loading={loadingBudgets}
                  />
                </CollapsibleSection>

                {/* 3. Analitik Grafik */}
                <CollapsibleSection title="Analitik Grafik">
                  <ChartSection
                    data={data}
                    period={chartPeriod}
                    currentDate={chartDate}
                    onPeriodChange={setChartPeriod}
                    onDateChange={setChartDate}
                  />
                </CollapsibleSection>

                {/* 4. Pie Chart */}
                <CollapsibleSection title="Breakdown Pengeluaran">
                  <ExpensePieChart
                    data={data}
                    period={chartPeriod}
                    currentDate={chartDate}
                  />
                </CollapsibleSection>

                {/* 5. Calendar View (Only for Monthly view) */}
                {chartPeriod === "monthly" && (
                  <CollapsibleSection title="Kalender Transaksi">
                    <CalendarView data={data} currentDate={chartDate} />
                  </CollapsibleSection>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          title={editingTransaction ? "Edit Transaksi" : "Catat Transaksi Baru"}
        >
          <TransactionForm
            onSubmit={(formData) => {
              if (editingTransaction && editingTransaction.rowIndex) {
                return updateTransaction(
                  editingTransaction.rowIndex,
                  formData,
                ).then(() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                });
              } else {
                return createTransaction(formData, () => setIsModalOpen(false));
              }
            }}
            loading={loading}
            wallets={wallets}
            categories={categories}
            initialType={initialFormType}
            initialData={editingTransaction}
          />
        </Modal>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Balance Adjustment Modal */}
        {adjustData && (
          <AdjustmentModal
            isOpen={isAdjustmentOpen}
            onClose={() => {
              setIsAdjustmentOpen(false);
              setAdjustData(null);
            }}
            walletName={adjustData.wallet}
            currentBalance={adjustData.currentBalance}
            loading={loading}
            onConfirm={(diff) => {
              // Create correction transaction
              const today = new Date().toLocaleDateString("id-ID"); // DD/MM/YYYY
              const isExpense = diff < 0;
              const payload = {
                tanggal: today,
                tipe: isExpense ? "Keluar" : "Masuk",
                jumlah: Math.abs(diff).toString(),
                kategori: "Adjustment", // Or "Penyesuaian"
                keterangan: "Penyesuaian Saldo (Manual)",
                dompet: adjustData.wallet,
              };

              createTransaction(payload, () => {
                setIsAdjustmentOpen(false);
                setAdjustData(null);
              });
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
          loading={loading}
        />

        {/* Bottom Nav */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddClick={() => setIsModalOpen(true)}
        />
      </div>
    </main>
  );
}
