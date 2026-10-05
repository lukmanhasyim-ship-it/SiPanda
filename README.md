# SiPanda

SiPanda adalah aplikasi web untuk membantu guru menilai lembar jawaban siswa dengan pendekatan AI-assisted review. Aplikasi ini menggabungkan proses skoring otomatis, verifikasi manual oleh guru, dan pengelolaan data siswa, kelas, mapel, rubrik, serta kunci soal dalam satu sistem berbasis Google Workspace.

## Ringkasan aplikasi

SiPanda dibuat untuk menangani alur kerja berikut:

1. Guru login menggunakan akun Google.
2. Guru mengunggah foto lembar jawaban siswa.
3. Sistem melakukan proses OCR dan deteksi jawaban menggunakan Gemini.
4. Lembar jawaban dipresentasikan ke layar verifikasi guru.
5. Guru dapat mengoreksi jawaban pilihan ganda secara manual, menilai skor uraian, dan meninjau nilai akhir sebelum disimpan.
6. Hasil penilaian disimpan ke Google Sheets untuk keperluan riwayat dan laporan.

## Fitur utama

### Penilaian dan verifikasi
- Upload lembar jawaban siswa dalam bentuk gambar
- Mendukung analisis satu lembar yang berisi pilihan ganda dan uraian sekaligus
- Layar verifikasi jawaban PG sebelum data disimpan
- Dropdown pilihan jawaban siswa: A, B, C, D, E, atau kosong (`-`)
- Jawaban kosong tidak dihitung dalam penilaian PG
- Nilai akhir otomatis berubah saat guru mengubah jawaban atau skor essay
- Skor uraian berbasis rubrik per aspek
- Ringkasan hasil sebelum simpan

### Manajemen data
- Kelola siswa per kelas
- Kelola kelas
- Kelola mapel
- Kelola rubrik penilaian per kelas dan mapel
- Kelola data kunci soal pilihan ganda per kelas dan mapel
- Import data siswa, rubrik, dan kunci soal dari Excel

### Riwayat dan hasil
- Lihat riwayat hasil penilaian
- Lihat detail hasil per siswa dan per mapel
- Menampilkan informasi nilai akhir, nilai PG, dan nilai uraian

### Keamanan dan login
- Login dengan Google/OAuth
- Sesi pengguna disimpan di browser lokal
- Autentikasi dipertahankan saat memanggil backend Apps Script

## Alur kerja pengguna

### 1. Login
Guru masuk melalui halaman login Google. Setelah login berhasil, aplikasi menampilkan menu utama.

### 2. Unggah lembar jawaban
Guru memilih kelas, mapel, dan siswa, lalu mengunggah foto lembar jawaban. Sistem memvalidasi gambar dan mengirimkan payload ke backend.

### 3. Verifikasi hasil AI
Pada tampilan verifikasi:
- jawaban pilihan ganda ditampilkan per nomor,
- guru dapat melengkapi atau memperbaiki jawaban manual,
- skor essay ditampilkan per aspek,
- guru dapat menyesuaikan skor sesuai rubrik,
- nilai akhir diperbarui otomatis.

### 4. Simpan hasil
Setelah yakin dengan hasil verifikasi, guru menekan tombol simpan. Data lalu diproses dan disimpan ke database Google Sheets.

## Arsitektur sistem

```text
Frontend (React + Vite)
    │
    ├── Login
    ├── Upload Form
    ├── Verifikasi Lembar
    ├── Manager Siswa / Kelas / Mapel / Rubrik
    ├── History
    └── Result Card
    │
    ▼
Google Apps Script
    │
    ├── GeminiService.gs -> OCR + deteksi jawaban
    ├── Code.gs -> endpoint API & routing
    └── SheetsService.gs -> CRUD data ke Google Sheets
    │
    ▼
Google Sheets
    ├── Database Siswa
    ├── Database Kelas
    ├── Database Mapel
    ├── Database Rubrik
    ├── Database Soal
    └── Hasil Penilaian
```

## Stacks yang digunakan

### Frontend
- React
- Vite
- Tailwind CSS
- SheetJS (xlsx) untuk import Excel

### Backend
- Google Apps Script
- Google Gemini API
- Google Sheets

### Deployment
- Firebase Hosting

## Struktur repository

```text
SiPanda/
├── apps-script/
│   ├── Code.gs
│   ├── GeminiService.gs
│   ├── SheetsService.gs
│   ├── GUIDE.md
│   ├── appsscript.json
│   └── .clasp.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── firebase.json
├── README.md
├── RPD.txt
└── .gitignore
```

## Prasyarat

- Node.js 20+
- npm atau pnpm
- Akun Google yang dapat mengakses Apps Script
- Google Gemini API Key
- Spreadsheet Google yang sudah disiapkan dan dihubungkan dengan Apps Script

## Setup lokal

### 1. Clone repository

```bash
git clone https://github.com/your-username/SiPanda.git
cd SiPanda
```

### 2. Install dependency frontend

```bash
cd frontend
npm install
```

### 3. Jalankan frontend lokal

```bash
npm run dev
```

### 4. Build frontend

```bash
npm run build
```

### 5. Konfigurasi backend Apps Script

Ikuti panduan di [apps-script/GUIDE.md](apps-script/GUIDE.md) untuk:
- membuat spreadsheet database,
- menyiapkan tab data,
- mendaftarkan Gemini API key,
- mendeploy Apps Script,
- mengatur endpoint web app.

### 6. Variabel lingkungan frontend

Untuk produksi, frontend memerlukan variabel berikut:

```bash
VITE_GAS_URL=https://script.google.com/macros/s/your-deployment/exec
```

Pada mode development, aplikasi bisa memakai endpoint lokal sesuai konfigurasi yang dipasang. Di repo ini, `import.meta.env.DEV` digunakan untuk menentukan URL backend sementara.

## Fitur yang berhubungan langsung dengan alur saat ini

Aplikasi saat ini memiliki flow yang lebih konkret daripada sekadar AI scoring. Data di frontend menunjukkan alur berikut:

- login dengan Google,
- upload gambar lembar jawaban,
- pilih kelas, mapel, dan siswa,
- proses scan jawaban ke backend,
- tampilkan hasil verifikasi guru,
- koreksi jawaban PG, skor essay, dan ringkasan nilai,
- simpan hasil ke Sheets,
- lihat history dan hasil sebelumnya.

## Catatan penting

- Jawaban PG harus dipilih dari opsi valid A/B/C/D/E.
- Jawaban kosong atau `-` tidak dihitung dalam komponen PG.
- Nilai akhir dihitung dari data yang tersedia dan akan berubah otomatis saat guru melakukan koreksi.
- Aplikasi masih mengandalkan hasil deteksi AI sebagai starting point, tetapi guru tetap memiliki kendali dalam memverifikasi hasil sebelum data disimpan.

## Lisensi

Proyek ini dibuat untuk kebutuhan penilaian siswa di lingkungan pendidikan dan dapat dikembangkan lebih lanjut sesuai kebutuhan institusi.
