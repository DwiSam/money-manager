# Setup Auto-Debit (Recurring Transactions)

## Google Sheets Configuration

Create a new sheet tab called **"RecurringTransactions"** in your Google Spreadsheet.

### Sheet Structure

| ID  | Nama              | Tipe     | DariDompet | KeDompet | Kategori  | Jumlah  | TanggalEksekusi | TerakhirDijalankan | Status |
| --- | ----------------- | -------- | ---------- | -------- | --------- | ------- | --------------- | ------------------ | ------ |
| 1   | Bayar Kontrakan   | Keluar   | Mandiri    |          | Kontrakan | 3000000 | 1               |                    | Aktif  |
| 2   | Netflix           | Keluar   | GoPay      |          | Hiburan   | 55000   | 15              |                    | Aktif  |
| 3   | Transfer Tabungan | Transfer | BNI        | Tabungan |           | 500000  | 25              |                    | Aktif  |

### Column Descriptions

- **ID**: Unique identifier (1, 2, 3, ...)
- **Nama**: Transaction description (e.g., "Bayar Kontrakan", "Netflix")
- **Tipe**: Transaction type - "Keluar" or "Transfer"
- **DariDompet**: Source wallet (required)
- **KeDompet**: Destination wallet (only for "Transfer" type)
- **Kategori**: Category (only for "Keluar" type)
- **Jumlah**: Amount (e.g., 3000000 for Rp 3,000,000)
- **TanggalEksekusi**: Day of month to execute (1-31)
- **TerakhirDijalankan**: Last execution date (DD/MM/YYYY) - will be auto-filled
- **Status**: "Aktif" or "Nonaktif"

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
