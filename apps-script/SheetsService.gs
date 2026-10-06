/**
 * SheetsService — Operasi CRUD Google Sheets
 *
 * Tabs:
 *   Database_Siswa : NIS | Nama_Siswa | Kelas
 *   Database_Rubrik: Kelas | Mapel | Aspek_Penilaian | Skor_4 | Skor_3 | Skor_2 | Skor_1
 *   Database_Soal  : Kelas (opsional) | Mapel | No_Soal | Kunci_Jawaban
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
  Database_Siswa: ['NIS', 'Nama_Siswa', 'Kelas', 'Email'],
  Database_Rubrik: ['Kelas', 'Mapel', 'Aspek_Penilaian', 'Skor_4', 'Skor_3', 'Skor_2', 'Skor_1'],
  Database_Soal: ['Kelas', 'Mapel', 'No_Soal', 'Kunci_Jawaban'],
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

function _ensureSiswaEmailColumn() {
  var sheet = _getSheet(SHEET_NAMES.SISWA, SHEET_HEADERS.Database_Siswa)
  var lastColumn = Math.max(sheet.getLastColumn(), 1)
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim().toLowerCase() === 'email') return i + 1
  }
  sheet.getRange(1, lastColumn + 1).setValue('Email')
  return lastColumn + 1
}

function setSiswaEmail(nis, email) {
  var emailColumn = _ensureSiswaEmailColumn()
  var sheet = _getSheet(SHEET_NAMES.SISWA)
  var values = sheet.getDataRange().getValues()
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(nis).trim()) {
      sheet.getRange(i + 1, emailColumn).setValue(email)
      return true
    }
  }
  throw new Error('Siswa tidak ditemukan untuk pendaftaran email')
}

function getRegistrationClasses() {
  var siswa = getAllSiswa()
  var classes = {}
  for (var i = 0; i < siswa.length; i++) {
    if (siswa[i].kelas) classes[siswa[i].kelas] = true
  }
  return Object.keys(classes).sort()
}

function getRegistrationStudents(kelas) {
  var allStudents = getAllSiswa()
  var cache = CacheService.getScriptCache()
  var result = []
  for (var i = 0; i < allStudents.length; i++) {
    if (allStudents[i].kelas !== kelas) continue
    var registrationKey = Utilities.getUuid()
    cache.put('student_registration_' + registrationKey, JSON.stringify({ nis: allStudents[i].nis, kelas: kelas }), 600)
    result.push({
      registrationKey: registrationKey,
      nama: allStudents[i].nama,
      registered: Boolean(String(allStudents[i].email || '').trim()),
      maskedEmail: _maskStudentEmail(allStudents[i].email),
    })
  }
  return result
}

function _maskStudentEmail(email) {
  var value = String(email || '').trim()
  var atIndex = value.indexOf('@')
  if (atIndex < 1) return ''
  var username = value.substring(0, atIndex)
  var visible = username.substring(0, Math.min(2, username.length))
  return visible + '***' + value.substring(atIndex)
}

function getAllSiswa() {
  _ensureSiswaEmailColumn()
  var rows = _getDataRange(SHEET_NAMES.SISWA)
  var result = []
  for (var i = 0; i < rows.length; i++) {
    result.push({
      nis: String(rows[i]['NIS'] || '').trim(),
      nama: String(rows[i]['Nama_Siswa'] || '').trim(),
      kelas: String(rows[i]['Kelas'] || '').trim(),
      email: String(rows[i]['Email'] || '').trim(),
    })
  }
  return result
}

function getSiswaByNis(nis) {
  _ensureSiswaEmailColumn()
  var rows = _getDataRange(SHEET_NAMES.SISWA)
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['NIS']).trim() === String(nis).trim()) {
      return {
        nis: String(rows[i]['NIS']).trim(),
        nama: String(rows[i]['Nama_Siswa'] || '').trim(),
        kelas: String(rows[i]['Kelas'] || '').trim(),
        email: String(rows[i]['Email'] || '').trim(),
      }
    }
  }
  return null
}

function getSiswaByEmail(email) {
  var normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return null
  var rows = getAllSiswa()
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].email || '').trim().toLowerCase() === normalizedEmail) return rows[i]
  }
  return null
}

function getSiswaByKelas(kelas) {
  var all = getAllSiswa()
  var result = []
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].kelas).trim() === String(kelas).trim()) {
      result.push({
        nis: all[i].nis,
        nama: all[i].nama,
        kelas: all[i].kelas,
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

function getSoalByKelasMapel(kelas, mapel) {
  var rows = _getDataRange(SHEET_NAMES.SOAL)
  var result = []
  var hasClassSpecificRows = false
  for (var i = 0; i < rows.length; i++) {
    var rowMapel = String(rows[i]['Mapel'] || rows[i]['Mata_Pelajaran'] || rows[i]['mapel'] || '').trim()
    var rowKelas = String(rows[i]['Kelas'] || '').trim()
    if (rowMapel === String(mapel).trim() && rowKelas === String(kelas).trim()) hasClassSpecificRows = true
  }

  for (var j = 0; j < rows.length; j++) {
    var row = rows[j]
    var rowMapelValue = String(row['Mapel'] || row['Mata_Pelajaran'] || row['mapel'] || '').trim()
    var rowKelasValue = String(row['Kelas'] || '').trim()
      var nomor = row['No_Soal'] || row['Nomor_Soal'] || row['Nomor Soal'] || row['No. Soal'] || row['No Soal'] || row['Nomor'] || row['No']
    var kunci = String(row['Kunci_Jawaban'] || row['Kunci Jawaban'] || row['Kunci'] || row['Jawaban_Benar'] || '').trim().toUpperCase()
    if (rowMapelValue !== String(mapel).trim()) continue
    if (hasClassSpecificRows ? rowKelasValue !== String(kelas).trim() : rowKelasValue !== '') continue
    if (!nomor || !/^[ABCDE]$/.test(kunci)) continue
    result.push({ nomor: String(nomor).trim(), kunci: kunci })
  }
  result.sort(function(a, b) { return Number(a.nomor) - Number(b.nomor) })
  return result
}

function getNomorSoalByMapel(kelas, mapel) {
  var soal = getSoalByKelasMapel(kelas, mapel)
  return soal.map(function(item) { return item.nomor })
}

function getAllSoal() {
  var rows = _getDataRange(SHEET_NAMES.SOAL)
  var result = []
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i]
    var nomor = row['No_Soal'] || row['Nomor_Soal'] || row['Nomor Soal'] || row['No. Soal'] || row['No Soal'] || row['Nomor'] || row['No']
    var kunci = String(row['Kunci_Jawaban'] || row['Kunci Jawaban'] || row['Kunci'] || row['Jawaban_Benar'] || '').trim().toUpperCase()
    var kelas = String(row['Kelas'] || '').trim()
    var mapel = String(row['Mapel'] || row['Mata_Pelajaran'] || row['mapel'] || '').trim()
    if (!nomor || !mapel || !/^[ABCDE]$/.test(kunci)) continue
    result.push({ kelas: kelas, mapel: mapel, nomor: String(nomor).trim(), kunci: kunci })
  }
  result.sort(function(a, b) {
    var mapelCompare = a.mapel.localeCompare(b.mapel)
    if (mapelCompare !== 0) return mapelCompare
    var kelasCompare = a.kelas.localeCompare(b.kelas)
    return kelasCompare !== 0 ? kelasCompare : Number(a.nomor) - Number(b.nomor)
  })
  return result
}

function addSoal(kelas, mapel, nomor, kunci) {
  var existing = getSoalByKelasMapel(kelas, mapel)
  for (var i = 0; i < existing.length; i++) {
    if (String(existing[i].nomor) === String(nomor)) throw new Error('Nomor soal tersebut sudah memiliki kunci')
  }
  var sheet = _getSheet(SHEET_NAMES.SOAL, SHEET_HEADERS.Database_Soal)
  sheet.appendRow([kelas, mapel, Number(nomor), kunci])
  return { kelas: kelas, mapel: mapel, nomor: String(nomor), kunci: kunci }
}

function deleteSoal(kelas, mapel, nomor) {
  if (!kelas || !mapel || !/^\d+$/.test(nomor)) throw new Error('Kelas, mapel, dan nomor soal wajib diisi')
  var sheet = _getSheet(SHEET_NAMES.SOAL, SHEET_HEADERS.Database_Soal)
  var values = sheet.getDataRange().getValues()
  if (values.length < 2) throw new Error('Kunci soal tidak ditemukan')
  var headers = values[0]
  var kelasIndex = headers.indexOf('Kelas')
  var mapelIndex = headers.indexOf('Mapel')
  var nomorIndex = headers.indexOf('No_Soal')
  if (nomorIndex < 0) nomorIndex = headers.indexOf('Nomor_Soal')
    if (nomorIndex < 0) nomorIndex = headers.indexOf('No. Soal')
    if (nomorIndex < 0) nomorIndex = headers.indexOf('No Soal')
  var deleted = 0
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][kelasIndex]).trim() === kelas && String(values[i][mapelIndex]).trim() === mapel && String(values[i][nomorIndex]).trim() === String(nomor)) {
      sheet.deleteRow(i + 1)
      deleted++
    }
  }
  if (!deleted) throw new Error('Kunci soal tidak ditemukan')
  return deleted
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
  var rubricSheet = _getSheet(SHEET_NAMES.RUBRIK, SHEET_HEADERS.Database_Rubrik)
  var soalSheet = _getSheet(SHEET_NAMES.SOAL, SHEET_HEADERS.Database_Soal)
  var rubrikImported = 0
  var soalImported = 0
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i]
    var kelas = String(r.kelas || r.Kelas || '').trim()
    var mapel = String(r.mapel || r.Mapel || r.Mata_Pelajaran || '').trim()
    var aspek = String(r.aspek_penilaian || r.Aspek_Penilaian || r.aspek || '').trim()
    var skor4 = String(r.skor_4 || r.Skor_4 || '').trim()
    var skor3 = String(r.skor_3 || r.Skor_3 || '').trim()
    var skor2 = String(r.skor_2 || r.Skor_2 || '').trim()
    var skor1 = String(r.skor_1 || r.Skor_1 || '').trim()
    var nomor = String(r.no_soal || r.No_Soal || r.Nomor_Soal || r['No. Soal'] || r['No Soal'] || r.Nomor || r.No || '').trim()
    var kunci = String(r.kunci_jawaban || r.Kunci_Jawaban || r['Kunci Jawaban'] || r.Kunci || r.Jawaban_Benar || '').trim().toUpperCase()
    if (!kelas || !mapel) continue
    if (aspek) {
      rubricSheet.appendRow([kelas, mapel, aspek, skor4, skor3, skor2, skor1])
      rubrikImported++
    }
    if (/^\d+$/.test(nomor) && /^[ABCDE]$/.test(kunci)) {
      soalSheet.appendRow([kelas, mapel, Number(nomor), kunci])
      soalImported++
    }
  }
  return { rubrikImported: rubrikImported, soalImported: soalImported }
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

function getAllHasilByNis(nis) {
  var rows = _getDataRange(SHEET_NAMES.HASIL)
  var result = []
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i]['NIS'] || '').trim() !== String(nis).trim()) continue
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
