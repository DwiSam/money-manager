import { GoogleSpreadsheet } from "google-spreadsheet";

const toIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
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

    const limit = Number(budgetRow.get("Limit").replace(/[.,Rp\s]/g, ""));
    if (isNaN(limit) || limit === 0) return null; // No limit or invalid

    // 2. Calculate Current Usage (This Month)
    const transactions = await sheetTransaksi.getRows();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let totalUsed = 0;

    transactions.forEach((t) => {
      const tKat = (t.get("Kategori") || "Tak Terkategori").toString();
      const tTipe = (t.get("Tipe") || "").toString();
      const tDateStr = t.get("Tanggal");
      const tAmount = Number(
        (t.get("Jumlah") || "0").toString().replace(/[.,Rp\s]/g, "")
      );

      if (tTipe === "Keluar" && tKat.toLowerCase() === category.toLowerCase()) {
        const [d, m, y] = tDateStr.split("/").map(Number);
        if (m - 1 === currentMonth && y === currentYear) {
          totalUsed += tAmount;
        }
      }
    });

    // Note: totalUsed already includes the transaction just added because logic usually
    // runs AFTER adding row. If this runs before, we should add amountSpentNow.
    // For safety, let's assume we run this function AFTER adding the row, so totalUsed includes it.
    // BUT we need to be careful. The route adds row then calls this.
    // Creating the row in Google Sheets might take a split second to be reflect in getRows()
    // if not awaited properly or if there's rigorous caching.
    // Actually, usually Google Sheets API updates are immediate for subsequent reads.
    // However, to be safe and avoid extra API call for getRows right after addRow,
    // we can pass the "previous total" + "current amount".
    // BUT simplest is just re-fetching. Let's stick to re-fetching for accuracy or
    // calculating manually if performance allows.
    // Given the small scale, fetching is fine.

    // 3. Check Threshold
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
      const jumlah = Number(
        (row.get("Jumlah") || "0").toString().replace(/[.,Rp\s]/g, "")
      );

      if (!tanggal || isNaN(jumlah)) return;

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
