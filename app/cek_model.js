const { GoogleGenerativeAI } = require("@google/generative-ai");

// PASTIKAN API KEY BENAR
const genAI = new GoogleGenerativeAI(your_gemini_api_key);

async function checkModels() {
  const candidates = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-002",
    "gemini-2.0-flash-exp", // Versi terbaru banget
    "gemini-2.0-flash-latest",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-001",

    "gemini-pro", // Versi lama (buat cek koneksi doang)
  ];

  console.log("🔍 Memulai pengecekan model...\n");

  for (const modelName of candidates) {
    try {
      console.log(`👉 Mencoba model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Kita tes kirim pesan "Halo"
      const result = await model.generateContent("Halo");
      const response = await result.response;

      console.log(`✅ SUKSES! Model "${modelName}" BISA DIPAKAI!`);
      console.log(`   Respon: ${response.text().substring(0, 20)}...\n`);
    } catch (error) {
      console.log(`❌ GAGAL: ${modelName}`);
      // Tampilkan pesan errornya biar kita tau kenapa
      console.log(`   Error Msg: ${error.message}\n`);
    }
  }
}

checkModels();
