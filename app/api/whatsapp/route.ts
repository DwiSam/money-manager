import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { checkBudgetWarning, getMonthlyReport } from "@/lib/finance";

// --- CONFIG ---
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

const getDoc = async () => {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SHEET_ID!,
    serviceAccountAuth
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
      const cleaned = parts[i].replace(/[.,]/g, "");
      if (!isNaN(Number(cleaned)) && cleaned.length > 0) {
        jumlahStr = cleaned;
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
    ["masuk", "keluar"].includes(p.toLowerCase())
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
    const cleaned = parts[i].replace(/[.,]/g, "");
    if (!isNaN(Number(cleaned)) && cleaned.length > 0) {
      jumlahStr = cleaned;
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
        Authorization: FONNTE_TOKEN,
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
        const jumlah = row.get("Jumlah");
        const tanggalTagihan = parseInt(row.get("Tanggal"));
        const terakhirDibayarStr = row.get("TerakhirDibayar"); // Format: DD/MM/YYYY

        // Check if paid this month
        let alreadyPaid = false;
        if (terakhirDibayarStr) {
          const [day, month, year] = terakhirDibayarStr.split("/").map(Number);
          if (month - 1 === currentMonth && year === currentYear) {
            alreadyPaid = true;
          }
        }

        if (!alreadyPaid) {
          pendingCount++;
          // Kalkulasi hari (H-3, H+1, Hari ini)
          let statusWaktu = "";
          if (tanggalTagihan === currentDay) {
            statusWaktu = "⚠️ HARI INI!";
          } else if (currentDay > tanggalTagihan) {
            statusWaktu = `❌ Telat ${currentDay - tanggalTagihan} hari`;
          } else {
            statusWaktu = `⏳ H-${tanggalTagihan - currentDay}`;
          }

          pendingBills += `• ${nama}: ${
            Number(jumlah) === 0 ? "Menyesuaikan" : toIDR(Number(jumlah))
          } (${statusWaktu})\n`;
        }
      });

      if (pendingCount === 0) {
        await replyFonnte(
          sender,
          "🎉 Mantap bos! Semua tagihan bulan ini udah LUNAS. Tidur nyenyak."
        );
      } else {
        await replyFonnte(
          sender,
          `🧾 *TAGIHAN BELUM DIBAYAR*\n\n${pendingBills}\nKetik "Done [Nama]" kalau udah dibayar.\nContoh: "Done Wifi"`
        );
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
      if (!sheet) {
        await replyFonnte(sender, "❌ Sheet 'Anggaran' belum dibuat bro.");
        return NextResponse.json({ status: "error" });
      }
      const rows = await sheet.getRows();
      const categories = rows.map((r) => r.get("Kategori")).filter((k) => k);

      if (categories.length === 0) {
        await replyFonnte(sender, "📂 Belum ada kategori yang diatur.");
      } else {
        await replyFonnte(
          sender,
          `📂 *Kategori Tersedia:*\n\n- ${categories.join("\n- ")}`
        );
      }
      return NextResponse.json({ status: "success" });
    }

    // 3. BAYAR TAGIHAN EXPENSE (VARIABLE) - PRIORITY
    // Trigger: "Bayar Listrik 350000 Gopay"
    const payExpenseMatch = lowerMsg.match(
      /^(?:bayar|lunas|done)\s+(.+?)\s+(\d+)\s+(.+)$/ // [command, nama, jumlah, wallet]
    );

    if (payExpenseMatch) {
      const targetName = payExpenseMatch[1].toLowerCase().trim();
      const amount = payExpenseMatch[2];
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
            Number(amount)
          )}\n💸 Sumber: ${walletName}\n\nMantap bos, kewajiban tuntas! 😎`
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
          `✅ Mantab bos! Tagihan *${actualName}* udah ditandain LUNAS bulan ini (${todayStr}).`
        );
      } else {
        await replyFonnte(
          sender,
          `❌ Gak nemu tagihan yang namanya "${targetName}" bro. Coba cek lagi.`
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
        const rawJumlah = (row.get("Jumlah") || "0")
          .toString()
          .replace(/[.,Rp\s]/g, "");
        const jumlah = parseFloat(rawJumlah);

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

      if (targetWallet) {
        // --- CEK SATU DOMPET ---
        const key = targetWallet.toUpperCase();
        const saldo = balances[key] || 0;
        replyText = `💳 *Saldo ${key}*\nRp ${toIDR(saldo)
          .replace("Rp", "")
          .trim()}`;
      } else {
        // --- CEK SEMUA DOMPET ---
        replyText = "📊 *Rekap Saldo Saat Ini*\n------------------\n";
        let totalAset = 0;

        const sortedKeys = Object.keys(balances).sort();

        if (sortedKeys.length === 0) {
          replyText += "Belum ada data transaksi bro.";
        } else {
          sortedKeys.forEach((dompet) => {
            const saldo = balances[dompet];
            totalAset += saldo;
            // Tampilkan hanya yg saldonya bukan 0 (opsional, biar rapi)
            replyText += `• ${dompet}: ${toIDR(saldo)
              .replace("Rp", "")
              .trim()}\n`;
          });
          replyText += `------------------\n💰 *Total Aset: ${toIDR(
            totalAset
          )}*`;
        }
      }

      await replyFonnte(sender, replyText);
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
      await replyFonnte(sender, report);
      return NextResponse.json({ status: "success" });
    }

    // ==========================================
    // 📝 FITUR LAMA: CATAT TRANSAKSI (+KATEGORI)
    // ==========================================
    const data = parseMessage(incomingMsg);

    if (!data) {
      // Kalau bukan format cek saldo DAN bukan format transaksi -> Error
      await replyFonnte(
        sender,
        `❌ Ngetik apa itu bos, nii kalo mau nyuruh gua!\n\nPerintah:\n- "Saldo" (Cek Saldo)\n- "Tagihan" (List Tagihan)\n- "Kategori" (List Kategori)\n- "Keluar BNI 15000 Makanan Bakso" (Catat + Kategori)\n- "Transfer BNI Mandiri 15000" (Transfer)\n- "Masuk BNI 15000 Bakso" (Catat)\n- "Bayar Listrik 30000 Gopay" (Bayar Tagihan)\n- "Done Wifi (Bayar Tagihan)"\n- "Laporan" (Laporan Bulanan)`
      );
      return NextResponse.json({ status: "invalid_format" });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const today = new Date().toLocaleDateString("id-ID");
    let replyMessage = "";

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
      replyMessage = `✅ Widiihh, banyak duit nii bisa transfer wkwk\n💸 ${toIDR(
        Number(data.jumlah)
      )}\n📤 ${fromWallet} ➡ 📥 ${toWallet}`;
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
      let finalKategori = "Tak Terkategori"; // Default fallback

      const parts = data.keterangan.split(" ");
      if (parts.length > 0) {
        const candidate = parts[0].toLowerCase();

        // Cek match (case-insensitive)
        if (validCategories.includes(candidate)) {
          // KATA PERTAMA ADALAH KATEGORI!
          // Ambil format asli dari sheet (biar casing-nya bagus, misal "makanan" -> "Makanan")
          const catRows = await sheetAnggaran?.getRows();
          const matchedRow = catRows?.find(
            (r) => r.get("Kategori").toLowerCase() === candidate
          );
          finalKategori = matchedRow
            ? matchedRow.get("Kategori")
            : "Tak Terkategori";

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
          Number(data.jumlah)
        );
        if (alert) warningMsg = alert;
      }

      const formattedAmount = toIDR(Number(data.jumlah));
      replyMessage =
        data.tipe === "Masuk"
          ? `Mantap bos, tambah terus!\n\n💰 ${formattedAmount}\n📥 Dompet: ${data.dompet}\n📂 Kategori: ${finalKategori}\n📝 "${finalKeterangan}"\n\nSaldo ${data.dompet} nambah nii! 🎉`
          : `Jajan teruss!!!\n\n💰 ${formattedAmount}\n📤 Dompet: ${data.dompet}\n📂 Kategori: ${finalKategori}\n📝 "${finalKeterangan}"\n\nSaldo ${data.dompet} lu tinggal dikit anjir.${warningMsg}`;
    }

    await replyFonnte(sender, replyMessage);
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
