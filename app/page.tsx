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
import WalletIcon from "@/components/WalletIcon";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets"; // Import Hook
import SettingsModal from "@/components/SettingsModal"; 

// Helper to detect transfer transactions
const isTransfer = (item: any) => {
  const keterangan = item.keterangan || "";
  return keterangan.includes("(ke ") || keterangan.includes("(dari ");
};
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); /

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("finance_app_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Custom Hooks
  const { wallets } = useWallets();
  const { data, loading, fetchData, createTransaction } = useTransactions();
  const { budgets, categories, loading: loadingBudgets } = useBudgets(); // Use Hook

  const [filter, setFilter] = useState<"Semua" | "Masuk" | "Keluar">("Semua");
  const [showSecrets, setShowSecrets] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

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
        new Set(currentMonthData.map((i: any) => i.tanggal))
      ).sort(
        (a: any, b: any) =>
          parseDate(b as string).getTime() - parseDate(a as string).getTime()
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
          {activeTab === "home" && (
            <>
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg shadow-blue-900/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Total Saldo Aktif
                </p>
                <h2 className="text-3xl font-bold font-mono tracking-tight">
                  {showSecrets
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(globalBalance)
                    : "Rp •••••••"}
                </h2>
                <div className="mt-4 flex gap-2">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded text-blue-50">
                    {currentMonthData.length} Transaksi Bulan Ini
                  </span>
                </div>
              </div>

              {/* Transactions */}
              <div className="space-y-4">
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
                />
              </div>
            </>
          )}

          {/* HISTORY VIEW */}
          {activeTab === "history" && (
            <>
              <HistoryView data={data} filter={filter} />
            </>
          )}

          {/* WALLET VIEW */}
          {activeTab === "wallet" && (
            <>
              <div className="grid grid-cols-1 gap-3">
                {wallets.map((wallet) => {
                  const walletBalance = data
                    .filter(
                      (item) =>
                        item.dompet?.toLowerCase() === wallet.toLowerCase()
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
                      className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-center justify-between hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <WalletIcon wallet={wallet} />
                        <span className="text-base font-medium text-neutral-300">
                          {wallet}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-lg text-white">
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
              <div className="grid grid-cols-1 gap-4">
                <SummaryCard
                  title={`Pemasukan (${statsLabel})`}
                  amount={statsIncome}
                  type="income"
                  visible={showSecrets}
                />
                <SummaryCard
                  title={`Pengeluaran (${statsLabel})`}
                  amount={statsExpense}
                  type="expense"
                  visible={showSecrets}
                />
                <SummaryCard
                  title="Total Saldo (All Time)"
                  amount={globalBalance}
                  type="balance"
                  visible={showSecrets}
                />
              </div>
              {/* Budget Section */}
              <BudgetSection
                transactions={data}
                currentDate={chartDate}
                budgets={budgets}
                loading={loadingBudgets}
              />
              {/* Chart Analytics */}
              <ChartSection
                data={data}
                period={chartPeriod}
                currentDate={chartDate}
                onPeriodChange={setChartPeriod}
                onDateChange={setChartDate}
              />
              {/* Expense Breakdown */}
              <ExpensePieChart
                data={data}
                period={chartPeriod}
                currentDate={chartDate}
              />
            </>
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Catat Transaksi Baru"
        >
          <TransactionForm
            onSubmit={(formData) =>
              createTransaction(formData, () => setIsModalOpen(false))
            }
            loading={loading}
            wallets={wallets}
            categories={categories} // Pass dynamic categories
          />
        </Modal>

         {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
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
