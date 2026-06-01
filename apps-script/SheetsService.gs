/**
 * SheetsService — Operasi CRUD Google Sheets
 *
 * Tabs:
 *   Database_Siswa : NIS | Nama_Siswa | Kelas
 *   Database_Rubrik: Kelas | Mapel | Aspek_Penilaian | Skor_4 | Skor_3 | Skor_2 | Skor_1
 *   Hasil_Penilaian: Timestamp | NIS | Nama_Siswa | Kelas | Mapel | Hasil_OCR | Skor_Analitik | Feedback_AI | Rekomendasi | Total_Skor | Total_Maks
 *   Database_Kelas : Kelas
 *   Database_Mapel : Mapel
 *   Database_Guru  : Nama_Guru | Email
 */

function _getSheet(name, headers) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
  var sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    if (headers) sheet.appendRow(headers)
  }
  return sheet
}

var SHEET_HEADERS = {
  Database_Siswa: ['NIS', 'Nama_Siswa', 'Kelas'],
  Database_Rubrik: ['Kelas', 'Mapel', 'Aspek_Penilaian', 'Skor_4', 'Skor_3', 'Skor_2', 'Skor_1'],
  Hasil_Penilaian: ['Timestamp', 'NIS', 'Nama_Siswa', 'Kelas', 'Mapel', 'Hasil_OCR', 'Skor_Analitik', 'Feedback_AI', 'Rekomendasi', 'Total_Skor', 'Total_Maks'],
  Database_Kelas: ['Kelas'],
  Database_Mapel: ['Mapel'],
  Database_Guru: ['Nama_Guru', 'Email'],
}

function _getDataRange(name) {
  var sheet = _getSheet(name, SHEET_HEADERS[name])
  var range = sheet.getDataRange()
  var values = range.getValues()
  if (values.length < 2) return []
  var headers = values[0]
  var rows = []
  for (var i = 1; i < values.length; i++) {
    var row = {}
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j]
    }
    rows.push(row)
  }
  return rows
}

// ── Siswa ────────────────────────────────────────────

function getAllSiswa() {
  var rows = _getDataRange(SHEET_NAMES.SISWA)
  var result = []
  for (var i = 0; i < rows.length; i++) {
    result.push({
      nis: String(rows[i]['NIS'] || '').trim(),
      nama: String(rows[i]['Nama_Siswa'] || '').trim(),
      kelas: String(rows[i]['Kelas'] || '').trim(),
    })
  }
  return result
}

function getSiswaByNis(nis) {
  var rows = _getDataRange(SHEET_NAMES.SISWA)
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['NIS']).trim() === String(nis).trim()) {
      return {
        nis: String(rows[i]['NIS']).trim(),
        nama: String(rows[i]['Nama_Siswa'] || '').trim(),
        kelas: String(rows[i]['Kelas'] || '').trim(),
      }
    }
  }
  return null
}

function getSiswaByKelas(kelas) {
  var all = _getDataRange(SHEET_NAMES.SISWA)
  var result = []
  for (var i = 0; i < all.length; i++) {
    if (String(all[i]['Kelas']).trim() === String(kelas).trim()) {
      result.push({
        nis: String(all[i]['NIS']).trim(),
        nama: String(all[i]['Nama_Siswa'] || '').trim(),
        kelas: String(all[i]['Kelas'] || '').trim(),
      })
    }
  }
  return result
}

function addSiswa(nis, nama, kelas) {
  var sheet = _getSheet(SHEET_NAMES.SISWA)
  sheet.appendRow([nis, nama, kelas])
  return { nis: nis, nama: nama, kelas: kelas }
}

function updateSiswa(nis, nama, kelas) {
  var sheet = _getSheet(SHEET_NAMES.SISWA)
  var data = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(nis).trim()) {
      sheet.getRange(i + 1, 2).setValue(nama)
      sheet.getRange(i + 1, 3).setValue(kelas)
      return { nis: nis, nama: nama, kelas: kelas }
    }
  }
  throw new Error('Siswa dengan NIS ' + nis + ' tidak ditemukan')
}

function deleteSiswa(nis) {
  var sheet = _getSheet(SHEET_NAMES.SISWA)
  var data = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(nis).trim()) {
      sheet.deleteRow(i + 1)
      return true
    }
  }
  throw new Error('Siswa dengan NIS ' + nis + ' tidak ditemukan')
}

function importSiswa(rows) {
  var sheet = _getSheet(SHEET_NAMES.SISWA)
  var added = 0
  for (var i = 0; i < rows.length; i++) {
    var nis = String(rows[i].nis || rows[i].NIS || '').trim()
    var nama = String(rows[i].nama || rows[i].Nama_Siswa || rows[i].nama_siswa || '').trim()
    var kelas = String(rows[i].kelas || rows[i].Kelas || '').trim()
    if (!nis || !nama || !kelas) continue
    sheet.appendRow([nis, nama, kelas])
    added++
  }
  return added
}

// ── Rubrik ────────────────────────────────────────────

function getRubrikByKelasMapel(kelas, mapel) {
  var rows = _getDataRange(SHEET_NAMES.RUBRIK)
  var aspek = []
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i]
    if (String(r['Kelas']).trim() === String(kelas).trim() && String(r['Mapel']).trim() === String(mapel).trim()) {
      aspek.push({
        nama: String(r['Aspek_Penilaian'] || '').trim(),
        skor_4: String(r['Skor_4'] || '').trim(),
        skor_3: String(r['Skor_3'] || '').trim(),
        skor_2: String(r['Skor_2'] || '').trim(),
        skor_1: String(r['Skor_1'] || '').trim(),
      })
    }
  }
  if (aspek.length === 0) return null
  return { kelas: kelas, mapel: mapel, aspek: aspek }
}

function getAllRubrik() {
  var rows = _getDataRange(SHEET_NAMES.RUBRIK)
  var map = {}
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i]
    var key = String(r['Kelas']).trim() + '|' + String(r['Mapel']).trim()
    if (!map[key]) {
      map[key] = { kelas: String(r['Kelas']).trim(), mapel: String(r['Mapel']).trim(), aspek: [] }
    }
    map[key].aspek.push({
      nama: String(r['Aspek_Penilaian'] || '').trim(),
      skor_4: String(r['Skor_4'] || '').trim(),
      skor_3: String(r['Skor_3'] || '').trim(),
      skor_2: String(r['Skor_2'] || '').trim(),
      skor_1: String(r['Skor_1'] || '').trim(),
    })
  }
  var result = []
  for (var key in map) result.push(map[key])
  return result
}

function addRubrik(kelas, mapel, aspek) {
  var sheet = _getSheet(SHEET_NAMES.RUBRIK)
  for (var i = 0; i < aspek.length; i++) {
    sheet.appendRow([
      kelas, mapel,
      aspek[i].nama,
      aspek[i].skor_4 || '',
      aspek[i].skor_3 || '',
      aspek[i].skor_2 || '',
      aspek[i].skor_1 || '',
    ])
  }
  return { kelas: kelas, mapel: mapel, aspek: aspek }
}

function deleteRubrik(kelas, mapel) {
  var sheet = _getSheet(SHEET_NAMES.RUBRIK)
  var data = sheet.getDataRange().getValues()
  var deleted = 0
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === String(kelas).trim() && String(data[i][1]).trim() === String(mapel).trim()) {
      sheet.deleteRow(i + 1)
      deleted++
    }
  }
  if (deleted === 0) throw new Error('Rubrik untuk ' + kelas + ' - ' + mapel + ' tidak ditemukan')
  return true
}

function importRubrik(rows) {
  var sheet = _getSheet(SHEET_NAMES.RUBRIK)
  var added = 0
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i]
    var kelas = String(r.kelas || r.Kelas || '').trim()
    var mapel = String(r.mapel || r.Mapel || r.Mata_Pelajaran || '').trim()
    var aspek = String(r.aspek_penilaian || r.Aspek_Penilaian || r.aspek || '').trim()
    var skor4 = String(r.skor_4 || r.Skor_4 || '').trim()
    var skor3 = String(r.skor_3 || r.Skor_3 || '').trim()
    var skor2 = String(r.skor_2 || r.Skor_2 || '').trim()
    var skor1 = String(r.skor_1 || r.Skor_1 || '').trim()
    if (!kelas || !mapel || !aspek) continue
    sheet.appendRow([kelas, mapel, aspek, skor4, skor3, skor2, skor1])
    added++
  }
  return added
}

// ── Kelas ─────────────────────────────────────────────

function getAllKelas() {
  var rows = _getDataRange(SHEET_NAMES.KELAS)
  var result = []
  for (var i = 0; i < rows.length; i++) {
    var nama = String(rows[i]['Kelas'] || '').trim()
    if (nama) result.push(nama)
  }
  return result
}

function addKelas(kelas) {
  var sheet = _getSheet(SHEET_NAMES.KELAS)
  sheet.appendRow([kelas])
  return { kelas: kelas }
}

function deleteKelas(kelas) {
  var sheet = _getSheet(SHEET_NAMES.KELAS)
  var data = sheet.getDataRange().getValues()
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === String(kelas).trim()) {
      sheet.deleteRow(i + 1)
      return true
    }
  }
  throw new Error('Kelas ' + kelas + ' tidak ditemukan')
}

// ── Mapel ──────────────────────────────────────────────

function getAllMapel() {
  var rows = _getDataRange(SHEET_NAMES.MAPEL)
  var result = []
  for (var i = 0; i < rows.length; i++) {
    var nama = String(rows[i]['Mapel'] || rows[i]['Mata_Pelajaran'] || rows[i]['mapel'] || '').trim()
    if (nama) result.push(nama)
  }
  return result
}

function addMapel(mapel) {
  var sheet = _getSheet(SHEET_NAMES.MAPEL)
  sheet.appendRow([mapel])
  return { mapel: mapel }
}

function deleteMapel(mapel) {
  var sheet = _getSheet(SHEET_NAMES.MAPEL)
  var data = sheet.getDataRange().getValues()
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === String(mapel).trim()) {
      sheet.deleteRow(i + 1)
      return true
    }
  }
  throw new Error('Mapel ' + mapel + ' tidak ditemukan')
}

function importMapel(rows) {
  var sheet = _getSheet(SHEET_NAMES.MAPEL)
  var added = 0
  for (var i = 0; i < rows.length; i++) {
    var nama = String(rows[i].mapel || rows[i].Mapel || rows[i].Mata_Pelajaran || rows[i].nama || '').trim()
    if (!nama) continue
    sheet.appendRow([nama])
    added++
  }
  return added
}

// ── Hasil Penilaian ────────────────────────────────────

function simpanHasil(data) {
  var sheet = _getSheet(SHEET_NAMES.HASIL)
  sheet.appendRow([
    new Date(),
    data.nis || '',
    data.namaSiswa || '',
    data.kelas || '',
    data.mapel || '',
    data.hasilOCR || '',
    data.skorAnalitik || '',
    data.feedbackAI || '',
    data.rekomendasi || '',
    data.totalSkor || 0,
    data.totalMaks || 0,
  ])
}

function getRiwayatHasil(limit) {
  limit = limit || 50
  var rows = _getDataRange(SHEET_NAMES.HASIL)
  var result = []
  for (var i = rows.length - 1; i >= 0 && result.length < limit; i--) {
    result.push({
      timestamp: rows[i]['Timestamp'],
      nis: String(rows[i]['NIS'] || '').trim(),
      namaSiswa: String(rows[i]['Nama_Siswa'] || '').trim(),
      kelas: String(rows[i]['Kelas'] || '').trim(),
      mapel: String(rows[i]['Mapel'] || '').trim(),
      hasilOCR: String(rows[i]['Hasil_OCR'] || '').trim(),
      skorAnalitik: String(rows[i]['Skor_Analitik'] || '').trim(),
      feedbackAI: String(rows[i]['Feedback_AI'] || '').trim(),
      rekomendasi: String(rows[i]['Rekomendasi'] || '').trim(),
      totalSkor: Number(rows[i]['Total_Skor']) || 0,
      totalMaks: Number(rows[i]['Total_Maks']) || 0,
    })
  }
  return result
}
