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

    // Try to find "Wallets" sheet
    const walletsSheet = doc.sheetsByTitle["Wallets"];

    if (!walletsSheet) {
      // Fallback: return default wallets if sheet doesn't exist
      console.warn("Wallets sheet not found, returning defaults");
      return NextResponse.json({
        wallets: [
          { nama: "BNI", logo: "bni.svg" },
          { nama: "Mandiri", logo: "mandiri.svg" },
          { nama: "GoPay", logo: "gopay.png" },
          { nama: "Dana", logo: "dana.svg" },
          { nama: "Tunai", logo: "cash-icon" },
          { nama: "Tabungan", logo: "piggy-icon" },
          { nama: "Dana Darurat", logo: "emergency-icon" },
        ],
      });
    }

    const rows = await walletsSheet.getRows();

    const wallets = rows
      .map((row) => ({
        nama: row.get("Nama") || "",
        logo: row.get("Logo") || "",
      }))
      .filter((w) => w.nama); // Filter out empty rows

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
