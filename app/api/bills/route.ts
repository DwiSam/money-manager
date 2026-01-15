import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const sheet = doc.sheetsByTitle["Tagihan"];

    if (!sheet) {
      return NextResponse.json([]);
    }

    const rows = await sheet.getRows();

    const data = rows.map((row) => ({
      nama: row.get("Nama"),
      jumlah: row.get("Jumlah"),
      tanggal: row.get("Tanggal"),
      terakhirDibayar: row.get("TerakhirDibayar"),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Bills API Error:", error);
    return NextResponse.json({ error: "Gagal ambil tagihan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const doc = await getDoc();

    // Create sheet if not exists
    let sheet = doc.sheetsByTitle["Tagihan"];
    if (!sheet) {
      sheet = await doc.addSheet({
        headerValues: ["Nama", "Jumlah", "Tanggal", "TerakhirDibayar"],
        title: "Tagihan",
      });
    }

    const rows = await sheet.getRows();

    if (action === "create") {
      // Check duplicate
      const exists = rows.find(
        (r) => r.get("Nama").toLowerCase() === data.nama.toLowerCase()
      );
      if (exists) {
        return NextResponse.json(
          { error: "Nama tagihan sudah ada" },
          { status: 400 }
        );
      }
      await sheet.addRow({
        Nama: data.nama,
        Jumlah: data.jumlah,
        Tanggal: data.tanggal,
        TerakhirDibayar: "-",
      });
    } else if (action === "update") {
      const row = rows.find(
        (r) => r.get("Nama").toLowerCase() === data.oldNama?.toLowerCase()
      );
      if (row) {
        if (data.newNama) row.set("Nama", data.newNama);
        if (data.jumlah) row.set("Jumlah", data.jumlah);
        if (data.tanggal) row.set("Tanggal", data.tanggal);
        await row.save();
      }
    } else if (action === "delete") {
      const row = rows.find(
        (r) => r.get("Nama").toLowerCase() === data.nama.toLowerCase()
      );
      if (row) {
        await row.delete();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bills API Error:", error);
    return NextResponse.json(
      { error: "Gagal update tagihan" },
      { status: 500 }
    );
  }
}
