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
  SOAL: 'Database_Soal',
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

    if (action === 'getRegistrationClasses') {
      return sendJson({ success: true, data: getRegistrationClasses() })
    }

    if (action === 'getRegistrationStudents') {
      var registrationClass = String(data.kelas || '').trim()
      if (!registrationClass) return sendJson({ success: false, error: 'Kelas wajib dipilih' })
      return sendJson({ success: true, data: getRegistrationStudents(registrationClass) })
    }

    if (action === 'getStudentDashboard') {
      var studentUser = verifyGoogleToken(data.googleToken || '')
      if (!studentUser) return sendJson({ success: false, authError: true, error: 'Token Google siswa tidak valid. Silakan masuk kembali.' })
      var linkedStudent = getSiswaByEmail(studentUser.email)
      if (!linkedStudent) return sendJson({ success: false, authError: true, error: 'Email ini tidak terhubung ke data siswa.' })
      return sendJson({
        success: true,
        data: {
          siswa: { nis: linkedStudent.nis, nama: linkedStudent.nama, kelas: linkedStudent.kelas },
          hasil: getAllHasilByNis(linkedStudent.nis),
        },
      })
    }

    if (action === 'getStudentDashboard') {
      var studentUser = verifyGoogleToken(data.googleToken || '')
      if (!studentUser) return sendJson({ success: false, authError: true, error: 'Token Google siswa tidak valid. Silakan masuk kembali.' })
      var linkedStudent = getSiswaByEmail(studentUser.email)
      if (!linkedStudent) return sendJson({ success: false, authError: true, error: 'Email ini tidak terhubung ke data siswa.' })
      return sendJson({
        success: true,
        data: {
          siswa: { nis: linkedStudent.nis, nama: linkedStudent.nama, kelas: linkedStudent.kelas },
          hasil: getAllHasilByNis(linkedStudent.nis),
        },
      })
    }

    var user = requireAuth(data)
    if (!user) {
      return sendJson({ success: false, authError: true, error: 'Token tidak valid. Silakan masuk ulang.' })
    }

    if (action === 'processAnswer') {
      return handleProcessAnswer(data)
    }

    if (action === 'getSoalByMapel') {
      var soalKelas = String(data.kelas || '').trim()
      var soalMapel = String(data.mapel || '').trim()
      if (!soalKelas || !soalMapel) return sendJson({ success: false, error: 'Kelas dan Mapel wajib diisi' })
      return sendJson({ success: true, data: getSoalByKelasMapel(soalKelas, soalMapel) })
    }

    if (action === 'getAllSoal') {
      return sendJson({ success: true, data: getAllSoal() })
    }

    if (action === 'addSoal') {
      var soalKelasBaru = String(data.kelas || '').trim()
      var soalMapelBaru = String(data.mapel || '').trim()
      var soalNomorBaru = String(data.nomor || '').trim()
      var soalKunciBaru = String(data.kunci || '').trim().toUpperCase()
      if (!soalKelasBaru || !soalMapelBaru || !/^\d+$/.test(soalNomorBaru) || !/^[ABCDE]$/.test(soalKunciBaru)) {
        return sendJson({ success: false, error: 'Kelas, mapel, nomor soal, dan kunci A-E wajib diisi dengan benar' })
      }
      return sendJson({ success: true, data: addSoal(soalKelasBaru, soalMapelBaru, soalNomorBaru, soalKunciBaru) })
    }

    if (action === 'deleteSoal') {
      var deletedSoal = deleteSoal(String(data.kelas || '').trim(), String(data.mapel || '').trim(), String(data.nomor || '').trim())
      return sendJson({ success: true, data: { deleted: deletedSoal } })
    }

    if (action === 'submitAssessmentReview') {
      return handleAssessmentReview(data)
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

    if (action === 'importRubrik') {
      if (!data.rows || !Array.isArray(data.rows) || data.rows.length === 0) {
        return sendJson({ success: false, error: 'Data rubrik atau kunci jawaban wajib diisi' })
      }
      var importRubrikResult = importRubrik(data.rows)
      if (importRubrikResult.rubrikImported + importRubrikResult.soalImported === 0) {
        return sendJson({ success: false, error: 'Tidak ada baris rubrik atau kunci jawaban valid untuk diimport' })
      }
      return sendJson({ success: true, data: importRubrikResult })
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
  var images = Array.isArray(data.images) ? data.images : (data.image ? [data.image] : [])
  images = images.map(function(image) {
    if (typeof image === 'string') {
      var mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)
      return { data: image, mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg' }
    }
    return image
  })

  if (!nis)     return sendJson({ success: false, error: 'NIS wajib diisi' })
  if (!kelas)   return sendJson({ success: false, error: 'Kelas wajib diisi' })
  if (!mapel)   return sendJson({ success: false, error: 'Mata pelajaran wajib diisi' })
  if (images.length === 0) return sendJson({ success: false, error: 'Pilih minimal satu gambar lembar jawaban' })
  if (images.length > 10) return sendJson({ success: false, error: 'Maksimal 10 gambar per penilaian' })
  for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
    if (!images[imageIndex] || !images[imageIndex].data) {
      return sendJson({ success: false, error: 'Data gambar ke-' + (imageIndex + 1) + ' tidak valid' })
    }
  }

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
  var ocrText = extractTextFromImage(images)

  // 4. Penilaian AI
  var aiResult = nilaiJawaban(ocrText, rubrik, siswa, mapel)

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

function handleAssessmentReview(data) {
  var aiResult = data.aiResult || {}
  var nis = String(aiResult.nis || '').trim()
  var kelas = String(aiResult.kelas || '').trim()
  var mapel = String(aiResult.mapel || '').trim()
  var jawaban = data.jawaban || []
  if (!nis || !kelas || !mapel) return sendJson({ success: false, error: 'Data hasil AI tidak lengkap' })
  if (!Array.isArray(jawaban)) return sendJson({ success: false, error: 'Jawaban harus berupa daftar pilihan' })

  var siswa = getSiswaByNis(nis)
  if (!siswa || siswa.kelas !== kelas) return sendJson({ success: false, error: 'Siswa tidak ditemukan pada kelas yang dipilih' })
  var soal = getSoalByKelasMapel(kelas, mapel)
  if (soal.length === 0) return sendJson({ success: false, error: 'Kunci soal untuk mapel ini belum tersedia' })
  var jawabanByNomor = {}
  for (var i = 0; i < jawaban.length; i++) {
    var nomor = String(jawaban[i].nomor || '').trim()
    var pilihan = String(jawaban[i].jawaban || '').trim().toUpperCase()
    if (!/^[ABCDE-]$/.test(pilihan)) return sendJson({ success: false, error: 'Setiap soal harus dijawab dengan pilihan A sampai E atau kosong' })
    if (!soal.some(function(item) { return String(item.nomor) === nomor })) return sendJson({ success: false, error: 'Nomor soal tidak sesuai Database_Soal' })
    jawabanByNomor[nomor] = pilihan
  }
  if (jawaban.length !== soal.length) return sendJson({ success: false, error: 'Jumlah jawaban tidak sesuai dengan jumlah soal pada Database_Soal' })

  var skorAnalitik = Array.isArray(aiResult.skorAnalitik) ? aiResult.skorAnalitik : []
  var skorEsai = 0
  var maksEsai = 0
  for (var e = 0; e < skorAnalitik.length; e++) {
    var skorEsaiItem = skorAnalitik[e]
    var skorMaksEsai = Math.max(1, Number(skorEsaiItem.skorMaks) || 4)
    skorEsaiItem.skor = Math.max(1, Math.min(skorMaksEsai, Number(skorEsaiItem.skor) || 1))
    skorEsaiItem.skorMaks = skorMaksEsai
    skorEsai += skorEsaiItem.skor
    maksEsai += skorMaksEsai
  }

  var skorPG = 0
  for (var j = 0; j < soal.length; j++) {
    var kunci = soal[j]
    var jawabanSiswa = jawabanByNomor[String(kunci.nomor)]
    var benar = jawabanSiswa === kunci.kunci
    if (benar) skorPG++
    skorAnalitik.push({
      aspek: 'Soal ' + kunci.nomor,
      skor: benar ? 1 : 0,
      skorMaks: 1,
      deskriptor: benar ? 'Benar' : 'Jawaban: ' + (jawabanSiswa === '-' ? 'Kosong' : jawabanSiswa) + ' | Kunci: ' + kunci.kunci,
      feedback: benar ? 'Jawaban benar' : 'Jawaban belum tepat',
    })
  }

  var totalSkor = skorEsai + skorPG
  var totalMaks = maksEsai + soal.length
  var nilaiAkhir = totalMaks > 0 ? Math.round((totalSkor / totalMaks) * 100) : 0
  var feedbackAI = String(aiResult.feedbackAI || '') + '\nPG benar: ' + skorPG + ' dari ' + soal.length + ' soal.'
  var rekomendasi = String(aiResult.rekomendasi || '')
  var hasilJawaban = jawaban.map(function(item) { return item.nomor + '. ' + String(item.jawaban).toUpperCase() }).join('\n')

  simpanHasil({
    nis: nis,
    namaSiswa: siswa.nama,
    kelas: kelas,
    mapel: mapel,
    hasilOCR: String(aiResult.hasilOCR || '') + '\n\nJawaban PG\n' + hasilJawaban,
    skorAnalitik: JSON.stringify(skorAnalitik),
    feedbackAI: feedbackAI,
    rekomendasi: rekomendasi,
    totalSkor: totalSkor,
    totalMaks: totalMaks,
  })

  return sendJson({
    success: true,
    data: {
      nis: nis,
      namaSiswa: siswa.nama,
      kelas: kelas,
      mapel: mapel,
      timestamp: new Date().toISOString(),
      hasilOCR: String(aiResult.hasilOCR || '') + '\n\nJawaban PG\n' + hasilJawaban,
      skorAnalitik: skorAnalitik,
      totalSkor: totalSkor,
      totalMaks: totalMaks,
      nilaiAkhir: nilaiAkhir,
      feedbackAI: feedbackAI,
      rekomendasi: rekomendasi,
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
  if (payload.email_verified !== true && payload.email_verified !== 'true') return null
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
    return sendJson({ success: false, error: 'Token Google tidak valid. Silakan coba masuk kembali.' })
  }

  if (data.registrationKey) {
    return handleStudentRegistration(user, String(data.registrationKey).trim())
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

  if (found) {
    return sendJson({ success: true, data: Object.assign({}, user, { role: 'teacher' }) })
  }

  var student = getSiswaByEmail(user.email)
  if (student) {
    return sendJson({
      success: true,
      data: {
        email: user.email,
        name: user.name || student.nama,
        picture: user.picture || '',
        role: 'student',
        nis: student.nis,
        namaSiswa: student.nama,
        kelas: student.kelas,
      },
    })
  }

  return sendJson({
    success: false,
    error: 'Email ini belum terdaftar sebagai guru atau siswa. Jika Anda siswa, pilih menu Siswa, cari kelas dan nama, lalu lanjutkan dengan akun Google untuk mendaftarkan email. Jika Anda guru, hubungi administrator.',
  })
}

function handleStudentRegistration(user, registrationKey) {
  var cache = CacheService.getScriptCache()
  var cachedSelection = cache.get('student_registration_' + registrationKey)
  if (!cachedSelection) {
    return sendJson({ success: false, error: 'Pilihan siswa kedaluwarsa. Pilih nama siswa kembali.' })
  }

  var selection = JSON.parse(cachedSelection)
  var siswa = getSiswaByNis(selection.nis)
  if (!siswa || siswa.kelas !== selection.kelas) {
    cache.remove('student_registration_' + registrationKey)
    return sendJson({ success: false, error: 'Data siswa tidak lagi sesuai. Pilih siswa kembali.' })
  }

  var email = String(user.email || '').trim().toLowerCase()
  if (!email) return sendJson({ success: false, error: 'Email akun Google tidak ditemukan' })

  var allSiswa = getAllSiswa()
  for (var i = 0; i < allSiswa.length; i++) {
    var existingEmail = String(allSiswa[i].email || '').trim().toLowerCase()
    if (existingEmail && existingEmail === email && allSiswa[i].nis !== siswa.nis) {
      return sendJson({ success: false, error: 'Email ini sudah terdaftar pada siswa lain.' })
    }
  }

  var currentEmail = String(siswa.email || '').trim().toLowerCase()
  if (currentEmail && currentEmail !== email) {
    return sendJson({ success: false, error: 'Siswa ini sudah terdaftar dengan email lain. Hubungi guru untuk memperbarui data.' })
  }
  if (!currentEmail) setSiswaEmail(siswa.nis, email)

  cache.remove('student_registration_' + registrationKey)
  return sendJson({
    success: true,
    data: {
      email: email,
      name: user.name || siswa.nama,
      picture: user.picture || '',
      role: 'student',
      nis: siswa.nis,
      namaSiswa: siswa.nama,
      kelas: siswa.kelas,
    },
  })
}

function ensureAllSheets() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
  var names = SHEET_NAMES
  var headers = {
    Database_Siswa: ['NIS', 'Nama_Siswa', 'Kelas', 'Email'],
    Database_Rubrik: ['Kelas', 'Mapel', 'Aspek_Penilaian', 'Skor_4', 'Skor_3', 'Skor_2', 'Skor_1'],
    Database_Soal: ['Kelas', 'Mapel', 'No_Soal', 'Kunci_Jawaban'],
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
  _ensureSiswaEmailColumn()
}

function sendJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
