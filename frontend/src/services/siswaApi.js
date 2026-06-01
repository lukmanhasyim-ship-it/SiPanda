import { callGAS } from './gas'

export async function fetchAllSiswa() {
  const res = await callGAS({ action: 'getAllSiswa' })
  return res.data
}

export async function fetchSiswaByKelas(kelas) {
  const res = await callGAS({ action: 'getSiswaByKelas', kelas })
  return res.data
}

export async function addSiswa({ nis, nama, kelas }) {
  const res = await callGAS({ action: 'addSiswa', nis, nama, kelas })
  return res.data
}

export async function updateSiswa(nis, { nama, kelas }) {
  const res = await callGAS({ action: 'updateSiswa', nis, nama, kelas })
  return res.data
}

export async function deleteSiswa(nis) {
  const res = await callGAS({ action: 'deleteSiswa', nis })
  return res.data
}

export async function importSiswa(rows) {
  const res = await callGAS({ action: 'importSiswa', rows })
  return res.data
}
