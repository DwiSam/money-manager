import React from "react";

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string; // Allow custom styling
}

export default function CategoryIcon({
  category,
  size = 24,
  className = "",
}: CategoryIconProps) {
  const lowerCat = category.toLowerCase();

  const getIcon = () => {
    // GAJI / INCOME
    if (lowerCat.includes("gaji") || lowerCat.includes("income")) {
      return (
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      );
    }
    // MAKANAN
    if (lowerCat.includes("makan")) {
      return (
        <>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </>
      );
    }
    // BELANJA / SHOPPING
    if (lowerCat.includes("belanja") || lowerCat.includes("shopping")) {
      return (
        <>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </>
      );
    }
    // JAJAN / SNACKS (Coffee/Ice Cream)
    if (lowerCat.includes("jajan") || lowerCat.includes("snack")) {
      return (
        <>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="8" />
          <line x1="10" x2="10" y1="2" y2="8" />
          <line x1="14" x2="14" y1="2" y2="8" />
        </>
      );
    }
    // TRANSPORTASI
    if (lowerCat.includes("transport") || lowerCat.includes("bensin")) {
      return (
        <>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v3c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </>
      );
    }
    // KONTRAKAN / RENT / HOME
    if (lowerCat.includes("kontrakan") || lowerCat.includes("sewa rumah")) {
      return (
        <>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </>
      );
    }
    // TABUNGAN / SAVINGS
    if (lowerCat.includes("tabung")) {
      return (
        <>
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
          <path d="M2 9v1c0 1.1.9 2 2 2h1" />
          <path d="M16 11h.01" />
        </>
      );
    }
    // LISTRIK
    if (lowerCat.includes("listrik") || lowerCat.includes("token")) {
      return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />;
    }
    // TAGIHAN / BILLS
    if (lowerCat.includes("tagihan") || lowerCat.includes("cicilan")) {
      return (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </>
      );
    }
    // INTERNET / WIFI
    if (
      lowerCat.includes("internet") ||
      lowerCat.includes("wifi") ||
      lowerCat.includes("pulsa")
    ) {
      return (
        <>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" x2="12.01" y1="20" y2="20" />
        </>
      );
    }
    // TRANSFER
    if (lowerCat.includes("transfer") || lowerCat.includes("kirim")) {
      return (
        <>
          <path d="m16 6 4 14" />
          <path d="M12 6v14" />
          <path d="M8 8v12" />
          <path d="M4 4v16" />
        </>
      );
    }
    // BONUS / GIFT
    if (
      lowerCat.includes("bonus") ||
      lowerCat.includes("hadiah") ||
      lowerCat.includes("thr")
    ) {
      return (
        <>
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect width="20" height="5" x="2" y="7" />
          <line x1="12" x2="12" y1="22" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </>
      );
    }
    // ADJUSTMENT
    if (lowerCat.includes("adjust") || lowerCat.includes("sesuai")) {
      return (
        <>
          <line x1="4" x2="20" y1="21" y2="21" />
          <polygon points="4 21 4 14 10 14 10 21" />
          <polygon points="14 21 14 14 20 14 20 21" />
          <polygon points="9 14 9 7 15 7 15 14" />
        </>
      );
    }
    // DEFAULT / LAINNYA
    return <circle cx="12" cy="12" r="10" />;
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {getIcon()}
    </svg>
  );
}
