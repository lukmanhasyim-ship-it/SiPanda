const STORAGE_KEY = 'sipanda_rubrik'

let rubrikCache = null

function load() {
  if (rubrikCache) return rubrikCache
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      rubrikCache = JSON.parse(stored)
      return rubrikCache
    }
  } catch (e) {
    console.warn('[RubrikStore] Gagal baca localStorage, pakai default')
  }
  rubrikCache = []
  save()
  return rubrikCache
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rubrikCache))
  } catch (e) {
    console.error('[RubrikStore] Gagal simpan ke localStorage', e)
  }
}

function generateId() {
  return 'r' + Date.now() + Math.random().toString(36).slice(2, 6)
}

export function getAllRubrik() {
  return JSON.parse(JSON.stringify(load()))
}

export function getRubrikByKelasMapel(kelas, mapel) {
  const data = load()
  return data.find((r) => r.kelas === kelas && r.mapel === mapel) || null
}

export function createRubrik({ kelas, mapel, aspek }) {
  const data = load()
  const existing = data.find((r) => r.kelas === kelas && r.mapel === mapel)
  if (existing) {
    throw new Error(`Rubrik untuk ${kelas} - ${mapel} sudah ada`)
  }
  const newRubrik = { id: generateId(), kelas, mapel, aspek: aspek || [] }
  data.push(newRubrik)
  rubrikCache = data
  save()
  return JSON.parse(JSON.stringify(newRubrik))
}

export function updateRubrik(id, { kelas, mapel, aspek }) {
  const data = load()
  const idx = data.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error('Rubrik tidak ditemukan')

  const duplicate = data.find((r) => r.id !== id && r.kelas === kelas && r.mapel === mapel)
  if (duplicate) {
    throw new Error(`Rubrik untuk ${kelas} - ${mapel} sudah ada`)
  }

  data[idx] = { ...data[idx], kelas, mapel, aspek: aspek || [] }
  rubrikCache = data
  save()
  return JSON.parse(JSON.stringify(data[idx]))
}

export function deleteRubrik(id) {
  const data = load()
  rubrikCache = data.filter((r) => r.id !== id)
  save()
}
