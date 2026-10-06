import { callGAS } from './gas'

export async function fetchRiwayatHasil(limit = 50) {
  const res = await callGAS({ action: 'getRiwayatHasil', limit })
  return res.data
}

export async function fetchTeacherDashboard() {
  try {
    const res = await callGAS({ action: 'getTeacherDashboard' })
    if (res && res.data) return res.data
  } catch {
    // fallback to individual calls
  }
  const [siswaRes, kelasRes, mapelRes, hasilRes] = await Promise.allSettled([
    callGAS({ action: 'getAllSiswa' }),
    callGAS({ action: 'getAllKelas' }),
    callGAS({ action: 'getAllMapel' }),
    callGAS({ action: 'getRiwayatHasil', limit: 100 }),
  ])
  return {
    siswa: siswaRes.status === 'fulfilled' && siswaRes.value ? siswaRes.value.data || [] : [],
    kelas: kelasRes.status === 'fulfilled' && kelasRes.value ? kelasRes.value.data || [] : [],
    mapel: mapelRes.status === 'fulfilled' && mapelRes.value ? mapelRes.value.data || [] : [],
    hasil: hasilRes.status === 'fulfilled' && hasilRes.value ? hasilRes.value.data || [] : [],
  }
}

export async function checkDatabaseConnection() {
  const res = await callGAS({ action: 'checkConnection' })
  return res.data
}

export async function fetchStudentDashboard() {
  const res = await callGAS({ action: 'getStudentDashboard' })
  return res.data
}

export async function processAnswer({ images, imageBase64, nis, kelas, mapel, fileName }) {
  if ((!images || images.length === 0) && !imageBase64) throw new Error('Gambar tidak ditemukan')

  const imagePages = (images || []).map((image) => {
    if (typeof image === 'string') return image
    return `data:${image.mimeType || 'image/jpeg'};base64,${image.data}`
  })
  const legacyImage = imageBase64 || (images?.[0] && (images[0].data || images[0]))

  return callGAS({
    action: 'processAnswer',
    images: imagePages,
    image: legacyImage,
    nis,
    kelas,
    mapel,
    fileName,
  })
}

export async function fetchSoalByMapel(kelas, mapel) {
  const res = await callGAS({ action: 'getSoalByMapel', kelas, mapel })
  return res.data
}

export async function submitAssessmentReview({ jawaban, aiResult }) {
  return callGAS({ action: 'submitAssessmentReview', jawaban, aiResult })
}
