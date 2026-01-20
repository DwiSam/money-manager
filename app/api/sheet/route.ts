import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { parseIDR } from "@/lib/finance";

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

export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const data = rows.map((row) => ({
      rowIndex: row.rowNumber, // Use rowNumber (1-based index from sheet)
      tanggal: row.get("Tanggal"),
      keterangan: row.get("Keterangan"),
      kategori: row.get("Kategori") || "Lainnya",
      tipe: row.get("Tipe"),
      dompet: row.get("Dompet"),
      jumlah: parseIDR(row.get("Jumlah")).toString(), // Send clean number string to frontend
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Sheet API Error:", error);
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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { rowIndex, data } = body;

    if (!rowIndex || !data) {
      return NextResponse.json(
        { error: "Missing rowIndex or data" },
        { status: 400 },
      );
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Find row by index (GoogleSpreadsheet rowIndex is 1-based usually matched with rows[i].rowIndex)
    // @ts-ignore
    const row = rows.find((r) => r.rowIndex === rowIndex);

    if (!row) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }

    // Update fields
    if (data.tanggal) row.assign({ Tanggal: data.tanggal });
    if (data.keterangan) row.assign({ Keterangan: data.keterangan });
    if (data.kategori) row.assign({ Kategori: data.kategori });
    if (data.tipe) row.assign({ Tipe: data.tipe });
    if (data.dompet) row.assign({ Dompet: data.dompet });
    if (data.jumlah) row.assign({ Jumlah: data.jumlah });

    await row.save();

    return NextResponse.json({ message: "Updated!" });
  } catch (error) {
    console.error("❌ Edit Error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { rowIndex } = body;

    if (!rowIndex) {
      return NextResponse.json({ error: "Missing rowIndex" }, { status: 400 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // @ts-ignore
    const row = rows.find((r) => r.rowIndex === rowIndex);

    if (!row) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }

    await row.delete();

    return NextResponse.json({ message: "Deleted!" });
  } catch (error) {
    console.error("❌ Delete Error:", error);
    return NextResponse.json({ error: "Gagal hapus data" }, { status: 500 });
  }
}
