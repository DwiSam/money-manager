# Money Tracker 💰

A personal finance tracking application built with **Next.js**, using **Google Sheets** as the database and integrating with **Telegram** & **WhatsApp** for easy transaction recording.

![Money Tracker Interaction](https://img.shields.io/badge/Interaction-Telegram%20%7C%20WhatsApp-blue)
![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Tailwind%20%7C%20Google%20Sheets-black)

## ✨ Features

- **Dashboard**: Visual overview of income, expenses, and wallet balances.
- **In-App Data Management** 🛠️:
  - Manage **Wallets** (e.g. BNI, Gopay)
  - Set **Budgets** per category
  - Manage **Recurring Bills** (Tagihan) directly from the Settings menu.
- **Chat Bot Integration**: Record transactions via Telegram or WhatsApp (Fonnte).
  - `Masuk 50000 BNI Gaji`
  - `Keluar 20000 GoPay Makan`
  - `Transfer 100000 Mandiri BNI Tabungan`
- **Monthly Reports** 📊: Get a summary of your income, expenses, and savings via chat.
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
3.  **Basic Setup**: Create the **Main Sheet** (First Tab) manually.
    - **Columns**: `Tanggal`, `Tipe`, `Dompet`, `Jumlah`, `Keterangan`, `Kategori`

> [!TIP] > **Automatic Setup**: The app will automatically create the `Tagihan`, `Anggaran`, and `Wallets` sheets when you first add data via the **Settings** menu in the app.
> See [SETUP_MANAGEMENT.md](SETUP_MANAGEMENT.md) for details on managing this data.

#### Manual Setup (Optional)

If you prefer to set up everything manually:

- [**SETUP_WALLETS.md**](SETUP_WALLETS.md) - For Wallet configuration.
- [**SETUP_AUTO_DEBIT.md**](SETUP_AUTO_DEBIT.md) - For Auto-Debit configuration (**Manual Setup Required**).

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
