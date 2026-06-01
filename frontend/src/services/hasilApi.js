import { callGAS } from './gas'

export async function fetchRiwayatHasil(limit = 50) {
  const res = await callGAS({ action: 'getRiwayatHasil', limit })
  return res.data
}

export async function processAnswer({ imageBase64, nis, kelas, mapel, fileName }) {
  if (!imageBase64) throw new Error('Gambar tidak ditemukan')

  return callGAS({
    action: 'processAnswer',
    image: imageBase64,
    nis,
    kelas,
    mapel,
    fileName,
  })
}
