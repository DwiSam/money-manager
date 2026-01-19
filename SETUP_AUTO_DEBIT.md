# Setup Auto Debit

This guide explains how to set up **Automatic Transaction Execution**.

> **⚠️ Important**: This is different from the **Tagihan (Bill)** feature.
>
> - **Tagihan (Bills)**: Just a reminder list. You must manually pay via Chat Bot. Managed via **App Settings > Tagihan**.
> - **Auto Debit**: Automatically executes the transaction on the specified date without your interaction. **Managed via Google Sheet Only**.

## Sheet Configuration

To enable auto-debit, you need to manage the **"RecurringTransactions"** sheet manually.

### Sheet Structure

Create a new tab called **"RecurringTransactions"** with the following header:

| Nama            | Status | TanggalEksekusi | TerakhirDijalankan | Tipe   | DariDompet | KeDompet | Jumlah | Kategori |
| :-------------- | :----- | :-------------- | :----------------- | :----- | :--------- | :------- | :----- | :------- |
| Langganan Adobe | Aktif  | 10              | 10/10/2023         | Keluar | BNI        | -        | 300000 | Software |
| Tabungan Auto   | Aktif  | 25              | 25/10/2023         | In     | Mandiri    | Bibit    | 500000 | Invest   |

### Column Descriptions

- **Nama**: Description of the auto-debit (e.g., "Spotify").
- **Status**: Set to `Aktif` to enable, or `Nonaktif` to disable.
- **TanggalEksekusi**: Day of the month to execute (e.g., `1`, `15`, `28`).
- **TerakhirDijalankan**: _System managed_. The app updates this after execution to prevent double-charging.
- **Tipe**: `Masuk` (Income), `Keluar` (Expense), or `Transfer`.
- **DariDompet**: Source wallet name.
- **KeDompet**: Destination wallet name (For Transfer only).
- **Jumlah**: Amount to transact.
- **Kategori**: Category for the transaction. (only for "Keluar" type)

## How It Works

1. **Daily Cron Job** runs every day
2. Checks all recurring transactions with Status = "Aktif"
3. If `TanggalEksekusi` matches today's date:
   - Creates transaction in main sheet
   - Updates `TerakhirDijalankan` to prevent duplicate
   - Sends WhatsApp notification

## Examples

### Bill Payment (Expense)

```
Nama: Bayar Kontrakan
Tipe: Keluar
DariDompet: Mandiri
KeDompet: (empty)
Kategori: Kontrakan
Jumlah: 3000000
TanggalEksekusi: 1
Status: Aktif
```

**Result**: Every 1st of month, creates expense transaction:

- Rp 3,000,000 from Mandiri
- Category: Kontrakan

### Subscription

```
Nama: Netflix
Tipe: Keluar
DariDompet: GoPay
KeDompet: (empty)
Kategori: Hiburan
Jumlah: 55000
TanggalEksekusi: 15
Status: Aktif
```

**Result**: Every 15th, deducts Rp 55,000 from GoPay

### Automatic Savings Transfer

```
Nama: Transfer Tabungan
Tipe: Transfer
DariDompet: BNI
KeDompet: Tabungan
Kategori: (empty)
Jumlah: 500000
TanggalEksekusi: 25
Status: Aktif
```

**Result**: Every 25th, transfers Rp 500,000 from BNI to Tabungan

## Managing Recurring Transactions

### Pause Auto-Debit

Change `Status` to "Nonaktif"

### Resume Auto-Debit

Change `Status` back to "Aktif"

### Edit Amount/Date

Simply update the values in the sheet

### Delete

Delete the row from the sheet

## Notes

- If execution date doesn't exist in a month (e.g., 31 in February), it will execute on the last day of that month
- Duplicate prevention: Won't execute twice in the same month
- Notifications sent via WhatsApp for each execution
- Works automatically - no need to open the app!

## Testing

To test auto-debit:

1. Create a test entry with `TanggalEksekusi` = today's date
2. Wait for cron to run (runs daily)
3. Or manually trigger: `https://your-app.vercel.app/api/crone`
4. Check: main transaction sheet for new entry
5. Check: `TerakhirDijalankan` should be updated
6. Check: WhatsApp notification received
