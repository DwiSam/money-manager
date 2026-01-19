# Setup Wallets

**✨ New Requirement:** You can now manage wallets directly from the App UI.

## Method 1: Manage via App (Recommended)

1.  Open the App Dashboard.
2.  Click the **Settings (⚙️)** icon.
3.  Go to the **Dompet** tab.
4.  Add, Edit, or Delete wallets as needed.

> **Note**: The app will automatically create and update the "Wallets" sheet in your Google Spreadsheet.

---

## Method 2: Manual Sheet Configuration

If you prefer to manage wallets manually via Google Sheets:

### Sheet Structure

Create a tab named **"Wallets"** with the following header:

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

- **Nama**: The wallet name that will appear in dropdowns and the wallet tab (required).
- **Logo**: The logo file name or icon identifier.

### Logo Mapping

#### Image Files (in `/public` folder)

- `bni.svg`
- `mandiri.svg`
- `gopay.png`
- `dana.svg`

#### Icon Identifiers (built-in icons)

- `cash-icon` - Dollar sign icon (green)
- `piggy-icon` - Piggy bank icon (blue)
- `emergency-icon` - Alert circle icon (rose)
- Any other value will default to generic wallet icon.
