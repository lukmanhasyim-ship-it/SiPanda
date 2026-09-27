# Sipanda — Sistem Penilaian Jawaban Siswa Berbasis AI

Sipanda adalah aplikasi berbasis web untuk menilai jawaban siswa secara otomatis menggunakan **Google Gemini AI**. Guru cukup memotret/mengunggah gambar jawaban siswa, dan AI akan menilai berdasarkan rubrik yang telah ditentukan.

## Fitur

- **Penilaian Otomatis** — Upload gambar jawaban siswa, AI membaca (OCR) dan menilai berdasarkan rubrik
- **Manajemen Siswa** — CRUD data siswa (NIS, Nama, Kelas)
- **Manajemen Rubrik** — Buat rubrik penilaian per kelas & mata pelajaran (4 level skor)
- **Manajemen Kelas & Mapel** — Kelola data kelas dan mata pelajaran
- **Riwayat Penilaian** — Lihat history penilaian lengkap dengan detail skor analitik
- **Import Excel** — Import data siswa, rubrik, dan mapel dari file Excel
- **Autentikasi Google** — Login dengan akun `@guru.smk.belajar.id`
- **Hosting Firebase** — Frontend SPA di-deploy ke Firebase Hosting

## Arsitektur

```
┌─────────────────────┐       ┌──────────────────────────────┐
│   React Frontend    │──────▶│  Google Apps Script Backend  │
│   (Vite + Tailwind) │       │  (Code.gs, GeminiService,    │
│                     │       │   SheetsService)              │
└─────────────────────┘       └──────────┬───────────────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │           Google Sheets        │
                          │  Database_Siswa, Rubrik, Hasil │
                          └───────────────────────────────┘
```

## Tech Stack

### Frontend
- **React 19** + **Vite 8**
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **SheetJS (xlsx)** — Import Excel

### Backend (Google Apps Script)
- **Google Sheets** — Database
- **Google Gemini API** — OCR & Penilaian jawaban
- **Google OAuth2** — Autentikasi guru

### Deployment
- **Firebase Hosting** — Frontend SPA

## Struktur Proyek

```
├── frontend/                  # Aplikasi React
│   ├── src/
│   │   ├── components/        # Komponen UI (Layout, UploadForm, ResultCard, dll.)
│   │   ├── services/          # API calls, auth store, dll.
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── dist/                  # Build output
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── apps-script/               # Backend Google Apps Script
│   ├── Code.gs                # Entry point & routing
│   ├── GeminiService.gs       # Gemini OCR & penilaian
│   ├── SheetsService.gs       # CRUD Google Sheets
│   ├── appsscript.json        # Manifest
│   └── .clasp.json            # Clasp config
├── firebase.json              # Firebase hosting config
└── .firebaserc                # Firebase project
```

## Setup & Instalasi

### Prasyarat
- Node.js 20+
- Akun Google (`@guru.smk.belajar.id`)
- API Key Google Gemini
- Google Sheets (sebagai database)

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd Ujian/frontend
npm install
```

### 2. Setup Backend (Google Apps Script)

Ikuti panduan lengkap di [`apps-script/GUIDE.md`](apps-script/GUIDE.md):
1. Buat Google Sheets dengan tab `Database_Siswa`, `Database_Rubrik`, `Hasil_Penilaian`, `Database_Kelas`, `Database_Mapel`, `Database_Guru`
2. Dapatkan Gemini API Key
3. Deploy Apps Script sebagai Web App
4. Set script properties: `SPREADSHEET_ID`, `GEMINI_API_KEY`

### 3. Konfigurasi Frontend

```bash
# frontend/.env
VITE_GAS_URL=https://script.google.com/macros/s/.../exec
```

### 4. Jalankan

```bash
npm run dev
```

### 5. Build & Deploy

```bash
npm run build
firebase deploy
```

## API Endpoints

Semua komunikasi melalui `POST` ke Google Apps Script Web App:

| Action | Deskripsi |
|---|---|
| `processAnswer` | Proses penilaian jawaban siswa (upload gambar) |
| `getAllSiswa` | Ambil semua data siswa |
| `getSiswaByKelas` | Ambil siswa berdasarkan kelas |
| `addSiswa` / `updateSiswa` / `deleteSiswa` | CRUD siswa |
| `getAllRubrik` / `getRubrikByKelasMapel` | Ambil rubrik |
| `addRubrik` / `updateRubrik` / `deleteRubrik` | CRUD rubrik |
| `getAllKelas` / `addKelas` / `deleteKelas` | CRUD kelas |
| `getAllMapel` / `addMapel` / `deleteMapel` / `importMapel` | CRUD mapel |
| `getRiwayatHasil` | Riwayat penilaian |
| `verifyGoogleToken` | Verifikasi token Google |

## Screenshot

> *(tambahkan screenshot aplikasi di sini)*

## Lisensi

Proyek ini dikembangkan untuk keperluan pendidikan SMK.
