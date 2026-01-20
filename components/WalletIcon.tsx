import Image from "next/image";

interface WalletIconProps {
  wallet: string;
  logo?: string;
  size?: number;
}

// Wallet logo mapping
const getWalletLogo = (wallet: string) => {
  const logoMap: Record<string, { type: "image" | "icon"; src?: string }> = {
    bni: { type: "image", src: "/bni.svg" },
    mandiri: { type: "image", src: "/mandiri.svg" },
    gopay: { type: "image", src: "/gopay.png" },
    dana: { type: "image", src: "/dana.svg" },
    tunai: { type: "icon" }, // Cash icon
    tabungan: { type: "icon" }, // Piggy bank icon
    "dana darurat": { type: "icon" }, // Emergency icon
  };

  return logoMap[wallet.toLowerCase()] || { type: "icon" };
};

export default function WalletIcon({
  wallet,
  logo,
  size = 48,
}: WalletIconProps) {
  const walletLogo = getWalletLogo(wallet);
  const walletLower = wallet.toLowerCase();

  return (
    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-2 overflow-hidden">
      {walletLogo.type === "image" && walletLogo.src ? (
        <Image
          src={walletLogo.src}
          alt={wallet}
          width={size}
          height={size}
          className="object-contain"
        />
      ) : // Custom SVG icons for specific wallets
      walletLower === "tunai" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-emerald-400"
        >
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ) : walletLower === "tabungan" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-blue-400"
        >
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
          <path d="M2 9v1c0 1.1.9 2 2 2h1" />
          <path d="M16 11h.01" />
        </svg>
      ) : (
        // Generic wallet icon or Dana Darurat
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-6 h-6 ${
            walletLower === "dana darurat"
              ? "text-rose-400"
              : "text-neutral-400"
          }`}
        >
          {walletLower === "dana darurat" ? (
            <>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </>
          ) : (
            // Generic wallet icon
            <>
              <path d="M20 7h-3a2 2 0 1 0-4 0H4" />
              <path d="M10 7v12" />
              <rect x="4" y="7" width="16" height="14" rx="2" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}
