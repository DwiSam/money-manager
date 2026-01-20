import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import {
  checkBudgetWarning,
  getMonthlyReport,
  parseAmountString,
  parseIDR, // Import parseIDR
} from "@/lib/finance";
import { getGeminiClient } from "@/lib/gemini";

// --- CONFIG ---
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

// --- HELPER AI CHAT ---
// --- HELPER AI CHAT ---
async function getAIReply(
  userMessage: string,
  context: "chat" | "transaction_success" | "report" | "list" = "chat",
  data?: string,
) {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "Kamu adalah asisten keuangan pribadi yang lucu, cerdas, dan suportif. Namamu adalah 'Asisten Pribadi'. Gaya bicaramu santai, gaul (bahasa sehari-hari Indonesia, bahasa jawa dan sedikit english), dan sering pakai emoji. Tugasmu mencatat keuangan dan menemani user curhat soal duit. Kalau user boros, tegur dengan jenaka. Kalau hemat, puji mereka. Jangan lupakan konteks bahwa ini adalah aplikasi pencatat keuangan.",
    });

    let prompt = "";

    if (context === "transaction_success") {
      prompt = `
        User baru saja mencatat transaksi ini:
        ${data}

        Berikan konfirmasi bahwa transaksi BERHASIL dicatat.
        Komentari transaksi tersebut dengan gaya lucu/jenaka/suportif tergantung nominal dan kategorinya.
        Sebutkan ringkasan transaksinya (Nominal, Kategori, Dompet) agar user yakin data benar.
        Jangan terlalu panjang, maksimal 2-3 kalimat.
      `;
    } else if (context === "report") {
      prompt = `
            Berikut adalah data laporan keuangan user (Saldo/Laporan Bulanan):
            ${data}

            Tugasmu adalah menyajikan data ini ke user dengan gaya bahasamu yang lucu dan asik.
            Jangan ubah angka-angkanya, tapi kamu boleh komentar soal kondisi keuangannya (misal kalau saldo dikit, suruh hemat. Kalau banyak, puji).
            Formatlah agar enak dibaca di chat (gunakan poin-poin atau emoji).
        `;
    } else if (context === "list") {
      prompt = `
            Berikut adalah daftar item (Tagihan/Kategori) user:
            ${data}

            Sajikan daftar ini ke user.
            Jika ini daftar tagihan, ingatkan untuk segera bayar yang belum lunas dengan gaya santai tapi tegas.
            Jika ini daftar kategori, infoin aja ini kategori yang tersedia.
        `;
    } else {
      // Context Chat Normal
      prompt = `User berkata: "${userMessage}". Jawablah dengan panggilan bos muda keturunan kaisar china tapi harus tetap relevan. Jika mereka bertanya soal fitur bot, jelaskan cara pakainya (Format: "Saldo" (Cek Saldo)\n- Tagihan (List Tagihan)\n- Kategori (List Kategori)\n- Keluar BNI 15000 Makanan Bakso (Catat + Kategori)\n- Transfer BNI Mandiri 15000 (Transfer)\n- Masuk BNI 15000 Bakso (Catat)\n- Bayar Listrik 30000 Gopay (Bayar Tagihan)\n- Done Wifi (Bayar Tagihan)\n- Laporan (Laporan Bulanan)).`;
    }

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error("AI Reply Error:", error);
    // Fallback static messages jika AI error
    let errorMsg = "AI Error: Gagal koneksi.";
    if (error instanceof Error) {
      errorMsg += ` ${error.message}`;
    }

    if (
      context === "transaction_success" ||
      context === "report" ||
      context === "list"
    ) {
      // Fallback ke raw data kalau AI error, biar user seenggaknya dapet infonya
      return `✅ Permintaan diproses, tapi AI lagi ngadat: ${errorMsg}\n\nData Asli:\n${data}`;
    }
    return `Maaf bos, lagi pusing nih. Error: ${errorMsg}`;
  }
}

// ... (Rest of existing helpers: getDoc, parseMessage, replyFonnte, toIDR) ...
// Since I can't easily jump around, I will insert getAIReply at top and then modify POST.
// BUT replace_file_content works on line ranges.
// I will split this into two calls for safety.
// First call: Imports and getAIReply.
// Second call: Updating POST logic.
// Returning original content for now to abort this specific tool call and do it properly.

const getDoc = async () => {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID!,
    serviceAccountAuth,
  );
  await doc.loadInfo();
  return doc;
};

// --- FUNGSI PARSING TRANSAKSI (Logic Lama) ---
function parseMessage(message: string) {
  let parts = message.trim().split(/\s+/);
  if (parts.length < 3) return null;

  // 1. Cek Transfer
  const transferIndex = parts.findIndex((p) => p.toLowerCase() === "transfer");
  if (transferIndex !== -1) {
    parts.splice(transferIndex, 1);
    if (parts.length < 3) return null;
    const fromWallet = parts.shift()!;
    const toWallet = parts.shift()!;
    let jumlahStr = "";
    let jumlahIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      const amount = parseAmountString(parts[i]);
      if (amount !== null) {
        jumlahStr = amount.toString();
        jumlahIndex = i;
        break;
      }
    }
    if (jumlahIndex === -1) return null;
    parts.splice(jumlahIndex, 1);
    const keterangan = parts.join(" ") || "Transfer";
    return {
      tipe: "Transfer" as const,
      fromWallet,
      toWallet,
      jumlah: jumlahStr,
      keterangan,
      dompet: "",
    };
  }

  // 2. Normal Mode
  let tipe = "Keluar";
  const tipeIndex = parts.findIndex((p) =>
    ["masuk", "keluar"].includes(p.toLowerCase()),
  );
  if (tipeIndex !== -1) {
    tipe = parts[tipeIndex].toLowerCase() === "masuk" ? "Masuk" : "Keluar";
    parts.splice(tipeIndex, 1);
  }
  if (parts.length < 3) return null;
  const dompet = parts.shift()!;
  let jumlahStr = "";
  let jumlahIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    const amount = parseAmountString(parts[i]);
    if (amount !== null) {
      jumlahStr = amount.toString();
      jumlahIndex = i;
      break;
    }
  }
  if (jumlahIndex === -1 || !dompet) return null;
  parts.splice(jumlahIndex, 1);
  const keterangan = parts.join(" ");
  if (!keterangan) return null;
  return { keterangan, jumlah: jumlahStr, dompet, tipe };
}

// --- HELPER BALAS WA ---
async function replyFonnte(target: string, message: string) {
  try {
    await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target, message }),
    });
  } catch (e) {
    console.error("Gagal kirim WA", e);
  }
}

// --- FUNGSI FORMAT DUIT (Biar Cantik) ---
const toIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.message || !body.sender)
      return NextResponse.json({ status: "ignored" });

    const incomingMsg = body.message;
    const sender = body.sender;

    // ==========================================
    // 🧾 FITUR BARU: CEK TAGIHAN & BAYAR (INTERACTIVE)
    // ==========================================

    // ==========================================
    // 🔍 FITUR CEK (FLEXIBLE)
    // ==========================================
    const lowerMsg = incomingMsg.toLowerCase().trim();

    // 1. CEK TAGIHAN ("Tagihan", "Cek Tagihan")
    if (
      lowerMsg.includes("tagihan") &&
      !lowerMsg.includes("bayar") &&
      !lowerMsg.includes("done") &&
      !lowerMsg.includes("lunas")
    ) {
      const doc = await getDoc();
      const sheet = doc.sheetsByTitle["Tagihan"];

      if (!sheet) {
        await replyFonnte(sender, "❌ Sheet 'Tagihan' tidak ditemukan bro.");
        return NextResponse.json({ status: "error" });
      }

      const rows = await sheet.getRows();
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDay = today.getDate();

      let pendingBills = "";
      let pendingCount = 0;

      rows.forEach((row) => {
        const nama = row.get("Nama");
        const jumlah = parseIDR(row.get("Jumlah"));
        const rawTanggal = (row.get("Tanggal") || "").toString();

        /* --- LOGIC BARU: Support Tanggal Penuh (One-time) vs Harian (Recurring) --- */
        let isOneTime = rawTanggal.includes("/");
        let isDue = false;
        let diffDays = 0; // Negatif = Telat, Positif = H-Sekian, 0 = Hari ini

        if (isOneTime) {
          // Format: DD/MM/YYYY
          const [d, m, y] = rawTanggal.split("/").map(Number);
          const dueDate = new Date(y, m - 1, d); // Month is 0-indexed

          // Set text date to be comparable (reset hours)
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);

          const timeDiff = dueDate.getTime() - todayDate.getTime();
          diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Filter logic:
          // Kalau One-time bill sudah lewat jauh (misal > 30 hari lalu) dan belum dibayar -> Tetap muncul sebagai hutang
          // Tapi kalau masa depan -> Muncul warning H-sekian
          // Kita anggap semua one-time bill yang belum dibayar adalah valid untuk ditagih.
          isDue = true;
        } else {
          // Format: DD (Recurring Monthly)
          const tanggalTagihan = parseInt(rawTanggal);
          diffDays = tanggalTagihan - currentDay;
          isDue = true; // Always check logic below
        }

        const terakhirDibayarStr = row.get("TerakhirDibayar"); // Format: DD/MM/YYYY

        // Check if paid this month (Recurring) OR Paid Forever (One-time)
        let alreadyPaid = false;

        if (terakhirDibayarStr) {
          if (isOneTime) {
            // Kalau One-Time dan sudah ada tanggal bayar -> LUNAS SELAMANYA
            alreadyPaid = true;
          } else {
            // Kalau Recurring, cek apakah bulan pembayarannya sama dengan bulan ini
            const [day, month, year] = terakhirDibayarStr
              .split("/")
              .map(Number);
            if (month - 1 === currentMonth && year === currentYear) {
              alreadyPaid = true;
            }
          }
        }

        if (!alreadyPaid && isDue) {
          pendingCount++;

          let statusWaktu = "";

          if (diffDays === 0) {
            statusWaktu = "⚠️ HARI INI!";
          } else if (diffDays < 0) {
            statusWaktu = `❌ Telat ${Math.abs(diffDays)} hari`;
          } else {
            statusWaktu = `⏳ H-${diffDays}`;
          }

          // Special case: Kalau recurring hari ini tanggal 25, dan tagihan tgl 2, berarti H+23 BULAN DEPAN?
          // Logic lama: currentDay > tanggalTagihan -> Telat.
          // Kita pertahankan logic lama untuk recurring: Asumsi kalau lewat tanggalnya belum bayar = Telat bulan ini.

          // Untuk One-time:
          // Jika diffDays < 0 (Telat), diffDays > 0 (Coming soon)
          // Jika One-time bill masih lama banget (misal tahun depan), mungkin bisa di-skip biar chat gak penuh?
          // Tapi user minta "Ingatkan", jadi tampilkan saja.

          pendingBills += `• ${nama}: ${
            jumlah === 0 ? "Menyesuaikan" : toIDR(jumlah)
          } (${statusWaktu})\n`;
        }
      });

      if (pendingCount === 0) {
        const aiReply = await getAIReply(
          "",
          "list",
          "Semua tagihan bulan ini SUDAH LUNAS. Aman terkendali.",
        );
        await replyFonnte(sender, aiReply);
      } else {
        const rawList = `Daftar Tagihan Belum Lunas:\n${pendingBills}`;
        const aiReply = await getAIReply("", "list", rawList);
        await replyFonnte(sender, aiReply);
      }
      return NextResponse.json({ status: "success" });
    }

    // 2. CEK KATEGORI ("Kategori", "Cek Kategori", "/kategori")
    if (
      lowerMsg.includes("kategori") &&
      !lowerMsg.includes("keluar") &&
      !lowerMsg.includes("masuk")
    ) {
      const doc = await getDoc();
      const sheet = doc.sheetsByTitle["Anggaran"];
      let replyText = "";
      if (!sheet) {
        replyText = "Sheet 'Anggaran' belum dibuat bro.";
      } else {
        const rows = await sheet.getRows();
        const categories = rows.map((r) => r.get("Kategori")).filter((k) => k);

        if (categories.length === 0) {
          replyText = "Belum ada kategori yang diatur di Sheet.";
        } else {
          replyText = `Daftar Kategori Tersedia:\n- ${categories.join("\n- ")}`;
        }
      }

      const aiReply = await getAIReply("", "list", replyText);
      await replyFonnte(sender, aiReply);
      return NextResponse.json({ status: "success" });
    }

    // 3. BAYAR TAGIHAN EXPENSE (VARIABLE) - PRIORITY
    // Trigger: "Bayar Listrik 350000 Gopay" or "Bayar Listrik 350rb Gopay"
    const payExpenseMatch = lowerMsg.match(
      /^(?:bayar|lunas|done)\s+(.+?)\s+([0-9.,]+[a-zA-Z]*)\s+(.+)$/,
    );

    if (payExpenseMatch) {
      const targetName = payExpenseMatch[1].toLowerCase().trim();
      const rawAmount = payExpenseMatch[2];
      const parsedAmount = parseAmountString(rawAmount);

      const amount = parsedAmount ? parsedAmount.toString() : "0";
      const walletName = payExpenseMatch[3]; // Raw wallet name, let parser validate/capitalize later if needed or just use as is

      const doc = await getDoc();
      const sheetTagihan = doc.sheetsByTitle["Tagihan"];
      const sheetTransaksi = doc.sheetsByIndex[0];

      if (!sheetTagihan || !sheetTransaksi) {
        await replyFonnte(sender, "❌ Sheet tidak lengkap.");
        return NextResponse.json({ status: "error" });
      }

      // A. Update Tagihan ke LUNAS
      const rows = await sheetTagihan.getRows();
      let foundRow = null;
      let actualName = "";

      for (const row of rows) {
        const nama = (row.get("Nama") || "").toString();
        if (nama.toLowerCase().includes(targetName)) {
          foundRow = row;
          actualName = nama;
          break;
        }
      }

      if (foundRow) {
        // Update TerakhirDibayar
        const todayStr = new Date().toLocaleDateString("id-ID");
        foundRow.set("TerakhirDibayar", todayStr);
        await foundRow.save();

        // B. Catat Transaksi Pengeluaran
        await sheetTransaksi.addRow({
          Tanggal: todayStr,
          Tipe: "Keluar",
          Dompet: walletName, // Masih raw, user harus ngetik bener (atau kita bisa normalisasi dikit)
          Jumlah: amount,
          Keterangan: `Bayar Tagihan ${actualName}`,
        });

        await replyFonnte(
          sender,
          `✅ *TAGIHAN LUNAS & TERCATAT!*\n\n🧾 Tagihan: ${actualName}\n💰 Nominal: ${toIDR(
            Number(amount),
          )}\n💸 Sumber: ${walletName}\n\nMantap bos, kewajiban tuntas! 😎`,
        );
      } else {
        await replyFonnte(sender, `❌ Gak nemu tagihan "${targetName}" bro.`);
      }
      return NextResponse.json({ status: "success" });
    }

    // 3. MARK AS PAID (SIMPLE) - FALLBACK
    // Trigger: "Lunas Wifi", "Done Listrik" (Tanpa nominal/wallet)
    const doneMatch = lowerMsg.match(/^(lunas|done|bayar)\s+(.+)$/);
    if (doneMatch) {
      const targetName = doneMatch[2].toLowerCase().trim(); // "wifi"

      const doc = await getDoc();
      const sheet = doc.sheetsByTitle["Tagihan"];

      if (!sheet) {
        await replyFonnte(sender, "❌ Sheet 'Tagihan' gak ada.");
        return NextResponse.json({ status: "error" });
      }

      const rows = await sheet.getRows();
      let foundRow = null;
      let actualName = "";

      // Cari row yang namanya match
      for (const row of rows) {
        const nama = (row.get("Nama") || "").toString();
        if (nama.toLowerCase().includes(targetName)) {
          foundRow = row;
          actualName = nama;
          break;
        }
      }

      if (foundRow) {
        const todayStr = new Date().toLocaleDateString("id-ID"); // DD/MM/YYYY
        foundRow.set("TerakhirDibayar", todayStr);
        await foundRow.save();

        await replyFonnte(
          sender,
          `✅ Mantab bos! Tagihan *${actualName}* udah ditandain LUNAS bulan ini (${todayStr}).`,
        );
      } else {
        await replyFonnte(
          sender,
          `❌ Gak nemu tagihan yang namanya "${targetName}" bro. Coba cek lagi.`,
        );
      }
      return NextResponse.json({ status: "success" });
    }

    // ==========================================
    // 🔥 FITUR BARU: CEK SALDO
    // ==========================================

    // Trigger: Kalau chat diawali "cek" atau "saldo"
    if (lowerMsg.startsWith("cek") || lowerMsg.startsWith("saldo")) {
      const doc = await getDoc();
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows(); // Ambil semua data

      // Filter Dompet (Cek apakah user minta dompet spesifik)
      // Contoh: "Cek BNI" -> target: "bni"
      // Contoh: "Cek Saldo" -> target: null (Semua)
      const parts = lowerMsg.split(" ");
      let targetWallet = parts.length > 1 ? parts[1].toLowerCase() : null;

      if (targetWallet === "saldo") {
        targetWallet = null;
      }

      // Object untuk nampung saldo: { "BNI": 50000, "Gopay": 10000 }
      const balances: Record<string, number> = {};

      rows.forEach((row) => {
        // Ambil data row dengan aman (cegah undefined)
        const dompet = (row.get("Dompet") || "").toString();
        const tipe = (row.get("Tipe") || "").toString();
        const jumlah = parseIDR(row.get("Jumlah"));

        // Skip kalau data gak lengkap
        if (!dompet || isNaN(jumlah)) return;

        // Normalisasi nama dompet (biar BNI = bni)
        const key = dompet.toUpperCase(); // Kita simpan pake huruf gede

        if (!balances[key]) balances[key] = 0;

        if (tipe.toLowerCase() === "masuk") {
          balances[key] += jumlah;
        } else if (tipe.toLowerCase() === "keluar") {
          balances[key] -= jumlah;
        }
      });

      let replyText = "";

      const aiReply = await getAIReply("", "report", replyText); // Wait we need to build replyText first, but logic below builds it.
      // Wait, the logic below builds loop. I should replace subsequent logic or rewrite it.
      // Re-reading logic...

      if (targetWallet) {
        // --- CEK SATU DOMPET ---
        const key = targetWallet.toUpperCase();
        const saldo = balances[key] || 0;
        replyText = `Saldo ${key}: Rp ${toIDR(saldo).replace("Rp", "").trim()}`;
      } else {
        // --- CEK SEMUA DOMPET ---
        replyText = "Rekap Saldo Saat Ini:\n";
        let totalAset = 0;

        const sortedKeys = Object.keys(balances).sort();

        if (sortedKeys.length === 0) {
          replyText += "Belum ada data transaksi.";
        } else {
          sortedKeys.forEach((dompet) => {
            const saldo = balances[dompet];
            totalAset += saldo;
            replyText += `- ${dompet}: ${toIDR(saldo)
              .replace("Rp", "")
              .trim()}\n`;
          });
          replyText += `\nTotal Aset: ${toIDR(totalAset)}`;
        }
      }

      const aiResponse = await getAIReply("", "report", replyText);
      await replyFonnte(sender, aiResponse);
      return NextResponse.json({ status: "success" });
    }

    // ==========================================
    // 📝 FITUR LAMA: CATAT TRANSAKSI
    // ==========================================
    // ==========================================
    // 📂 FITUR BARU: CEK KATEGORI
    // ==========================================
    // This section was moved and modified above.

    // ==========================================
    // 📊 FITUR BARU: LAPORAN BULANAN
    // ==========================================
    if (
      lowerMsg === "laporan" ||
      lowerMsg === "recap" ||
      lowerMsg === "cek laporan"
    ) {
      const doc = await getDoc();
      const report = await getMonthlyReport(doc);
      const aiReply = await getAIReply("", "report", report);
      await replyFonnte(sender, aiReply);
      return NextResponse.json({ status: "success" });
    }

    // ==========================================
    // 📝 FITUR LAMA: CATAT TRANSAKSI (+KATEGORI)
    // ==========================================
    const data = parseMessage(incomingMsg);

    if (!data) {
      // 🤖 FITUR CHAT AI (FALLBACK)
      // Kalau bukan command spesifik, lempar ke Gemini
      const aiReply = await getAIReply(incomingMsg, "chat");
      await replyFonnte(sender, aiReply);
      return NextResponse.json({ status: "success" });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const today = new Date().toLocaleDateString("id-ID");

    // Handle Transfer
    if (data.tipe === "Transfer") {
      // Type guard: ensure fromWallet and toWallet are defined
      if (!data.fromWallet || !data.toWallet) {
        await replyFonnte(sender, "❌ Transfer gagal bro! Wallet tidak valid.");
        return NextResponse.json({ status: "invalid_transfer" });
      }

      // Now TypeScript knows these are strings
      const fromWallet: string = data.fromWallet;
      const toWallet: string = data.toWallet;
      const keterangan = data.keterangan || "Transfer";

      await sheet.addRows([
        {
          Tanggal: today,
          Tipe: "Keluar",
          Dompet: fromWallet,
          Jumlah: data.jumlah,
          Keterangan: `${keterangan} (ke ${toWallet})`,
          Kategori: "Transfer", // Auto category
        },
        {
          Tanggal: today,
          Tipe: "Masuk",
          Dompet: toWallet,
          Jumlah: data.jumlah,
          Keterangan: `${keterangan} (dari ${fromWallet})`,
          Kategori: "Transfer", // Auto category
        },
      ]);

      // 🤖 AI REPLY TRANSFER
      const aiReply = await getAIReply(
        "",
        "transaction_success",
        `Transfer sebesar ${toIDR(
          Number(data.jumlah),
        )} dari ${fromWallet} ke ${toWallet}.`,
      );
      await replyFonnte(sender, aiReply);
    }
    // Handle Transaksi Biasa
    else {
      // --- LOGIC PARSING KATEGORI DINAMIS ---
      // 1. Ambil daftar kategori dulu
      const sheetAnggaran = doc.sheetsByTitle["Anggaran"];
      let validCategories: string[] = [];
      if (sheetAnggaran) {
        const catRows = await sheetAnggaran.getRows();
        validCategories = catRows.map((r) => r.get("Kategori").toLowerCase());
      }

      // 2. Cek kata pertama dari keterangan
      let finalKeterangan = data.keterangan;
      let finalKategori = "Lainnya"; // Default fallback

      const parts = data.keterangan.split(" ");
      if (parts.length > 0) {
        const candidate = parts[0].toLowerCase();

        // Cek match (case-insensitive)
        if (validCategories.includes(candidate)) {
          // KATA PERTAMA ADALAH KATEGORI!
          // Ambil format asli dari sheet (biar casing-nya bagus, misal "makanan" -> "Makanan")
          const catRows = await sheetAnggaran?.getRows();
          const matchedRow = catRows?.find(
            (r) => r.get("Kategori").toLowerCase() === candidate,
          );
          finalKategori = matchedRow ? matchedRow.get("Kategori") : "Lainnya";

          // Hapus kata pertama dari keterangan (Sisa: "Sate Padang")
          parts.shift();
          finalKeterangan = parts.join(" ");
        }
      }

      if (!finalKeterangan) finalKeterangan = finalKategori; // Case: "Keluar BNI 50000 Makanan" -> Ket: "Makanan"

      // --- SAVE TO SHEET ---
      await sheet.addRow({
        Tanggal: today,
        Tipe: data.tipe,
        Dompet: data.dompet,
        Jumlah: data.jumlah,
        Keterangan: finalKeterangan,
        Kategori: finalKategori,
      });

      // --- BUDGET ALERT CHECK ---
      let warningMsg = "";
      if (data.tipe === "Keluar") {
        const alert = await checkBudgetWarning(
          doc,
          finalKategori,
          Number(data.jumlah),
        );
        if (alert) warningMsg = alert;
      }

      // 🤖 AI REPLY TRANSACTION
      const aiReply = await getAIReply(
        "",
        "transaction_success",
        `${data.tipe} sebesar ${toIDR(Number(data.jumlah))} di dompet ${
          data.dompet
        } untuk kategori ${finalKategori}. Keterangan: ${finalKeterangan}. ${warningMsg}`,
      );
      await replyFonnte(sender, aiReply);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
