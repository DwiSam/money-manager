"use client";

interface BottomNavProps {
  activeTab: "home" | "history" | "wallet" | "stats";
  onTabChange: (tab: "home" | "history" | "wallet" | "stats") => void;
  onAddClick: () => void;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onAddClick,
}: BottomNavProps) {
  return (
    <div className="fixed max-w-md md:max-w-4xl lg:max-w-6xl mx-auto bottom-0 left-0 right-0 bg-neutral-950/80 backdrop-blur-lg border-t border-neutral-800 px-4 py-3 safe-area-pb z-40">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Home Button */}
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "home"
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === "home" ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] font-medium">Beranda</span>
        </button>

        {/* History Button */}
        <button
          onClick={() => onTabChange("history")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "history"
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === "history" ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
          </svg>
          <span className="text-[10px] font-medium">Riwayat</span>
        </button>

        {/* Add Button (Floating) */}
        <div className="relative -top-6">
          <button
            onClick={onAddClick}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-900/30 transition-transform active:scale-90 border-4 border-neutral-950"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>

        {/* Wallet Button */}
        <button
          onClick={() => onTabChange("wallet")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "wallet"
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === "wallet" ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
          <span className="text-[10px] font-medium">Dompet</span>
        </button>

        {/* Stats Button */}
        <button
          onClick={() => onTabChange("stats")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "stats"
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={activeTab === "stats" ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <span className="text-[10px] font-medium">Ringkasan</span>
        </button>
      </div>
    </div>
  );
}
