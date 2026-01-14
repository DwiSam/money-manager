import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const data = rows.map((row) => ({
      tanggal: row.get("Tanggal"),
      keterangan: row.get("Keterangan"),
      kategori: row.get("Kategori") || "Lainnya",
      tipe: row.get("Tipe"),
      dompet: row.get("Dompet"),
      jumlah: row.get("Jumlah"),
    }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];

    // LOGIC BARU: Cek apakah inputnya Array atau Object biasa
    // Kalau Object, kita bungkus jadi Array biar seragam
    const inputs = Array.isArray(body) ? body : [body];

    // Mapping data biar sesuai header Sheet
    const rowsToAdd = inputs.map((item) => ({
      Tanggal: item.tanggal || new Date().toLocaleDateString("id-ID"),
      Keterangan: item.keterangan,
      Kategori: item.kategori || "Lainnya", // Include Category
      Tipe: item.tipe,
      Dompet: item.dompet,
      Jumlah: item.jumlah,
    }));

    // Pakai addRows (PLURAL) biar bisa masukin banyak sekaligus
    await sheet.addRows(rowsToAdd);

    return NextResponse.json({
      message: "Success!",
      savedCount: rowsToAdd.length,
    });
  } catch (error) {
    console.error("Error Sheet:", error);
    return NextResponse.json({ error: "Gagal simpan data" }, { status: 500 });
  }
}
