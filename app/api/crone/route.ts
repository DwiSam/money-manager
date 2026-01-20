import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";

// --- CONFIG ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER;
const TARGET_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS
  ? process.env.TELEGRAM_CHAT_IDS.split(",")
  : [];

// --- KONEKSI SHEET ---
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

// --- HELPER FORMAT DUIT ---
const toIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// --- HELPER KIRIM TELEGRAM (MULTIPLE USERS) ---
const sendTelegram = async (message: string) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Looping kirim ke semua ID di TARGET_CHAT_IDS
    const promises = TARGET_CHAT_IDS.map(async (chatId) => {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    });

    await Promise.all(promises); // Tunggu sampai semua terkirim
    console.log(`✅ Sukses kirim ke ${TARGET_CHAT_IDS.length} orang.`);
  } catch (e) {
    console.error("Gagal kirim Telegram", e);
  }
};

// --- HELPER KIRIM WA via FONNTE ---
const sendWhatsApp = async (message: string) => {
  try {
    await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: WHATSAPP_NUMBER,
        message: message,
      }),
    });
    console.log("✅ WhatsApp sent successfully");
  } catch (e) {
    console.error("Gagal kirim WhatsApp", e);
  }
};

export async function GET(req: Request) {
  try {
    const doc = await getDoc();

    // ==========================================
    // SECTION 1: BILL REMINDER
    // ==========================================
    const sheet = doc.sheetsByTitle["Tagihan"];
    const todayDate = new Date().getDate(); // 1-31

    let billMessage = "";
    let billCount = 0;

    if (sheet) {
      const rows = await sheet.getRows();

      rows.forEach((row) => {
        const tglTagihan = parseInt(row.get("Tanggal"));
        const nama = row.get("Nama");
        const jumlah = row.get("Jumlah");

        if (tglTagihan === todayDate) {
          billCount++;
          const nominal = Number(jumlah);
          const nominalStr = nominal === 0 ? "Menyesuaikan" : toIDR(nominal);
          billMessage += `• ${nama}: ${nominalStr}\n`;
        }
      });

      // Send bill reminder via HYBRID (Telegram + WhatsApp)
      if (billCount > 0) {
        const finalMessage = `⚠️ *PUNTEN BOS MUDA, ADA TAGIHAN HARI INI!* ⚠️\n\n${billMessage}\n_"Ada tiga golongan yang tidak akan masuk surga: peminum khamar, pemutus hubungan silaturahmi, dan orang yang mengabaikan haknya (utang)." (HR. Tirmidzi)_ 💀\n\nJangan lupa bayar yaa wkwk`;

        // Send to both platforms
        await Promise.all([
          sendTelegram(finalMessage),
          sendWhatsApp(finalMessage),
        ]);
      }
    }

    // ==========================================
    // SECTION 2: AUTO-DEBIT (RECURRING TRANSACTIONS)
    // ==========================================
    const recurringSheet = doc.sheetsByTitle["RecurringTransactions"];
    const transactionSheet = doc.sheetsByIndex[0]; // Main transaction sheet

    let autoDebitCount = 0;
    let autoDebitMessage = "";

    if (recurringSheet && transactionSheet) {
      const recurringRows = await recurringSheet.getRows();
      const today = new Date();
      const todayDateStr = today.toLocaleDateString("id-ID");
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      for (const row of recurringRows) {
        const status = row.get("Status");
        const tanggalEksekusi = parseInt(row.get("TanggalEksekusi"));
        const terakhirDijalankan = row.get("TerakhirDijalankan");

        if (status !== "Aktif" || !tanggalEksekusi || isNaN(tanggalEksekusi))
          continue;
        if (tanggalEksekusi !== todayDate) continue;

        let shouldExecute = true;
        if (terakhirDijalankan) {
          const [day, month, year] = terakhirDijalankan.split("/").map(Number);
          const lastExecDate = new Date(year, month - 1, day);
          if (
            lastExecDate.getMonth() === currentMonth &&
            lastExecDate.getFullYear() === currentYear
          ) {
            shouldExecute = false;
          }
        }

        if (!shouldExecute) continue;

        const nama = row.get("Nama");
        const tipe = row.get("Tipe");
        const dariDompet = row.get("DariDompet");
        const keDompet = row.get("KeDompet");
        const kategori = row.get("Kategori");
        const jumlah = row.get("Jumlah");

        if (tipe === "Transfer") {
          await transactionSheet.addRows([
            {
              Tanggal: todayDateStr,
              Tipe: "Keluar",
              Dompet: dariDompet,
              Jumlah: jumlah,
              Keterangan: `${nama} (ke ${keDompet})`,
            },
            {
              Tanggal: todayDateStr,
              Tipe: "Masuk",
              Dompet: keDompet,
              Jumlah: jumlah,
              Keterangan: `${nama} (dari ${dariDompet})`,
            },
          ]);
          autoDebitMessage += `✅ Transfer: ${nama} - ${toIDR(
            Number(jumlah)
          )} (${dariDompet} → ${keDompet})\n`;
        } else {
          const tipeTransaksi = ["Masuk", "Keluar"].includes(tipe)
            ? tipe
            : "Keluar";
          await transactionSheet.addRow({
            Tanggal: todayDateStr,
            Tipe: tipeTransaksi,
            Dompet: dariDompet,
            Jumlah: jumlah,
            Keterangan: kategori ? `${nama} - ${kategori}` : nama,
          });
          const prefix = tipeTransaksi === "Masuk" ? "💰 Masuk:" : "✅ Keluar:";
          autoDebitMessage += `${prefix} ${nama} - ${toIDR(
            Number(jumlah)
          )} (${dariDompet})\n`;
        }

        row.set("TerakhirDijalankan", todayDateStr);
        await row.save();
        autoDebitCount++;
      }

      // Send auto-debit notification via TELEGRAM
      if (autoDebitCount > 0) {
        const notifMessage = `🤖 *AUTO-DEBIT EXECUTED*\n\n${autoDebitMessage}\nTotal: ${autoDebitCount} transaksi otomatis dijalankan hari ini.`;

        await sendTelegram(notifMessage); // <--- Pake fungsi baru
      }
    }

    return NextResponse.json({
      status: "Success",
      billReminders: billCount,
      autoDebits: autoDebitCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
