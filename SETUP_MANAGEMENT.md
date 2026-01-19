# Data Management Guide

The Money Tracker app now supports dynamic management of your **Budgets**, **Bills**, and **Wallets** directly from the UI. You no longer need to manually edit Google Sheets for these features, although the sheets act as the database.

## Accessing Management Tools

1.  Open the Money Tracker dashboard.
2.  Click the **Settings Icon** (⚙️) in the top right corner.
3.  The **Kelola Data** modal will appear with three tabs:
    - **Anggaran (Budget)**
    - **Tagihan (Bills)**
    - **Dompet (Wallets)**

---

## 1. Managing Budgets (Anggaran)

Budgets allow you to set spending limits for specific categories. These categories are also used for auto-completion when recording transactions.

- **Add Budget**: Enter a "Kategori" name (e.g., _Makanan_) and a "Limit" amount. Click **Tambah Budget**.
- **Edit**: Click the **Edit** button on any existing budget to change the limit or rename the category.
- **Delete**: Click **Hapus** to remove a budget category.

> [!NOTE]
> Adding a budget here automatically makes the category available for transaction classification in the app and via the Chat Bot.

## 2. Managing Bills (Tagihan)

Use this feature to track your monthly recurring bills and get reminders.

- **Add Bill**:
  - **Nama Tagihan**: e.g., _Internet_, _Listrik_, _Netflix_.
  - **Jumlah**: The fixed amount of the bill. Enter `0` if the amount varies each month (e.g., Electricity).
  - **Tanggal Jatuh Tempo**: The day of the month (1-31) when the bill is due.
- **Billing Cycle**:
  - The system checks daily if a bill is due.
  - When you pay a bill (via Chat Bot `Done [Nama]` or `Bayar [Nama]`), it is marked as "Paid" for the current month.
  - The status resets automatically for the next month.

## 3. Managing Wallets (Dompet)

Configure the source of funds available in your application.

- **Add Wallet**:
  - **Nama Dompet**: e.g., _BCA_, _Gopay_, _Cash_.
  - **Logo**: Optional. You can use:
    - Filename of an image in `public/` folder (e.g., `bca.svg`).
    - Built-in icon names: `cash-icon`, `piggy-icon`, `emergency-icon`.
- **System Behavior**:
  - Wallets added here will immediately appear in the **Transaction Form** dropdown and **Wallet** tab.
  - Balances are calculated dynamically based on transactions associated with the wallet name.

---

## Google Sheet Synchronization

All changes made via the UI are instantly saved to your connected Google Sheet.

- **Anggaran** -> Saved to sheet `Anggaran`
- **Tagihan** -> Saved to sheet `Tagihan`
- **Dompet** -> Saved to sheet `Wallets`

> [!TIP]
> If these sheets do not exist, the application will automatically create them for you with the correct headers when you first add data.
