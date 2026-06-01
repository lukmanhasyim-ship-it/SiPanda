import { callGAS } from './gas'

export async function fetchAllMapel() {
  const res = await callGAS({ action: 'getAllMapel' })
  return res.data
}

export async function addMapel(mapel) {
  const res = await callGAS({ action: 'addMapel', mapel })
  return res.data
}

export async function deleteMapel(mapel) {
  const res = await callGAS({ action: 'deleteMapel', mapel })
  return res.data
}

export async function importMapel(rows) {
  const res = await callGAS({ action: 'importMapel', rows })
  return res.data
}
