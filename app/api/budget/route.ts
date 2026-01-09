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
    const sheet = doc.sheetsByTitle["Anggaran"];

    if (!sheet) {
      // Return empty if sheet doesn't exist yet
      return NextResponse.json([]);
    }

    const rows = await sheet.getRows();

    const data = rows.map((row) => ({
      kategori: row.get("Kategori"),
      limit: row.get("Limit"),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Budget API Error:", error);
    return NextResponse.json({ error: "Gagal ambil budget" }, { status: 500 });
  }
}
