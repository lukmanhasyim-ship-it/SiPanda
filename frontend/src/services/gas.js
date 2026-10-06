const GAS_URL = import.meta.env.DEV ? '/gas' : (import.meta.env.VITE_GAS_URL || '')

function getGoogleToken() {
  try {
    var s = localStorage.getItem('sipanda_auth')
    if (s) {
      var data = JSON.parse(s)
      return data.token || null
    }
  } catch {}
  return null
}

export async function callGAS(payload) {
  var token = getGoogleToken()
  if (token) {
    payload.googleToken = token
  }

  var controller = new AbortController()
  var timeoutId = setTimeout(function () { controller.abort() }, 120000)

  try {
    var response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Server error: ' + response.status + ' ' + response.statusText)
    }

    var text = await response.text()
    var data
    try {
      data = JSON.parse(text)
    } catch {
      if (text.includes('Halaman Tidak Ditemukan') || text.includes('tidak dapat membuka file')) {
        throw new Error('Tidak dapat terhubung ke Google Apps Script/Spreadsheet. Pastikan izin akses dan SPREADSHEET_ID sudah benar.')
      }
      throw new Error('Respon server tidak valid: ' + (text ? text.slice(0, 120) : 'Kosong'))
    }

    if (!data.success) {
      if (data.authError) {
        localStorage.removeItem('sipanda_auth')
        window.location.reload()
        throw new Error(data.error || 'Sesi berakhir. Silakan masuk ulang.')
      }
      throw new Error(data.error || 'Gagal memproses permintaan')
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Waktu permintaan habis. Silakan coba lagi.')
    }
    throw err
  }
}
