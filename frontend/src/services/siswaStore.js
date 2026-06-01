const STORAGE_KEY = 'sipanda_siswa'

let cache = null

function load() {
  if (cache) return cache
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      cache = JSON.parse(stored)
      return cache
    }
  } catch (e) {
    console.warn('[SiswaStore] Gagal baca localStorage')
  }
  cache = {}
  return cache
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('[SiswaStore] Gagal simpan', e)
  }
}

export function getAllSiswa() {
  const data = load()
  return Object.entries(data).map(([nis, s]) => ({ nis, ...s }))
}

export function getSiswaByNis(nis) {
  const data = load()
  const s = data[nis]
  return s ? { nis, ...s } : null
}

export function getSiswaByKelas(kelas) {
  const data = load()
  return Object.entries(data)
    .filter(([_, s]) => s.kelas === kelas)
    .map(([nis, s]) => ({ nis, ...s }))
}

export function createSiswa({ nis, nama, kelas }) {
  const data = load()
  const nisKey = String(nis).trim()
  if (!nisKey) throw new Error('NIS harus diisi')
  if (data[nisKey]) throw new Error(`NIS ${nisKey} sudah terdaftar`)
  data[nisKey] = { nama: nama.trim(), kelas: kelas.trim() }
  cache = data
  save()
  return { nis: nisKey, ...data[nisKey] }
}

export function updateSiswa(nis, { nama, kelas }) {
  const data = load()
  const nisKey = String(nis).trim()
  if (!data[nisKey]) throw new Error(`NIS ${nisKey} tidak ditemukan`)
  data[nisKey] = { nama: nama.trim(), kelas: kelas.trim() }
  cache = data
  save()
  return { nis: nisKey, ...data[nisKey] }
}

export function deleteSiswa(nis) {
  const data = load()
  const nisKey = String(nis).trim()
  if (!data[nisKey]) throw new Error(`NIS ${nisKey} tidak ditemukan`)
  delete data[nisKey]
  cache = data
  save()
}

export function getUniqueKelas() {
  const data = load()
  const kelasSet = new Set(Object.values(data).map((s) => s.kelas))
  return [...kelasSet].sort()
}
