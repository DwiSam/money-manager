# Money Tracker 💰

A personal finance tracking application built with **Next.js**, using **Google Sheets** as the database and integrating with **Telegram** & **WhatsApp** for easy transaction recording.

![Money Tracker Interaction](https://img.shields.io/badge/Interaction-Telegram%20%7C%20WhatsApp-blue)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Tailwind%20%7C%20Google%20Sheets-black)

## ✨ Features

- **Dashboard**: Visual overview of income, expenses, and wallet balances.
- **Chat Bot Integration**: Record transactions via Telegram or WhatsApp (Fonnte).
  - `Masuk 50000 BNI Gaji`
  - `Keluar 20000 GoPay Makan`
  - `Transfer 100000 Mandiri BNI Tabungan`
- **Monthly Reports** 📊: Get a summary of your income, expenses, and savings via chat.
- **Budgeting & Categories**: Manage spending limits per category (e.g., Makanan, Transport).
- **Bill Reminder**: Automated daily checks for due bills.
- **Auto Debit**: Handle recurring transactions automatically.
- **Secure Access**: PIN protection for the web interface.

---

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or yarn
- A Google Cloud Project with **Google Sheets API** enabled
- A Telegram Account (for bot integration)

### Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd money-tracker
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Setup Environment Variables**

    Copy the example environment file:

    ```bash
    cp env.example .env.local
    ```

    Open `.env.local` and fill in the required values:

    | Variable | Description |
    |Str|---|
    | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email from your Google Cloud Service Account |
    | `GOOGLE_PRIVATE_KEY` | Private key from your Service Account JSON (use `\n` for newlines) |
    | `GOOGLE_SHEET_ID` | The ID of your Google Sheet (from the URL) |
    | `TELEGRAM_BOT_TOKEN` | Token from [@BotFather](https://t.me/BotFather) |
    | `TELEGRAM_CHAT_IDS` | Your Telegram Chat ID(s), comma-separated |
    | `FONNTE_TOKEN` | (Optional) Token for WhatsApp integration via Fonnte |
    | `WHATSAPP_NUMBER` | (Optional) Target WhatsApp number for notifications |
    | `NEXT_PUBLIC_ACCESS_PIN` | PIN code to access the web dashboard (e.g. `123456`) |

### Google Sheets Setup

This app requires a specific Google Sheet structure.

1.  Create a new Google Sheet.
2.  Share the sheet with your **Service Account Email** (give `Editor` access).
3.  Create the following sheets (tabs):

#### 1. Main Sheet (First Tab)

Used for recording all transactions.

- **Columns**: `Tanggal`, `Tipe`, `Dompet`, `Jumlah`, `Keterangan`, `Kategori`

#### 2. Sheet "Tagihan"

Used for bill reminders.

- **Columns**: `Nama`, `Jumlah`, `Tanggal` (Day of month, e.g., 25), `TerakhirDibayar`

#### 3. Sheet "Anggaran" (New)

Used for defining categories and budget limits.

- **Columns**:
  - `Kategori`: Name of the category (e.g., "Makanan", "Transport")
  - `Limit`: Monthly limit for this category (e.g., 3000000)

#### 4. Sheet "Wallets"

Used to configure available wallets in the UI.

| Nama    | Logo          |
| :------ | :------------ |
| BNI     | `bni.svg`     |
| Mandiri | `mandiri.svg` |
| GoPay   | `gopay.png`   |
| Tunai   | `cash-icon`   |

> **Note**: Place logo images in the `public/` folder. Available icons: `cash-icon`, `piggy-icon`, `emergency-icon`.

#### 5. Sheet "RecurringTransactions"

Used for auto-debit features.

- **Columns**: `Nama`, `Status` (Aktif/Nonaktif), `TanggalEksekusi`, `TerakhirDijalankan`, `Tipe`, `DariDompet`, `KeDompet`, `Jumlah`, `Kategori`

---

## 🤖 Bot Commands

You can interact with the system via your Telegram Bot:

| Command              | Format                                | Example                            |
| :------------------- | :------------------------------------ | :--------------------------------- |
| **Income**           | `Masuk [Jumlah] [Dompet] [Ket]`       | `Masuk 5jt BNI Gaji`               |
| **Expense**          | `Keluar [Jumlah] [Dompet] [Ket]`      | `Keluar 20rb Cash Makan`           |
| **With Category**    | `Keluar [Jumlah] [Dompet] [Kategori]` | `Keluar 15rb Gopay Transport Ojek` |
| **Transfer**         | `Transfer [Jumlah] [Dari] [Ke]`       | `Transfer 500rb BNI Bibit`         |
| **Check Balance**    | `Cek Saldo` or `Cek [Dompet]`         | `Cek BNI`                          |
| **Check Bills**      | `Cek Tagihan`                         | `Cek Tagihan`                      |
| **Pay Bill**         | `Bayar [Nama] [Jumlah] [Dompet]`      | `Bayar Listrik 500rb BNI`          |
| **Check Categories** | `Cek Kategori`                        | `Cek Kategori`                     |
| **Monthly Report**   | `Laporan` or `Recap`                  | `Laporan`                          |

---

## 🏃‍♂️ Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. Enter the PIN configured in `NEXT_PUBLIC_ACCESS_PIN` to access the dashboard.

## 📦 Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/):

1.  Push code to GitHub.
2.  Import project to Vercel.
3.  Add all Environment Variables in Vercel Project Settings.
4.  Deploy! 🚀

Don't forget to set up the Telegram Webhook after deploying:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook -d "url=https://<your-vercel-domain>/api/telegram"
```
