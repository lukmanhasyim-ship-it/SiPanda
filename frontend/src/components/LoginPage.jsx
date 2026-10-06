import { useEffect, useRef, useState } from 'react'
import { googleLogin } from '../services/authStore'

var CLIENT_ID = '254150534305-3i5spnu6d114b4q969qi6k5ggvvreqqe.apps.googleusercontent.com'

export default function LoginPage({ onLoginSuccess }) {
  const btnRef = useRef(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(function () {
    var timer = setInterval(function () {
      if (window.google && window.google.accounts && btnRef.current) {
        clearInterval(timer)
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async function (response) {
            setLoading(true)
            setError('')
            try {
              var user = await googleLogin(response.credential)
              onLoginSuccess(user)
            } catch (err) {
              setError(err.message || 'Gagal verifikasi')
              setLoading(false)
            }
          },
          cancel_on_tap_outside: false,
        })
        window.google.accounts.id.renderButton(btnRef.current, {
          type: 'standard',
          shape: 'rectangular',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          width: 320,
          logo_alignment: 'center',
        })
      }
    }, 200)
    return function () { clearInterval(timer) }
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-sm mx-auto mb-4">
            SP
          </div>
          <h1 className="text-xl font-bold text-text">Sipanda</h1>
          <p className="text-sm text-text-muted mt-1">
            Sistem Penilaian Jawaban Siswa Berbasis AI
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-semibold text-text mb-6 text-center">
            Masuk dengan Google
          </h2>

          <div className="flex justify-center">
            <div ref={btnRef}></div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-danger-light border border-danger/30 flex items-start gap-2">
              <svg className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-danger">{error}</span>
            </div>
          )}

          {loading && (
            <div className="mt-4 text-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary-light animate-spin border-t-primary mx-auto" />
              <p className="text-xs text-text-muted mt-2">Memverifikasi...</p>
            </div>
          )}

          <p className="text-xs text-text-muted text-center mt-6">
            Masuk dengan akun Google mana pun
          </p>
        </div>
      </div>
    </div>
  )
}
