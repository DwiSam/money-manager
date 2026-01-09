# Setup Telegram Transaction Bot

## Prerequisites

- Telegram account
- Money Tracker app deployed on Vercel

## Steps

### 1. Create Telegram Bot

1. Open Telegram app
2. Search for **@BotFather**
3. Send `/newbot`
4. Choose bot name: `Money Tracker Bot`
5. Choose username: `your_money_tracker_bot` (must be unique)
6. **Save the token** provided by BotFather

### 2. Set Environment Variables

Add to Vercel Environment Variables:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Set Webhook

After deploying to Vercel, set the webhook:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://your-app.vercel.app/api/telegram"
```

**Replace:**

- `<YOUR_BOT_TOKEN>` with your actual token
- `your-app.vercel.app` with your Vercel domain

### 4. Verify Webhook

Check webhook status:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Should show:

```json
{
  "ok": true,
  "result": {
    "url": "https://your-app.vercel.app/api/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Usage

### Message Format

Same format as WhatsApp integration:

**Income:**

```
Masuk 50000 BNI Gaji
```

**Expense:**

```
Keluar 25000 GoPay Makan siang
```

**Transfer:**

```
Transfer 100000 Mandiri BNI Nabung
```

### Format Rules

1. **Keywords:** `Masuk`, `Keluar`, or `Transfer` (case-insensitive)
2. **Amount:** Numbers only (commas/dots auto-removed)
3. **Wallet:** Wallet name
4. **Description:** Any text

### Examples

```
Masuk 500000 BNI Gaji Bulanan
Keluar 150000 GoPay Belanja Mingguan
Masuk 75000 Dana Transfer dari Teman
Transfer 200000 Mandiri Tabungan Investasi
Keluar 15000 Tunai Parkir
```

## Response Messages

**Success (Income/Expense):**

```
✅ Transaksi berhasil dicatat!
💰 Masuk: Rp 50.000
📍 Dompet: BNI
📝 Gaji
```

**Success (Transfer):**

```
✅ Transfer berhasil dicatat!
💸 Rp 100.000
📤 Mandiri ➡ 📥 BNI
```

**Error:**

```
❌ Format salah!

Contoh:
Masuk 50000 BNI Gaji
Keluar 25000 GoPay Makan siang
Transfer 100000 Mandiri BNI Nabung
```

## Troubleshooting

### Bot not responding

1. Check webhook is set correctly
2. Verify environment variables in Vercel
3. Check Vercel function logs for errors
4. Re-deploy after adding env vars

### Can't set webhook

- Ensure URL is HTTPS (Vercel auto provides)
- Check bot token is correct
- Verify Vercel deployment is live

### Messages not saving to Sheets

- Check Google Sheets API credentials
- Verify sheet permissions
- Check Vercel function logs

## Testing

1. Send test message to bot: `Masuk 1000 Tunai Test`
2. Check bot replies with confirmation
3. Verify row appears in Google Sheet
4. Try all transaction types (Masuk, Keluar, Transfer)

## Notes

- Bot works 24/7 via webhook
- No polling needed
- Instant responses
- Same backend as WhatsApp integration
- Free unlimited messages
