import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkBudgetWarning,
  getMonthlyReport,
  parseAmountString,
  parseIDR,
} from "@/lib/finance";

// --- CONFIG ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
import { getGeminiClient } from "@/lib/gemini";

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

// --- HELPER AI CHAT ---
// --- HELPER AI CHAT ---
async function getAIReply(
  userMessage: string,
  context: "chat" | "transaction_success" | "report" | "list" = "chat",
  data?: string
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

// --- HELPER REPLY TELEGRAM ---
async function replyTelegram(chatId: string | number, message: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    console.log(
      `📤 Sending Telegram message to ${chatId}: ${message.substring(0, 50)}...`
    );

    // Force Plain Text for debugging purposes
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Telegram Send Failed:", errText);
    } else {
      console.log("✅ Telegram Sent Successfully");
    }
  } catch (e) {
    console.error("❌ Gagal kirim Telegram (Network Error):", e);
  }
}

// --- MAIN WEBHOOK HANDLER ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📨 Telegram webhook:", JSON.stringify(body, null, 2));

    // Extract message from Telegram update
    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;

    // ==========================================
    // 📸 FITUR AI VISION (IMAGE HANDLER)
    // ==========================================
    if (message.photo) {
      await replyTelegram(chatId, "👀 Sedang menganalisa struk belanja...");

      try {
        // 1. Ambil File ID resolusi terbesar (array terakhir)
        const fileId = message.photo[message.photo.length - 1].file_id;

        // 2. Dapatkan URL File dari Telegram
        const fileRes = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const fileData = await fileRes.json();
        const filePath = fileData.result.file_path;
        const imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

        // 3. Download Gambar jadi Buffer
        const imageResp = await fetch(imageUrl);
        const imageArrayBuffer = await imageResp.arrayBuffer();

        // 4. Siapkan Prompt untuk Gemini
        // Gunakan model eksperimental terbaru atau fallback ke Pro jika Flash bermasalah
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });
        const prompt = `
          Analisa gambar struk ini. Ekstrak data dalam format JSON murni:
          {
            "merchant": "Nama Toko",
            "total": 15000 (angka saja),
            "kategori": "Makanan/Belanja/Transport/Tagihan/Lainnya (Pilih satu yg paling cocok)"
          }
          Jika nama toko tidak jelas, tebak saja atau pakai "Unknown".
          Kategori harus general.
          HANYA return JSON string, tanpa markdown block.
        `;

        // 5. Kirim ke Gemini
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: Buffer.from(imageArrayBuffer).toString("base64"),
              mimeType: "image/jpeg",
            },
          },
        ]);

        const responseText = result.response.text();
        // Bersihkan markdown jika Gemini iseng kasih ```json
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const dataStruk = JSON.parse(cleanJson);

        // 6. Catat ke Google Sheet
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const today = new Date().toLocaleDateString("id-ID");

        // Default Dompet = "Tunai" (Karena AI gabisa nebak lu bayar pake apa)
        // Lu bisa edit codingan ini kalau mau defaultnya "GoPay"
        const defaultDompet = "Tunai";

        await sheet.addRow({
          Tanggal: today,
          Tipe: "Keluar",
          Dompet: defaultDompet,
          Jumlah: dataStruk.total,
          Keterangan: `${dataStruk.merchant} (Auto Scan)`,
          Kategori: dataStruk.kategori,
        });

        // AI Confirmation for Receipt
        const aiReply = await getAIReply(
          "",
          "transaction_success",
          `Pengeluaran di ${dataStruk.merchant} sebesar ${toIDR(
            Number(dataStruk.total)
          )} untuk kategori ${dataStruk.kategori} pake ${defaultDompet}.`
        );
        await replyTelegram(chatId, aiReply);
      } catch (error: any) {
        console.error("AI Error:", error);
        let errorMessage = "Gagal baca struk.";
        if (error.message) errorMessage += ` Error: ${error.message}`;

        await replyTelegram(
          chatId,
          `❌ ${errorMessage}\n\nTip: Pastikan gambarnya jelas atau coba input manual aja bro.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (!message || !message.text) {
      return NextResponse.json({ ok: true }); // Ignore non-text messages
    }

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
        const jumlah = parseIDR(row.get("Jumlah"));
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
            jumlah === 0 ? "Menyesuaikan" : toIDR(jumlah)
          } (${statusWaktu})\n`;
        }
      });

      if (pendingCount === 0) {
        const aiReply = await getAIReply(
          "",
          "list",
          "Semua tagihan bulan ini SUDAH LUNAS. Aman terkendali."
        );
        await replyTelegram(chatId, aiReply);
      } else {
        const rawList = `Daftar Tagihan Belum Lunas:\n${pendingBills}`;
        const aiReply = await getAIReply("", "list", rawList);
        await replyTelegram(chatId, aiReply);
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
        replyText = "Sheet 'Anggaran' belum dibuat, jadi belum ada kategori.";
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
      await replyTelegram(chatId, aiReply);
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
        const jumlah = parseIDR(row.get("Jumlah"));

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

      let replyText = "Rekap Saldo Saat Ini:\n";
      let totalAset = 0;

      const sortedKeys = Object.keys(balances).sort();

      if (sortedKeys.length === 0) {
        replyText += "Belum ada data transaksi sama sekali.";
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

      const aiReply = await getAIReply("", "report", replyText);
      await replyTelegram(chatId, aiReply);
      return NextResponse.json({ ok: true });
    }

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
      // report dari getMonthlyReport udah formatted string, kita kasi leluasa AI buat kemas ulang/komentari
      const aiReply = await getAIReply("", "report", report);
      await replyTelegram(chatId, aiReply);
      return NextResponse.json({ ok: true });
    }

    // Parse transaksi
    const data = parseMessage(text);

    if (!data) {
      const aiReply = await getAIReply(text, "chat");
      await replyTelegram(chatId, aiReply);
      return NextResponse.json({ ok: true });
    }

    // Get Google Sheets
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const today = new Date().toLocaleDateString("id-ID");

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

      const aiReply = await getAIReply(
        "",
        "transaction_success",
        `Transfer sebesar ${toIDR(
          Number(jumlah)
        )} dari ${fromWallet} ke ${toWallet}.`
      );
      await replyTelegram(chatId, aiReply);
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

      const aiReply = await getAIReply(
        "",
        "transaction_success",
        `${data.tipe} sebesar ${toIDR(Number(data.jumlah))} di dompet ${
          data.dompet
        } untuk kategori ${finalKategori}. Keterangan: ${finalKeterangan}. ${warningMsg}`
      );
      await replyTelegram(chatId, aiReply);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Telegram webhook error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
