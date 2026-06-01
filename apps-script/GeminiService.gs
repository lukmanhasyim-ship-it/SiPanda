/**
 * GeminiService — Ekstraksi teks & penilaian jawaban via Gemini 1.5 Flash
 *
 * Support: teks + gambar (multimodal inline)
 */

var GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'

function _callGemini(payload) {
  var apiKey = CONFIG.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY belum dikonfigurasi')

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  }

  var url = GEMINI_API_ENDPOINT + '?key=' + encodeURIComponent(apiKey)
  var response = UrlFetchApp.fetch(url, options)
  var result = JSON.parse(response.getContentText())

  if (result.error) {
    throw new Error('Gemini API error: ' + (result.error.message || JSON.stringify(result.error)))
  }

  var text = ''
  if (
    result.candidates &&
    result.candidates[0] &&
    result.candidates[0].content &&
    result.candidates[0].content.parts &&
    result.candidates[0].content.parts.length > 0
  ) {
    text = result.candidates[0].content.parts[0].text || ''
  }

  return text
}

function _extractJson(text) {
  var jsonStr = text.trim()
  var jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  var parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    var fallbackMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (fallbackMatch) {
      try {
        parsed = JSON.parse(fallbackMatch[0])
      } catch (e2) {
        throw new Error('Gagal memproses respons AI: format JSON tidak valid')
      }
    } else {
      throw new Error('Gagal memproses respons AI: format JSON tidak valid')
    }
  }
  return parsed
}

function extractTextFromImage(base64Image) {
  var cleanImage = base64Image
  if (cleanImage.indexOf(',') > -1) {
    cleanImage = cleanImage.split(',')[1]
  }

  var prompt = 'Ekstrak semua teks yang tertulis pada gambar ini. Tulis persis seperti yang terlihat, termasuk ejaan dan angka.'

  var payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanImage,
          },
        },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  }

  var text = _callGemini(payload)

  if (!text.trim()) {
    throw new Error('Tidak dapat mengekstrak teks dari gambar. Pastikan gambar jelas dan terbaca.')
  }

  return text.trim()
}

function _formatRubrik(rubrik) {
  var lines = []
  for (var i = 0; i < rubrik.aspek.length; i++) {
    var a = rubrik.aspek[i]
    lines.push('Aspek #' + (i + 1) + ': ' + a.nama)
    lines.push('  Skor 4 (Sangat Baik): ' + a.skor_4)
    lines.push('  Skor 3 (Baik): ' + a.skor_3)
    lines.push('  Skor 2 (Cukup): ' + a.skor_2)
    lines.push('  Skor 1 (Kurang): ' + a.skor_1)
  }
  return lines.join('\n')
}

function nilaiJawaban(ocrText, rubrik, siswa, mapel) {
  var prompt = [
    'Anda adalah asisten penilaian jawaban siswa yang ahli dan objektif.',
    'Tugas Anda adalah menilai jawaban siswa berdasarkan rubrik yang diberikan.',
    '',
    '--- DATA SISWA ---',
    'Nama: ' + siswa.nama,
    'Kelas: ' + rubrik.kelas,
    'Mata Pelajaran: ' + mapel,
    '',
    '--- RUBRIK PENILAIAN ---',
    _formatRubrik(rubrik),
    '',
    '--- JAWABAN SISWA (HASIL OCR) ---',
    ocrText,
    '',
    '--- INSTRUKSI ---',
    '1. Untuk setiap aspek penilaian, pilih skor 1-4 berdasarkan deskriptor rubrik yang PALING SESUAI dengan jawaban siswa.',
    '2. Berikan deskriptor yang sesuai untuk skor yang dipilih.',
    '3. Berikan feedback singkat, padat, dan membangun untuk setiap aspek.',
    '4. Berikan rekomendasi keseluruhan untuk perbaikan siswa.',
    '5. Jika teks tidak terbaca atau tidak relevan, berikan skor 1 dengan catatan.',
    '',
    '--- FORMAT RESPON (JSON) ---',
    'Respond with valid JSON only (no markdown formatting):',
    '{',
    '  "skorAnalitik": [',
    '    {',
    '      "aspek": "Nama Aspek",',
    '      "skor": 4,',
    '      "deskriptor": "Deskriptor sesuai rubrik",',
    '      "feedback": "Feedback singkat untuk aspek ini"',
    '    }',
    '  ],',
    '  "feedbackAI": "Ringkasan feedback keseluruhan dalam format poin-poin",',
    '  "rekomendasi": "Rekomendasi perbaikan untuk siswa"',
    '}',
  ].join('\n')

  var payload = {
    contents: [{
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
    },
  }

  var rawText = _callGemini(payload)
  if (!rawText.trim()) {
    throw new Error('Gemini tidak memberikan respons. Coba lagi.')
  }

  var parsed = _extractJson(rawText)

  var skorAnalitik = parsed.skorAnalitik || []
  var totalSkor = 0
  var totalMaks = skorAnalitik.length * 4

  for (var i = 0; i < skorAnalitik.length; i++) {
    var s = skorAnalitik[i]
    s.skor = Math.max(1, Math.min(4, Number(s.skor) || 1))
    s.skorMaks = 4
    totalSkor += s.skor
  }

  return {
    skorAnalitik: skorAnalitik,
    totalSkor: totalSkor,
    totalMaks: totalMaks,
    feedbackAI: String(parsed.feedbackAI || '').trim(),
    rekomendasi: String(parsed.rekomendasi || '').trim(),
  }
}
