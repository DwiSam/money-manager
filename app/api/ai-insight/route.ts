import { NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";

interface Transaction {
  tanggal: string;
  tipe: string;
  jumlah: string;
  kategori: string;
  keterangan: string;
  dompet: string;
}

export async function POST(req: Request) {
  try {
    const { transactions, currentMonth, currentYear } = await req.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 },
      );
    }

    // 1. Calculate Stats on Server Side (Safe & Fast)
    const income = transactions
      .filter((t: Transaction) => t.tipe === "Masuk")
      .reduce((acc: number, curr: Transaction) => acc + Number(curr.jumlah), 0);

    const expense = transactions
      .filter(
        (t: Transaction) =>
          t.tipe === "Keluar" &&
          !t.keterangan.toLowerCase().includes("(ke ") && // Exclude transfers
          !t.keterangan.toLowerCase().includes("(dari "),
      )
      .reduce((acc: number, curr: Transaction) => acc + Number(curr.jumlah), 0);

    const balance = income - expense;

    // Top Spending Categories
    const categories: Record<string, number> = {};
    transactions
      .filter((t: Transaction) => t.tipe === "Keluar")
      .forEach((t: Transaction) => {
        const cat = t.kategori || "Lainnya";
        if (!categories[cat]) categories[cat] = 0;
        categories[cat] += Number(t.jumlah);
      });

    const topCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, amount]) => `${name} (${Math.round(amount / 1000)}k)`)
      .join(", ");

    // 2. Construct Prompt
    const prompt = `
      Kamu adalah asisten keuangan pribadi yang lucu, cerdas, dan suportif ("Financial Bestie").
      Analisis data keuangan user untuk bulan ini (${currentMonth + 1}/${currentYear}):

      - Pemasukan: Rp ${income.toLocaleString("id-ID")}
      - Pengeluaran: Rp ${expense.toLocaleString("id-ID")}
      - Sisa (Cashflow): Rp ${balance.toLocaleString("id-ID")}
      - Top Pengeluaran: ${topCategories || "Belum ada data"}

      Berikan komentar singkat (maksimal 2-3 kalimat) tentang kondisi keuangan mereka.
      - Jika boros (Sisa < 20% Pemasukan), tegur dengan jenaka.
      - Jika hemat (Sisa > 50%), puji mereka habis-habisan.
      - Gunakan bahasa gaul Indonesia dan Jawa dengan santai, emoji, dan sapaan tuan muda.
      - JANGAN sebutkan detail angka lagi (user sudah lihat di dashboard), fokus ke *insight* atau saran saja.
    `;

    // 3. Call Gemini
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({ insight: response });
  } catch (error) {
    console.error("AI Insight Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses AI insight" },
      { status: 500 },
    );
  }
}
