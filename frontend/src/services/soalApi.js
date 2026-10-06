import { callGAS } from './gas'

export async function fetchAllSoal() {
  const res = await callGAS({ action: 'getAllSoal' })
  return res.data
}

export async function addSoal({ kelas, mapel, nomor, kunci }) {
  const res = await callGAS({ action: 'addSoal', kelas, mapel, nomor, kunci })
  return res.data
}

export async function deleteSoal({ kelas, mapel, nomor }) {
  const res = await callGAS({ action: 'deleteSoal', kelas, mapel, nomor })
  return res.data
}
