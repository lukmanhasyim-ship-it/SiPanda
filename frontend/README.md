# SiPanda Frontend

Frontend SiPanda dibangun dengan React dan Vite untuk mengelola keseluruhan alur kerja penilaian. Fokus utama aplikasi adalah login guru, upload lembar jawaban, verifikasi hasil AI, koreksi jawaban manual, dan penyimpanan hasil penilaian.

## Struktur utama

- `src/components` — komponen UI utama seperti login, upload, verifikasi lembar, manager data, history, dan hasil
- `src/services` — komunikasi ke Apps Script dan autentikasi
- `src/utils` — helper untuk perhitungan nilai dan grade

## Flow kerja yang ada di frontend

1. Login guru
2. Pilih kelas, mapel, dan siswa
3. Unggah foto lembar jawaban
4. Meninjau hasil deteksi AI
5. Mengoreksi jawaban PG dan skor essay
6. Menyimpan hasil penilaian
7. Melihat riwayat hasil sebelumnya

## Perintah umum

```bash
npm install
npm run dev
npm run build
```

## Konfigurasi backend

Frontend memanggil backend melalui variabel environment:

```bash
VITE_GAS_URL=https://script.google.com/macros/s/your-deployment/exec
```

Pada mode development, aplikasi biasanya memakai endpoint `/gas` sesuai konfigurasi local yang sudah disiapkan.

## Fitur penting frontend

- Input pilihan ganda menggunakan dropdown A-E
- Opsi kosong memakai `-` dan tidak dihitung dalam skor PG
- Nilai akhir otomatis berubah setelah koreksi manual guru
- Manager data tersedia untuk siswa, kelas, mapel, rubrik, dan soal
- History dan hasil penilaian dilakukan di sisi frontend berbasis API backend

## Catatan pengembangan

Proyek frontend ini bukan template default Vite. UI dan alur kerja sudah disesuaikan untuk kebutuhan proses penilaian siswa berbasis AI dan verifikasi guru.
