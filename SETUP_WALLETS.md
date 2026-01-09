# Setup Wallets Sheet

## Google Sheets Configuration

To manage your wallet list, you need to create a new sheet tab called **"Wallets"** in your Google Spreadsheet.

### Sheet Structure

Create a new tab with the following structure:

| Nama         | Logo           |
| ------------ | -------------- |
| BNI          | bni.svg        |
| Mandiri      | mandiri.svg    |
| GoPay        | gopay.png      |
| Dana         | dana.svg       |
| Tunai        | cash-icon      |
| Tabungan     | piggy-icon     |
| Dana Darurat | emergency-icon |

### Column Descriptions

- **Nama**: The wallet name that will appear in dropdowns and the wallet tab (required)
- **Logo**: The logo file name or icon identifier (optional - defaults to generic wallet icon if empty)

### Logo Mapping

#### Image Files (in `/public` folder)

- `bni.svg` - BNI bank logo
- `mandiri.svg` - Mandiri bank logo
- `gopay.png` - GoPay logo
- `dana.svg` - Dana logo

#### Icon Identifiers (built-in icons)

- `cash-icon` - Dollar sign icon (green)
- `piggy-icon` - Piggy bank icon (blue)
- `emergency-icon` - Alert circle icon (rose)
- Any other value will default to generic wallet icon

### Adding New Wallets

1. Go to your Google Sheet
2. Navigate to the "Wallets" tab
3. Add a new row with:

   - **Nama**: Your wallet name (e.g., "Jenius", "SeaBank")
   - **Logo**:
     - If you have a logo file, add it to `/public` folder and use filename
     - Otherwise, use `wallet-icon` for generic wallet icon

4. Refresh your Money Tracker app
5. New wallet will appear in all dropdowns

### Fallback Behavior

If the "Wallets" sheet doesn't exist, the app will use default wallets listed above.

### Important Notes

- Wallet names are case-sensitive
- Empty rows will be ignored
- Wallets in dropdown come from this sheet
- Transactions with unlisted wallets will still be processed and displayed in Wallet tab
