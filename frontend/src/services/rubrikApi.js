import { callGAS } from './gas'

export async function fetchAllRubrik() {
  const res = await callGAS({ action: 'getAllRubrik' })
  return res.data
}

export async function fetchRubrikByKelasMapel(kelas, mapel) {
  const res = await callGAS({ action: 'getRubrikByKelasMapel', kelas, mapel })
  return res.data
}

export async function addRubrik({ kelas, mapel, aspek }) {
  const res = await callGAS({ action: 'addRubrik', kelas, mapel, aspek })
  return res.data
}

export async function updateRubrik(kelas, mapel, { kelasBaru, mapelBaru, aspek }) {
  const res = await callGAS({ action: 'updateRubrik', kelas, mapel, kelasBaru, mapelBaru, aspek })
  return res.data
}

export async function deleteRubrik(kelas, mapel) {
  const res = await callGAS({ action: 'deleteRubrik', kelas, mapel })
  return res.data
}

export async function importRubrik(rows) {
  const res = await callGAS({ action: 'importRubrik', rows })
  return res.data
}
