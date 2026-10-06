# Sipanda Frontend

Frontend aplikasi Sipanda dibangun dengan React dan Vite untuk mendukung proses penilaian jawaban siswa secara digital. Aplikasi ini menggabungkan autentikasi Google, unggah lembar jawaban, proses evaluasi berbasis backend, koreksi manual oleh guru, serta pengelolaan data siswa, kelas, mapel, dan rubrik.

## Ringkasan aplikasi

Sipanda adalah dashboard penilaian jawaban siswa yang dipakai guru untuk:

- masuk ke sistem dengan akun Google
- memilih kelas, mata pelajaran, dan siswa
- mengunggah foto lembar jawaban
- memproses hasil evaluasi melalui backend Apps Script
- meninjau hasil AI dan melakukan koreksi manual jika diperlukan
- melihat riwayat hasil penilaian
- mengelola data referensi seperti siswa, kelas, mapel, dan rubrik

## Fitur utama

- Autentikasi pengguna berbasis Google
- Form unggah lembar jawaban dengan validasi file gambar
- Pilihan kelas dan mata pelajaran dinamis
- Pemilihan siswa berdasarkan kelas
- Proses penilaian jawaban dari frontend ke backend
- Review hasil penilaian dan koreksi skor manual
- Manajemen data siswa, kelas, mapel, dan rubrik
- Import data siswa/rubrik yang sudah disiapkan
- Riwayat hasil penilaian untuk setiap siswa
- Navigasi dashboard untuk Penilaian, Siswa, Rubrik, Kelas, Mapel, dan Riwayat

## Alur kerja aplikasi

1. Guru login menggunakan akun Google.
2. Pilih menu Penilaian lalu tentukan kelas dan mata pelajaran.
3. Pilih siswa yang akan dinilai.
4. Unggah foto lembar jawaban siswa.
5. Frontend mengirim data ke backend untuk diproses.
6. Hasil evaluasi ditampilkan dan bisa dikoreksi kembali oleh guru.
7. Hasil akhir disimpan dan dapat dilihat di menu Riwayat.

## Struktur proyek

- `src/App.jsx` — entry utama aplikasi dan navigasi antar menu
- `src/components/` — komponen UI: login, upload, hasil, dan manager data
- `src/services/` — autentikasi, API backend, serta fungsi ke Apps Script
- `public/` — aset statis
- `vite.config.js` — konfigurasi Vite dan proxy untuk backend `/gas`

## Perintah pengembangan

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Konfigurasi backend

Frontend berkomunikasi dengan backend melalui endpoint Apps Script. Pada mode development, Vite mem-proxy request ke `/gas` seperti yang diatur di `vite.config.js`.

Untuk deployment production, bisa diatur variabel environment berikut:

```bash
VITE_GAS_URL=https://script.google.com/macros/s/your-deployment/exec
```

Jika `VITE_GAS_URL` tidak diisi, aplikasi akan mengirim permintaan ke endpoint default yang sudah diatur sesuai environment.

## Teknologi yang dipakai

- React 19
- Vite
- Tailwind CSS
- Google authentication via token verification
- Google Apps Script sebagai backend service
- XLSX untuk kebutuhan import data

## Catatan

README ini disesuaikan dengan arsitektur aplikasi yang saat ini aktif di frontend. Fokus utamanya adalah proses penilaian jawaban siswa dengan integrasi AI dan kontrol manual dari guru.
