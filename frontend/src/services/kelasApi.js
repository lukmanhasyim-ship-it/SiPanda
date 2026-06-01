import { callGAS } from './gas'

export async function fetchAllKelas() {
  const res = await callGAS({ action: 'getAllKelas' })
  return res.data
}

export async function addKelas(kelas) {
  const res = await callGAS({ action: 'addKelas', kelas })
  return res.data
}

export async function deleteKelas(kelas) {
  const res = await callGAS({ action: 'deleteKelas', kelas })
  return res.data
}
