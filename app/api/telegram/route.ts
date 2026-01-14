import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import {
  checkBudgetWarning,
  getMonthlyReport,
  parseAmountString,
} from "@/lib/finance";

// --- CONFIG ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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

// --- FUNGSI PARSING TRANSAKSI (Same as WhatsApp) ---
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

// --- HELPER FORMAT RUPIAH ---
const toIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// --- HELPER REPLY TELEGRAM ---
async function replyTelegram(chatId: string | number, message: string) {
  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );
  } catch (e) {
    console.error("Gagal kirim Telegram", e);
  }
}

// --- MAIN WEBHOOK HANDLER ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📨 Telegram webhook:", JSON.stringify(body, null, 2));

    // Extract message from Telegram update
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true }); // Ignore non-text messages
    }

    const chatId = message.chat.id;
    const text = message.text;
    const lowerMsg = text.toLowerCase().trim();

    // ==========================================
    // 🔍 FITUR CEK (FLEXIBLE)
    // ==========================================

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
        await replyTelegram(chatId, "❌ Sheet 'Tagihan' tidak ditemukan bro.");
        return NextResponse.json({ ok: true });
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
        const terakhirDibayarStr = row.get("TerakhirDibayar");

        let alreadyPaid = false;
        if (terakhirDibayarStr) {
          const [day, month, year] = terakhirDibayarStr.split("/").map(Number);
          if (month - 1 === currentMonth && year === currentYear) {
            alreadyPaid = true;
          }
        }

        if (!alreadyPaid) {
          pendingCount++;
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
        await replyTelegram(
          chatId,
          "🎉 Mantap bos! Semua tagihan bulan ini udah LUNAS. Tidur nyenyak."
        );
      } else {
        await replyTelegram(
          chatId,
          `🧾 *TAGIHAN BELUM DIBAYAR*\n\n${pendingBills}\nKetik "Done [Nama]" kalau udah dibayar.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // 2. CEK KATEGORI
    if (
      lowerMsg.includes("kategori") &&
      !lowerMsg.includes("keluar") &&
      !lowerMsg.includes("masuk")
    ) {
      const doc = await getDoc();
      const sheet = doc.sheetsByTitle["Anggaran"];
      let replyText = "📂 *Kategori Tersedia:*";

      if (!sheet) {
        replyText = "❌ Sheet 'Anggaran' belum dibuat bro.";
      } else {
        const rows = await sheet.getRows();
        const categories = rows.map((r) => r.get("Kategori")).filter((k) => k);
        if (categories.length === 0) {
          replyText = "📂 Belum ada kategori yang diatur.";
        } else {
          replyText += `\n\n- ${categories.join("\n- ")}`;
        }
      }

      await replyTelegram(chatId, replyText);
      return NextResponse.json({ ok: true });
    }

    // 3. BAYAR TAGIHAN EXPENSE (VARIABLE)
    const payExpenseMatch = lowerMsg.match(
      /^(?:bayar|lunas|done)\s+(.+?)\s+([0-9.,]+[a-zA-Z]*)\s+(.+)$/
    );

    if (payExpenseMatch) {
      const targetName = payExpenseMatch[1].toLowerCase().trim();
      const rawAmount = payExpenseMatch[2];
      const parsedAmount = parseAmountString(rawAmount);

      const amount = parsedAmount ? parsedAmount.toString() : "0";
      const walletName = payExpenseMatch[3];

      const doc = await getDoc();
      const sheetTagihan = doc.sheetsByTitle["Tagihan"];
      const sheetTransaksi = doc.sheetsByIndex[0];

      if (!sheetTagihan || !sheetTransaksi) {
        await replyTelegram(chatId, "❌ Sheet tidak lengkap.");
        return NextResponse.json({ ok: true });
      }

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
        const todayStr = new Date().toLocaleDateString("id-ID");
        foundRow.set("TerakhirDibayar", todayStr);
        await foundRow.save();

        await sheetTransaksi.addRow({
          Tanggal: todayStr,
          Tipe: "Keluar",
          Dompet: walletName,
          Jumlah: amount,
          Keterangan: `Bayar Tagihan ${actualName}`,
          Kategori: "Tagihan",
        });

        await replyTelegram(
          chatId,
          `✅ *TAGIHAN LUNAS & TERCATAT!*\n\n🧾 Tagihan: ${actualName}\n💰 Nominal: ${toIDR(
            Number(amount)
          )}\n💸 Sumber: ${walletName}`
        );
      } else {
        await replyTelegram(chatId, `❌ Gak nemu tagihan "${targetName}" bro.`);
      }
      return NextResponse.json({ ok: true });
    }

    // 4. MARK AS PAID (SIMPLE)
    const doneMatch = lowerMsg.match(/^(lunas|done|bayar)\s+(.+)$/);
    if (doneMatch) {
      const targetName = doneMatch[2].toLowerCase().trim();

      const doc = await getDoc();
      const sheet = doc.sheetsByTitle["Tagihan"];

      if (!sheet) {
        await replyTelegram(chatId, "❌ Sheet 'Tagihan' gak ada.");
        return NextResponse.json({ ok: true });
      }

      const rows = await sheet.getRows();
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
        const todayStr = new Date().toLocaleDateString("id-ID");
        foundRow.set("TerakhirDibayar", todayStr);
        await foundRow.save();

        await replyTelegram(
          chatId,
          `✅ Mantab bos! *${actualName}* udah LUNAS bulan ini (${todayStr}).`
        );
      } else {
        await replyTelegram(chatId, `❌ Gak nemu tagihan "${targetName}" bro.`);
      }
      return NextResponse.json({ ok: true });
    }

    // 5. CEK SALDO
    const isSaldo =
      lowerMsg.includes("saldo") ||
      lowerMsg.includes("balance") ||
      lowerMsg === "cek";
    if (isSaldo) {
      const doc = await getDoc();
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();

      const balances: Record<string, number> = {};

      rows.forEach((row) => {
        const dompet = (row.get("Dompet") || "").toString();
        const tipe = (row.get("Tipe") || "").toString();
        // Parse jumlah safely like in WA route
        const rawJumlah = (row.get("Jumlah") || "0")
          .toString()
          .replace(/[.,Rp\s]/g, "");
        const jumlah = parseFloat(rawJumlah);

        if (dompet && !isNaN(jumlah)) {
          const key = dompet.toUpperCase().trim();

          if (!balances[key]) {
            balances[key] = 0;
          }

          if (tipe.toLowerCase() === "masuk") {
            balances[key] += jumlah;
          } else if (tipe.toLowerCase() === "keluar") {
            balances[key] -= jumlah;
          }
        }
      });

      let replyText = "📊 *Rekap Saldo Saat Ini*\n------------------\n";
      let totalAset = 0;

      const sortedKeys = Object.keys(balances).sort();

      if (sortedKeys.length === 0) {
        replyText += "Belum ada data transaksi bro.";
      } else {
        sortedKeys.forEach((dompet) => {
          const saldo = balances[dompet];
          totalAset += saldo;
          replyText += `• ${dompet}: ${toIDR(saldo)
            .replace("Rp", "")
            .trim()}\n`;
        });
        replyText += `------------------\n💰 *Total Aset: ${toIDR(totalAset)}*`;
      }

      await replyTelegram(chatId, replyText);
      return NextResponse.json({ ok: true });
    }

    // ... existing imports ...

    // Inside POST
    // ...

    // ==========================================
    // 📊 FITUR BARU: LAPORAN BULANAN
    // ==========================================
    if (
      lowerMsg === "laporan" ||
      lowerMsg === "recap" ||
      lowerMsg === "cek laporan" ||
      lowerMsg === "/laporan"
    ) {
      const doc = await getDoc();
      const report = await getMonthlyReport(doc);
      await replyTelegram(chatId, report);
      return NextResponse.json({ ok: true });
    }

    // Parse transaksi
    const data = parseMessage(text);

    // ...

    if (!data) {
      await replyTelegram(
        chatId,
        `❌ Ngetik apa itu bos, nii kalo mau nyuruh gua!\n\nPerintah:\n- "Saldo" (Cek Saldo)\n- "Tagihan" (List Tagihan)\n- "Kategori" (List Kategori)\n- "Keluar BNI 15000 Makanan Bakso" (Catat + Kategori)\n- "Transfer BNI Mandiri 15000" (Transfer)\n- "Masuk BNI 15000 Bakso" (Catat)\n- "Bayar Listrik 30000 Gopay" (Bayar Tagihan)\n- "Done Wifi (Bayar Tagihan)"\n- "Laporan" (Laporan Bulanan)`
      );
      return NextResponse.json({ ok: true });
    }

    // Get Google Sheets
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const today = new Date().toLocaleDateString("id-ID");

    let replyMessage = "";

    // Handle Transfer
    if (data.tipe === "Transfer") {
      const { fromWallet, toWallet, jumlah, keterangan } = data;

      // Type guard
      if (typeof fromWallet !== "string" || typeof toWallet !== "string") {
        await replyTelegram(chatId, "❌ Error: Invalid transfer wallets");
        return NextResponse.json({ ok: true });
      }

      await sheet.addRows([
        {
          Tanggal: today,
          Tipe: "Keluar",
          Dompet: fromWallet,
          Jumlah: jumlah,
          Keterangan: `${keterangan} (ke ${toWallet})`,
          Kategori: "Transfer",
        },
        {
          Tanggal: today,
          Tipe: "Masuk",
          Dompet: toWallet,
          Jumlah: jumlah,
          Keterangan: `${keterangan} (dari ${fromWallet})`,
          Kategori: "Transfer",
        },
      ]);

      replyMessage = `✅ *Transfer berhasil dicatat!*\n💸 ${toIDR(
        Number(jumlah)
      )}\n📤 ${fromWallet} ➡ 📥 ${toWallet}`;
    } else {
      // --- LOGIC PARSING KATEGORI DINAMIS (TELEGRAM) ---
      const sheetAnggaran = doc.sheetsByTitle["Anggaran"];
      let validCategories: string[] = [];
      if (sheetAnggaran) {
        const catRows = await sheetAnggaran.getRows();
        validCategories = catRows.map((r) => r.get("Kategori").toLowerCase());
      }

      let finalKeterangan = data.keterangan;
      let finalKategori = "Lainnya";

      const parts = data.keterangan.split(" ");
      if (parts.length > 0) {
        const candidate = parts[0].toLowerCase();

        if (validCategories.includes(candidate)) {
          // Match found
          const catRows = await sheetAnggaran?.getRows();
          const matchedRow = catRows?.find(
            (r) => r.get("Kategori").toLowerCase() === candidate
          );
          finalKategori = matchedRow ? matchedRow.get("Kategori") : "Lainnya";

          parts.shift();
          finalKeterangan = parts.join(" ");
        }
      }

      if (!finalKeterangan) finalKeterangan = finalKategori;

      // Normal transaction
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

      const emoji = data.tipe === "Masuk" ? "💰" : "💸";
      replyMessage = `✅ *Transaksi berhasil dicatat!*\n${emoji} ${
        data.tipe
      }: ${toIDR(Number(data.jumlah))}\n📍 Dompet: ${
        data.dompet
      }\n📂 Kategori: ${finalKategori}\n📝 ${finalKeterangan}${warningMsg}`;
    }

    await replyTelegram(chatId, replyMessage);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Telegram webhook error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
