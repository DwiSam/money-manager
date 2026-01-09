# Environment Variables Setup

Add these to your `.env.local` (local development) and Vercel Environment Variables (production):

## Telegram Configuration

```bash
# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Cron Notifications - Multiple chat IDs (comma-separated)
TELEGRAM_CHAT_IDS=123456789,987654321

# Reminder Notifications - Individual chat IDs
TELEGRAM_CHAT_ID_A=123456789
TELEGRAM_CHAT_ID_B=987654321
```

## How to Get These Values

### 1. Get TELEGRAM_BOT_TOKEN

1. Open Telegram app
2. Search for @BotFather
3. Send `/newbot`
4. Follow instructions to create bot
5. Copy the token provided

### 2. Get Chat IDs

1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}`
4. Copy the ID number

## Vercel Setup

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: (paste your token)
   - Environment: Production, Preview, Development
5. Repeat for all variables
6. Redeploy the project

## Security Notes

- ✅ Never commit these values to Git
- ✅ Add `.env.local` to `.gitignore`
- ✅ Rotate tokens if accidentally exposed
- ✅ Use different bots for dev/production if needed
