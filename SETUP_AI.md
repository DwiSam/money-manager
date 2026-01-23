# Setup AI Smart Assistant (Gemini) 🤖

This project integrates **Google Gemini AI** to provide a smart "Personal Assistant" experience via the WhatsApp Bot.

## Features

- **Smart Replies**: Understands context and replies with a "funny/supportive assistant" persona.
- **Transaction Insights**: Gives feedback when you record income/expense (`"Wah boros banget bos!"` or `"Mantap banyak duit!"`).
- **Flexible Interactions**: Handles conversational queries like "Apa kabar?", "Siapa kamu?", etc.

---

## 1. Get Gemini API Key

1.  Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Log in with your Google account.
3.  Click **Create API key**.
4.  Copy the generated key (starts with `AIza...`).

## 2. Configure Environment

Open your `.env.local` file and add the `GEMINI_API_KEY`:

```bash
GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

> **Note**: This key is free to use (within rate limits) via Google AI Studio.

---

## 3. Customizing the Persona

The AI's personality is defined in `app/api/whatsapp/route.ts`. You can modify the `systemInstruction` to change how it behaves.

**File:** [`app/api/whatsapp/route.ts`](file:///app/api/whatsapp/route.ts)

```typescript
systemInstruction:
  "Kamu adalah asisten keuangan pribadi yang lucu, cerdas, dan suportif. Namamu adalah 'Asisten Pribadi'. Gaya bicaramu santai...",
```

Change this text to whatever persona you want (e.g., "Professional Accountant", "Angry Mom", etc.).

---

## 4. Troubleshooting Models

If the bot doesn't reply or says "AI Error", it might be an issue with the Model ID or API Key.
We have provided a script to check which Gemini models are available and working for your key.

Run this command in your terminal:

```bash
node app/cek_model.js
```

**Output Example:**

```bash
🔍 Memulai pengecekan model...

👉 Mencoba model: gemini-2.0-flash-exp...
✅ SUKSES! Model "gemini-2.0-flash-exp" BISA DIPAKAI!
   Respon: Halo! Apa yang bis...
```

If you see `✅ SUKSES`, that model is valid. If your app is using a different model name that fails, update the model name in `app/api/whatsapp/route.ts`.
