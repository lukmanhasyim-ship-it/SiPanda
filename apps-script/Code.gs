/**
 * Sipanda - Sistem Penilaian Jawaban Siswa Berbasis AI
 * Google Apps Script Backend
 *
 * Konfigurasi:
 *   - SPREADSHEET_ID: ID Google Sheets (dari URL)
 *   - GEMINI_API_KEY: API key dari Google AI Studio
 *   - CLOUD_VISION_API_KEY: API key dari Google Cloud Console
 *
 * Set via: File > Project properties > Script properties
 * Atau:  PropertiesService.getScriptProperties().setProperty(key, value)
 */

// ─── Konfigurasi ───────────────────────────────────────────
var CONFIG = {
  SPREADSHEET_ID:     PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'),
  GEMINI_API_KEY:     PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  CLOUD_VISION_API_KEY: PropertiesService.getScriptProperties().getProperty('CLOUD_VISION_API_KEY'),
  GOOGLE_CLIENT_ID:  '254150534305-3i5spnu6d114b4q969qi6k5ggvvreqqe.apps.googleusercontent.com',
}

var SHEET_NAMES = {
  SISWA: 'Database_Siswa',
  RUBRIK: 'Database_Rubrik',
  HASIL: 'Hasil_Penilaian',
  KELAS: 'Database_Kelas',
  MAPEL: 'Database_Mapel',
  GURU: 'Database_Guru',
}

// ─── Entry Point ───────────────────────────────────────────

function doGet() {
  return sendJson({ success: true, message: 'Sipanda API is running' })
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
    var action = data.action || ''

    ensureAllSheets()

    if (action === 'verifyGoogleToken') {
      return handleVerifyGoogleToken(data)
    }

    var user = requireAuth(data)
    if (!user) {
      return sendJson({ success: false, authError: true, error: 'Token tidak valid. Silakan masuk ulang.' })
    }

    if (action === 'processAnswer') {
      return handleProcessAnswer(data)
    }

    if (action === 'getSiswaByKelas') {
      var kelas = String(data.kelas || '').trim()
      if (!kelas) return sendJson({ success: false, error: 'Kelas wajib diisi' })
      var siswaList = getSiswaByKelas(kelas)
      return sendJson({ success: true, data: siswaList })
    }

    if (action === 'getAllSiswa') {
      var allSiswa = getAllSiswa()
      return sendJson({ success: true, data: allSiswa })
    }

    if (action === 'getRubrikByKelasMapel') {
      var rKelas = String(data.kelas || '').trim()
      var rMapel = String(data.mapel || '').trim()
      if (!rKelas || !rMapel) return sendJson({ success: false, error: 'Kelas dan Mapel wajib diisi' })
      var rubrik = getRubrikByKelasMapel(rKelas, rMapel)
      return sendJson({ success: true, data: rubrik })
    }

    if (action === 'getAllRubrik') {
      var allRubrik = getAllRubrik()
      return sendJson({ success: true, data: allRubrik })
    }

    if (action === 'getRiwayatHasil') {
      var riwayat = getRiwayatHasil(data.limit || 50)
      return sendJson({ success: true, data: riwayat })
    }

    if (action === 'addSiswa') {
      if (!data.nis || !data.nama || !data.kelas) return sendJson({ success: false, error: 'NIS, Nama, dan Kelas wajib diisi' })
      var siswa = addSiswa(String(data.nis).trim(), String(data.nama).trim(), String(data.kelas).trim())
      return sendJson({ success: true, data: siswa })
    }

    if (action === 'updateSiswa') {
      if (!data.nis) return sendJson({ success: false, error: 'NIS wajib diisi' })
      var uSiswa = updateSiswa(String(data.nis).trim(), String(data.nama).trim(), String(data.kelas).trim())
      return sendJson({ success: true, data: uSiswa })
    }

    if (action === 'deleteSiswa') {
      if (!data.nis) return sendJson({ success: false, error: 'NIS wajib diisi' })
      deleteSiswa(String(data.nis).trim())
      return sendJson({ success: true })
    }

    if (action === 'addRubrik') {
      if (!data.kelas || !data.mapel || !data.aspek) return sendJson({ success: false, error: 'Kelas, Mapel, dan Aspek wajib diisi' })
      var rubrik = addRubrik(String(data.kelas).trim(), String(data.mapel).trim(), data.aspek)
      return sendJson({ success: true, data: rubrik })
    }

    if (action === 'updateRubrik') {
      if (!data.kelas || !data.mapel) return sendJson({ success: false, error: 'Kelas dan Mapel wajib diisi' })
      deleteRubrik(String(data.kelas).trim(), String(data.mapel).trim())
      var uRubrik = addRubrik(
        String(data.kelasBaru || data.kelas).trim(),
        String(data.mapelBaru || data.mapel).trim(),
        data.aspek || []
      )
      return sendJson({ success: true, data: uRubrik })
    }

    if (action === 'deleteRubrik') {
      if (!data.kelas || !data.mapel) return sendJson({ success: false, error: 'Kelas dan Mapel wajib diisi' })
      deleteRubrik(String(data.kelas).trim(), String(data.mapel).trim())
      return sendJson({ success: true })
    }

    if (action === 'getAllKelas') {
      var kelasList = getAllKelas()
      return sendJson({ success: true, data: kelasList })
    }

    if (action === 'addKelas') {
      if (!data.kelas) return sendJson({ success: false, error: 'Nama kelas wajib diisi' })
      var newKelas = addKelas(String(data.kelas).trim())
      return sendJson({ success: true, data: newKelas })
    }

    if (action === 'deleteKelas') {
      if (!data.kelas) return sendJson({ success: false, error: 'Nama kelas wajib diisi' })
      deleteKelas(String(data.kelas).trim())
      return sendJson({ success: true })
    }

    if (action === 'getAllMapel') {
      var mapelList = getAllMapel()
      return sendJson({ success: true, data: mapelList })
    }

    if (action === 'addMapel') {
      if (!data.mapel) return sendJson({ success: false, error: 'Nama mapel wajib diisi' })
      var newMapel = addMapel(String(data.mapel).trim())
      return sendJson({ success: true, data: newMapel })
    }

    if (action === 'deleteMapel') {
      if (!data.mapel) return sendJson({ success: false, error: 'Nama mapel wajib diisi' })
      deleteMapel(String(data.mapel).trim())
      return sendJson({ success: true })
    }

    if (action === 'importMapel') {
      if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
        return sendJson({ success: false, error: 'Data mapel wajib diisi' })
      }
      var importMapelCount = importMapel(data.rows)
      return sendJson({ success: true, data: { imported: importMapelCount } })
    }

    return sendJson({ success: false, error: 'Aksi tidak dikenal: ' + action })
  } catch (err) {
    return sendJson({ success: false, error: err.message })
  }
}

// ─── Main Handler ──────────────────────────────────────────

function handleProcessAnswer(data) {
  var nis      = String(data.nis || '').trim()
  var kelas    = String(data.kelas || '').trim()
  var mapel    = String(data.mapel || '').trim()
  var image    = data.image || ''
  var fileName = data.fileName || ''

  if (!nis)     return sendJson({ success: false, error: 'NIS wajib diisi' })
  if (!kelas)   return sendJson({ success: false, error: 'Kelas wajib diisi' })
  if (!mapel)   return sendJson({ success: false, error: 'Mata pelajaran wajib diisi' })
  if (!image)   return sendJson({ success: false, error: 'Gambar tidak ditemukan' })

  // 1. Validasi siswa
  var siswa = getSiswaByNis(nis)
  if (!siswa) {
    return sendJson({ success: false, error: 'Siswa dengan NIS ' + nis + ' tidak ditemukan' })
  }

  // 2. Ambil rubrik
  var rubrik = getRubrikByKelasMapel(kelas, mapel)
  if (!rubrik || rubrik.aspek.length === 0) {
    return sendJson({ success: false, error: 'Rubrik untuk ' + kelas + ' - ' + mapel + ' belum tersedia' })
  }

  // 3. OCR via Gemini
  var ocrText = extractTextFromImage(image)

  // 4. Penilaian AI
  var aiResult = nilaiJawaban(ocrText, rubrik, siswa, mapel)

  // 5. Simpan hasil
  simpanHasil({
    timestamp: new Date().toISOString(),
    nis: nis,
    namaSiswa: siswa.nama,
    kelas: kelas,
    mapel: mapel,
    hasilOCR: ocrText,
    skorAnalitik: JSON.stringify(aiResult.skorAnalitik),
    feedbackAI: aiResult.feedbackAI || '',
    rekomendasi: aiResult.rekomendasi || '',
    totalSkor: aiResult.totalSkor || 0,
    totalMaks: aiResult.totalMaks || 0,
  })

  return sendJson({
    success: true,
    data: {
      nis: nis,
      namaSiswa: siswa.nama,
      kelas: kelas,
      mapel: mapel,
      timestamp: new Date().toISOString(),
      hasilOCR: ocrText,
      skorAnalitik: aiResult.skorAnalitik,
      totalSkor: aiResult.totalSkor,
      totalMaks: aiResult.totalMaks,
      feedbackAI: aiResult.feedbackAI,
      rekomendasi: aiResult.rekomendasi,
    },
  })
}

// ─── Auth ──────────────────────────────────────────────────

function requireAuth(data) {
  var token = data.googleToken || ''
  if (!token) return null
  return verifyGoogleToken(token)
}

function verifyGoogleToken(token) {
  var cache = CacheService.getScriptCache()
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, token)
  var cacheKey = 'auth_'
  for (var i = 0; i < digest.length; i++) {
    var hex = (digest[i] & 0xFF).toString(16)
    if (hex.length === 1) hex = '0' + hex
    cacheKey += hex
  }
  var cached = cache.get(cacheKey)
  if (cached) return JSON.parse(cached)

  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), {
    muteHttpExceptions: true,
    contentType: 'application/x-www-form-urlencoded',
  })

  if (response.getResponseCode() !== 200) return null

  var payload = JSON.parse(response.getContentText())

  if (payload.aud !== CONFIG.GOOGLE_CLIENT_ID) return null
  if (payload.hd !== 'guru.smk.belajar.id') return null

  var userInfo = {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || '',
  }

  cache.put(cacheKey, JSON.stringify(userInfo), 300)
  return userInfo
}

function handleVerifyGoogleToken(data) {
  var user = verifyGoogleToken(data.googleToken || '')
  if (!user) {
    return sendJson({ success: false, error: 'Token tidak valid. Pastikan menggunakan akun @guru.smk.belajar.id' })
  }

  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
  var sheet = ss.getSheetByName(SHEET_NAMES.GURU)
  var dataRows = sheet ? sheet.getDataRange().getValues() : []

  var emailCol = -1
  if (dataRows.length > 0) {
    for (var c = 0; c < dataRows[0].length; c++) {
      var h = String(dataRows[0][c]).trim().toLowerCase()
      if (h === 'email' || h === 'e-mail') {
        emailCol = c
        break
      }
    }
  }

  var found = false
  if (emailCol >= 0) {
    for (var i = 1; i < dataRows.length; i++) {
      if (String(dataRows[i][emailCol]).trim().toLowerCase() === user.email.toLowerCase()) {
        found = true
        break
      }
    }
  }

  if (!found) {
    console.log({ msg: 'Guru not found', email: user.email, rows: dataRows.length, emailCol: emailCol })
    return sendJson({ success: false, error: 'Email ' + user.email + ' tidak terdaftar sebagai guru. Hubungi administrator.' })
  }

  return sendJson({ success: true, data: user })
}

function ensureAllSheets() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
  var names = SHEET_NAMES
  var headers = {
    Database_Siswa: ['NIS', 'Nama_Siswa', 'Kelas'],
    Database_Rubrik: ['Kelas', 'Mapel', 'Aspek_Penilaian', 'Skor_4', 'Skor_3', 'Skor_2', 'Skor_1'],
    Hasil_Penilaian: ['Timestamp', 'NIS', 'Nama_Siswa', 'Kelas', 'Mapel', 'Hasil_OCR', 'Skor_Analitik', 'Feedback_AI', 'Rekomendasi', 'Total_Skor', 'Total_Maks'],
    Database_Kelas: ['Kelas'],
    Database_Mapel: ['Mapel'],
    Database_Guru: ['Nama_Guru', 'Email'],
  }
  for (var key in names) {
    var sheetName = names[key]
    var sheet = ss.getSheetByName(sheetName)
    if (!sheet) {
      sheet = ss.insertSheet(sheetName)
      if (headers[sheetName]) sheet.appendRow(headers[sheetName])
    }
  }
}

function sendJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
