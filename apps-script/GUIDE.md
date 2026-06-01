# Panduan Setup Backend Google Apps Script

## 1. Buat Google Sheets

1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru
2. Rename spreadsheet (contoh: "Sipanda - Data Penilaian")
3. Buat 3 tab dengan nama persis:

### Tab 1: `Database_Siswa`
| NIS | Nama_Siswa | Kelas |
|---|---|---|
| 2024001 | Ahmad Fauzi | X-A |
| 2024002 | Siti Nurhaliza | X-A |

### Tab 2: `Database_Rubrik`
| Kelas | Mapel | Aspek_Penilaian | Skor_4 | Skor_3 | Skor_2 | Skor_1 |
|---|---|---|---|---|---|---|
| X-A | Bahasa Indonesia | Tata Bahasa | Penggunaan tata bahasa sangat tepat... | Penggunaan tata bahasa tepat... | ... | ... |
| X-A | Bahasa Indonesia | Kosakata | ... | ... | ... | ... |

*(satu baris per aspek penilaian)*

### Tab 3: `Hasil_Penilaian`
| Timestamp | NIS | Nama_Siswa | Kelas | Mapel | Hasil_OCR | Skor_Analitik | Feedback_AI | Rekomendasi | Total_Skor | Total_Maks |
|---|---|---|---|---|---|---|---|---|---|---|

4. Copy `SPREADSHEET_ID` dari URL: `https://docs.google.com/spreadsheets/d/ **INI-ID-NYA** /edit`

---

## 2. Dapatkan API Keys

### Google Cloud Vision API
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru (atau pilih existing)
3. **Enable APIs** → cari "Cloud Vision API" → Enable
4. **Credentials** → Buat API Key
5. **Restrict key** → pilih "Cloud Vision API" untuk keamanan

### Google Gemini API
1. Buka [Google AI Studio](https://aistudio.google.com)
2. Klik **Get API Key**
3. Buat API Key baru
4. Copy key tersebut

---

## 3. Setup Google Apps Script

### Opsi A: Melalui Editor Online (Rekomendasi)

1. Buka [script.google.com](https://script.google.com)
2. Klik **New project**
3. Rename project menjadi "Sipanda Backend"
4. Copy-paste konten file `.gs` dari folder `apps-script/`:

   | File GAS | Konten |
   |---|---|
   | `Code.gs` | Main entry point |
   | `SheetsService.gs` | Operasi database |
   | `OCRService.gs` | Google Cloud Vision |
   | `GeminiService.gs` | Google Gemini AI |

5. **appsscript.json** — Klik menu `View > Show manifest file`, paste konten `appsscript.json`

### Opsi B: Menggunakan `clasp` (Command Line)

```bash
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "Sipanda Backend"
# Copy file .gs dan appsscript.json ke folder
clasp push
```

---

## 4. Konfigurasi Script Properties

Di editor Apps Script:
1. Klik menu **File > Project properties > Script properties**
2. Tambahkan 3 properti:

| Key | Value |
|---|---|
| `SPREADSHEET_ID` | ID Google Sheets (dari URL) |
| `GEMINI_API_KEY` | API Key Gemini dari Google AI Studio |
| `CLOUD_VISION_API_KEY` | API Key Cloud Vision dari Google Cloud Console |

Atau bisa via kode (jalankan sekali di editor):
```javascript
function setupConfig() {
  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: 'masukkan_id_sheet',
    GEMINI_API_KEY: 'masukkan_gemini_key',
    CLOUD_VISION_API_KEY: 'masukkan_vision_key',
  })
}
```

---

## 5. Deploy Web App

1. Klik **Deploy > New deployment**
2. Pilih type: **Web app**
3. Set:
   - **Execute as**: `Me` (email Anda)
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. **Copy URL Web App** — ini adalah `VITE_GAS_URL`

---

## 6. Hubungkan ke Frontend

1. Buka folder `frontend/`
2. Buat file `.env`:

```env
VITE_GAS_URL=https://script.google.com/macros/s/.../exec
```

3. Jalankan frontend:

```bash
cd frontend
npm run dev
```

---

## Testing

Test koneksi dengan curl:

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"action":"getAllSiswa"}'
```

Response sukses:
```json
{
  "success": true,
  "data": [
    { "NIS": "2024001", "Nama_Siswa": "Ahmad Fauzi", "Kelas": "X-A" }
  ]
}
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `Spreadsheet ID not found` | Pastikan SPREADSHEET_ID benar |
| `Sheet "..." tidak ditemukan` | Pastikan nama tab sheets PERSIS (case-sensitive, spasi) |
| `Cloud Vision API error` | Pastikan API Key sudah di-restrict dan Vision API sudah di-enable |
| `Gemini API error` | Pastikan GEMINI_API_KEY valid dan kuota tidak habis |
| `CORS error` | Frontend menggunakan `Content-Type: text/plain` untuk menghindari preflight |
| `401 Unauthorized` | Pastikan web app di-deploy dengan "Anyone" access |
