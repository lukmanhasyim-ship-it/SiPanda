import { useState, useRef, useEffect } from 'react'
import { getCurrentUser, logout } from '../services/authStore'

const NAV_ITEMS = [
  { id: 'upload', label: 'Penilaian', icon: '📝' },
  { id: 'siswa', label: 'Siswa', icon: '👥' },
  { id: 'rubrik', label: 'Manajemen Kunci', icon: '📋' },
  { id: 'kelas', label: 'Kelas', icon: '🏫' },
  { id: 'mapel', label: 'Mapel', icon: '📚' },
  { id: 'nilai', label: 'Nilai Akhir', icon: '📈' },
  { id: 'history', label: 'Riwayat', icon: '📊' },
]

const APP_VERSION = '1.0.0'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout({ children, activeNav, onNavChange, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const user = getCurrentUser()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
    onLogout?.()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                SP
              </div>
              <div>
                <h1 className="text-lg font-bold text-text leading-tight">Sipanda</h1>
                <p className="text-[11px] text-text-muted leading-tight -mt-0.5">
                  Penilaian Jawaban AI
                </p>
              </div>
            </div>

            <nav className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavChange?.(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={classNames(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    activeNav === item.id
                      ? 'bg-primary-light text-primary'
                      : 'text-text-muted hover:text-text hover:bg-gray-50'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-text max-w-[120px] truncate">
                    {user?.name || 'User'}
                  </span>
                  <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl border border-border shadow-lg z-50 py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-text">{user?.name}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger-light/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Keluar
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-gray-50"
              >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="sm:hidden pb-3 border-t border-border pt-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavChange?.(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={classNames(
                    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    activeNav === item.id
                      ? 'bg-primary-light text-primary'
                      : 'text-text-muted hover:text-text hover:bg-gray-50'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <hr className="border-border my-2" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-light/30 transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      <footer className="bg-surface border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <span>&copy; {new Date().getFullYear()} Sipanda v{APP_VERSION}</span>
          <span>Sistem Penilaian Jawaban Siswa Berbasis AI</span>
        </div>
      </footer>
    </div>
  )
}
