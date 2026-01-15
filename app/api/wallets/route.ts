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
    let sheet = doc.sheetsByTitle["Wallets"];

    if (!sheet) {
      // Auto-create and seed if missing
      sheet = await doc.addSheet({
        headerValues: ["Nama", "Logo"],
        title: "Wallets",
      });
      const defaultWallets = [
        { Nama: "BNI", Logo: "bni.svg" },
        { Nama: "Mandiri", Logo: "mandiri.svg" },
        { Nama: "GoPay", Logo: "gopay.png" },
        { Nama: "Dana", Logo: "dana.svg" },
        { Nama: "Tunai", Logo: "" },
        { Nama: "Tabungan", Logo: "" },
      ];
      await sheet.addRows(defaultWallets);
    }

    const rows = await sheet.getRows();
    const wallets = rows
      .map((row) => ({
        nama: row.get("Nama") || "",
        logo: row.get("Logo") || "",
      }))
      .filter((w) => w.nama);

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const doc = await getDoc();

    let sheet = doc.sheetsByTitle["Wallets"];
    if (!sheet) {
      sheet = await doc.addSheet({
        headerValues: ["Nama", "Logo"],
        title: "Wallets",
      });
    }

    const rows = await sheet.getRows();

    if (action === "create") {
      const exists = rows.find(
        (r) => r.get("Nama").toLowerCase() === data.nama.toLowerCase()
      );
      if (exists) {
        return NextResponse.json(
          { error: "Dompet sudah ada" },
          { status: 400 }
        );
      }
      await sheet.addRow({ Nama: data.nama, Logo: data.logo || "" });
    } else if (action === "update") {
      const row = rows.find(
        (r) => r.get("Nama").toLowerCase() === data.oldNama?.toLowerCase()
      );
      if (row) {
        if (data.newNama) row.set("Nama", data.newNama);
        if (data.logo !== undefined) row.set("Logo", data.logo);
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
    console.error("Wallet API Error:", error);
    return NextResponse.json({ error: "Gagal update dompet" }, { status: 500 });
  }
}
