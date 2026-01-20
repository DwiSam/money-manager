import { GoogleSpreadsheet } from "google-spreadsheet";

const toIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// Helper: Parse IDR string (e.g. "Rp 150.000,00" -> 150000)
// Removes thousands separator (.) and converts decimal separator (,) to (.)
export const parseIDR = (raw: string | number | undefined | null): number => {
  if (!raw) return 0;
  const str = raw.toString();
  // 1. Remove everything except digits, minuses, and commas
  const clean = str.replace(/[^0-9,-]+/g, "");
  // 2. Replace comma with dot
  const normalized = clean.replace(",", ".");
  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
};

export const checkBudgetWarning = async (
  doc: GoogleSpreadsheet,
  category: string,
  amountSpentNow: number
): Promise<string | null> => {
  try {
    const sheetAnggaran = doc.sheetsByTitle["Anggaran"];
    const sheetTransaksi = doc.sheetsByIndex[0];

    if (!sheetAnggaran || !sheetTransaksi) return null;

    // 1. Get Limit for Category
    const budgets = await sheetAnggaran.getRows();
    const budgetRow = budgets.find(
      (r) => r.get("Kategori").toLowerCase() === category.toLowerCase()
    );

    if (!budgetRow) return null; // No budget set for this category

    const limit = parseIDR(budgetRow.get("Limit"));
    if (limit === 0) return null; // No limit or invalid

    // 2. Calculate Current Usage (This Month)
    const transactions = await sheetTransaksi.getRows();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let totalUsed = 0;

    transactions.forEach((t) => {
      const tKat = (t.get("Kategori") || "Lainnya").toString();
      const tTipe = (t.get("Tipe") || "").toString();
      const tDateStr = t.get("Tanggal");
      const tAmount = parseIDR(t.get("Jumlah"));

      if (tTipe === "Keluar" && tKat.toLowerCase() === category.toLowerCase()) {
        const [d, m, y] = tDateStr.split("/").map(Number);
        if (m - 1 === currentMonth && y === currentYear) {
          totalUsed += tAmount;
        }
      }
    });

    const percentage = (totalUsed / limit) * 100;
    const remaining = limit - totalUsed;

    if (percentage >= 100) {
      return `\n\n🚨 *OVER BUDGET!* 🚨\nKategori: ${category}\nLimit: ${toIDR(
        limit
      )}\nTerpakai: ${toIDR(totalUsed)}\nOver: ${toIDR(Math.abs(remaining))}`;
    } else if (percentage >= 80) {
      return `\n\n⚠️ *WARNING BUDGET*\nKategori: ${category}\nTerpakai: ${Math.round(
        percentage
      )}%\nSisa: ${toIDR(remaining)}`;
    }

    return null;
  } catch (error) {
    console.error("Budget Check Error:", error);
    return null;
  }
};

export const getMonthlyReport = async (
  doc: GoogleSpreadsheet
): Promise<string> => {
  try {
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    let totalMasuk = 0;
    let totalKeluar = 0;
    const expenseByCategory: Record<string, number> = {};

    rows.forEach((row) => {
      const tanggal = row.get("Tanggal");
      const tipe = row.get("Tipe");
      const kategori = row.get("Kategori") || "Lainnya";
      const jumlah = parseIDR(row.get("Jumlah"));

      if (!tanggal || jumlah === 0) return;

      const [d, m, y] = tanggal.split("/").map(Number);
      if (m - 1 === currentMonth && y === currentYear) {
        if (tipe === "Masuk") {
          totalMasuk += jumlah;
        } else if (tipe === "Keluar" && kategori !== "Transfer") {
          totalKeluar += jumlah;
          expenseByCategory[kategori] =
            (expenseByCategory[kategori] || 0) + jumlah;
        }
      }
    });

    const netSavings = totalMasuk - totalKeluar;

    // Top 3 Expenses
    const sortedExpenses = Object.entries(expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    let report = `📊 *Laporan Bulan ${monthNames[currentMonth]} ${currentYear}*\n------------------\n`;
    report += `💰 Masuk: ${toIDR(totalMasuk)}\n`;
    report += `💸 Keluar: ${toIDR(totalKeluar)}\n`;
    report += `------------------\n`;
    report += `💼 *Net: ${toIDR(netSavings)}*\n\n`;

    report += `🏆 *Top 3 Pengeluaran:*\n`;
    if (sortedExpenses.length === 0) {
      report += "- Belum ada pengeluaran.";
    } else {
      sortedExpenses.forEach(([cat, amount], idx) => {
        report += `${idx + 1}. ${cat}: ${toIDR(amount)}\n`;
      });
    }

    return report;
  } catch (error) {
    console.error("Report Error:", error);
    return "❌ Gagal bikin laporan bro.";
  }
};

// --- HELPER PARSE AMOUNT WITH SUFFIX (USER INPUT) ---
export const parseAmountString = (str: string): number | null => {
  const cleanStr = str.toLowerCase().trim();

  // Regex checks for "number + suffix"
  // Supports: 10rb, 10.5jt, 100k, 1juta
  const match = cleanStr.match(
    /^([0-9]+(?:[.,][0-9]+)?)\s?(k|rb|ribu|jt|juta)$/
  );

  if (match) {
    let amountPart = match[1].replace(",", "."); // Normalized check decimal
    let multiplier = 1;

    switch (match[2]) {
      case "k":
      case "rb":
      case "ribu":
        multiplier = 1000;
        break;
      case "jt":
      case "juta":
        multiplier = 1000000;
        break;
    }

    return Math.round(parseFloat(amountPart) * multiplier);
  }

  // Fallback: Use parseIDR for everything else
  // This supports users typing "150.000" or "Rp 100k" (handled above) or "150000"
  // But wait, parseAmountString is typically for "Human Input" in Chat.
  // Standard logic:
  const cleanNumber = cleanStr.replace(/[.,]/g, "");
  if (!isNaN(Number(cleanNumber)) && cleanNumber.length > 0) {
    return Number(cleanNumber);
  }

  return null;
};
