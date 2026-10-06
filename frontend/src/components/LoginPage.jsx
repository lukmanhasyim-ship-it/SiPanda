import { useEffect, useRef, useState } from 'react'
import { googleLogin } from '../services/authStore'
import { fetchRegistrationClasses, fetchRegistrationStudents } from '../services/siswaApi'

var CLIENT_ID = '254150534305-3i5spnu6d114b4q969qi6k5ggvvreqqe.apps.googleusercontent.com'

export default function LoginPage({ onLoginSuccess }) {
  const btnRef = useRef(null)
  const onLoginSuccessRef = useRef(onLoginSuccess)
  const loginModeRef = useRef('teacher')
  const registrationKeyRef = useRef('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentLoginOpen, setStudentLoginOpen] = useState(false)
  const [kelasList, setKelasList] = useState([])
  const [kelas, setKelas] = useState('')
  const [siswaList, setSiswaList] = useState([])
  const [registrationKey, setRegistrationKey] = useState('')
  const [loadingKelas, setLoadingKelas] = useState(true)
  const [loadingSiswa, setLoadingSiswa] = useState(false)

  useEffect(function () {
    onLoginSuccessRef.current = onLoginSuccess
  }, [onLoginSuccess])

  useEffect(function () {
    let active = true
    fetchRegistrationClasses()
      .then(function (classes) { if (active) setKelasList(classes || []) })
      .catch(function () { if (active) setError('Daftar kelas siswa tidak dapat dimuat.') })
      .finally(function () { if (active) setLoadingKelas(false) })
    return function () { active = false }
  }, [])

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
              var studentKey = loginModeRef.current === 'student' ? registrationKeyRef.current : ''
              if (loginModeRef.current === 'student' && !studentKey) {
                throw new Error('Pilih kelas dan nama siswa terlebih dahulu.')
              }
              var user = await googleLogin(response.credential, studentKey)
              onLoginSuccessRef.current(user)
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

  const handleStudentLoginToggle = function () {
    const open = !studentLoginOpen
    setStudentLoginOpen(open)
    loginModeRef.current = open ? 'student' : 'teacher'
    setError('')
    if (!open) {
      setKelas('')
      setSiswaList([])
      setRegistrationKey('')
      registrationKeyRef.current = ''
    }
  }

  const handleClassChange = async function (event) {
    const selectedClass = event.target.value
    setKelas(selectedClass)
    setSiswaList([])
    setRegistrationKey('')
    registrationKeyRef.current = ''
    setError('')
    if (!selectedClass) return

    setLoadingSiswa(true)
    try {
      const students = await fetchRegistrationStudents(selectedClass)
      setSiswaList(students || [])
    } catch (err) {
      setError(err.message || 'Daftar siswa tidak dapat dimuat.')
    } finally {
      setLoadingSiswa(false)
    }
  }

  const handleStudentChange = function (event) {
    const key = event.target.value
    setRegistrationKey(key)
    registrationKeyRef.current = key
    setError('')
  }

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
          <h2 className="mb-5 text-center text-base font-semibold text-text">Lanjutkan dengan Google</h2>
          <div className="flex justify-center">
            <div ref={btnRef}></div>
          </div>

          <button
            type="button"
            onClick={handleStudentLoginToggle}
            disabled={loading}
            className="mt-4 w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {studentLoginOpen ? 'Tutup pilihan login siswa' : 'Masuk sebagai siswa'}
          </button>

          {studentLoginOpen && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <p className="text-sm text-text-muted">Pilih kelas dan nama. Setelah itu, lanjutkan memakai tombol Google di atas.</p>
              <label className="block text-sm font-medium text-text">
                Kelas
                <select value={kelas} onChange={handleClassChange} disabled={loadingKelas || loading} className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20">
                  <option value="">{loadingKelas ? 'Memuat kelas...' : 'Pilih kelas'}</option>
                  {kelasList.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <div>
                <p className="mb-1.5 text-sm font-medium text-text">Nama siswa</p>
                {!kelas ? (
                  <p className="rounded-md border border-border bg-gray-50 px-3 py-3 text-sm text-text-muted">Pilih kelas terlebih dahulu</p>
                ) : loadingSiswa ? (
                  <p className="rounded-md border border-border bg-gray-50 px-3 py-3 text-sm text-text-muted">Memuat daftar siswa...</p>
                ) : siswaList.length === 0 ? (
                  <p className="rounded-md border border-border bg-gray-50 px-3 py-3 text-sm text-text-muted">Belum ada siswa pada kelas ini</p>
                ) : (
                  <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border" aria-label="Daftar siswa">
                    {siswaList.map((student) => (
                      <li key={student.registrationKey}>
                        <button
                          type="button"
                          disabled={loading}
                          aria-pressed={registrationKey === student.registrationKey}
                          onClick={() => handleStudentChange({ target: { value: student.registrationKey } })}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 ${registrationKey === student.registrationKey ? 'bg-primary-light/50' : 'bg-white'}`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-text">{student.nama}</span>
                            {student.registered && student.maskedEmail && (
                              <span className="mt-0.5 block truncate text-xs text-text-muted">{student.maskedEmail}</span>
                            )}
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${student.registered ? 'bg-secondary-light text-secondary' : 'bg-gray-100 text-text-muted'}`}>
                            {student.registered ? 'Terdaftar' : 'Belum terdaftar'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-danger-light border border-danger/30 flex items-start gap-2">
              <svg className="w-4 h-4 text-danger shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
            Akun Google akan dikenali otomatis sebagai guru atau siswa.
          </p>
        </div>
      </div>
    </div>
  )
}
