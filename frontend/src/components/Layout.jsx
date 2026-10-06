import { useState, useEffect } from 'react'
import { getCurrentUser, logout } from '../services/authStore'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂', section: 'Utama' },
  { id: 'upload', label: 'Penilaian', icon: '＋', section: 'Utama' },
  { id: 'history', label: 'Riwayat Penilaian', icon: '◷', section: 'Utama' },
  { id: 'nilai', label: 'Nilai Akhir', icon: '↗', section: 'Utama' },
  { id: 'siswa', label: 'Data Siswa', icon: '♙', section: 'Data & pengaturan' },
  { id: 'rubrik', label: 'Manajemen Kunci', icon: '▤', section: 'Data & pengaturan' },
  { id: 'kelas', label: 'Kelas', icon: '⌂', section: 'Data & pengaturan' },
  { id: 'mapel', label: 'Mata Pelajaran', icon: '▦', section: 'Data & pengaturan' },
]

const APP_VERSION = '1.0.0'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function SidebarContents({ activeNav, onNavChange, onLogout, user, onNavigate, collapsed = false, onToggleCollapse }) {
  const sections = [...new Set(NAV_ITEMS.map((item) => item.section))]
  return (
    <>
      <div className={classNames('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'gap-3 px-5')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">SP</div>
        {!collapsed && <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold leading-tight text-text">Sipanda</h1>
          <p className="mt-0.5 text-[11px] text-text-muted">Ruang kerja guru</p>
        </div>}
        {!onNavigate && (
          <button type="button" onClick={onToggleCollapse} className="rounded-md p-2 text-text-muted hover:bg-gray-100 hover:text-text" title={collapsed ? 'Perluas menu' : 'Ciutkan menu'} aria-label={collapsed ? 'Perluas menu' : 'Ciutkan menu'}>
            <svg className={classNames('h-4 w-4 transition-transform', collapsed && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
      </div>
      <nav className={classNames('flex-1 space-y-6 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')} aria-label="Menu utama">
        {sections.map((section) => (
          <div key={section}>
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase text-text-muted">{section}</p>}
            <div className="space-y-1">
              {NAV_ITEMS.filter((item) => item.section === section).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onNavChange?.(item.id); onNavigate?.() }}
                  aria-current={activeNav === item.id ? 'page' : undefined}
                  className={classNames(
                    'flex w-full items-center rounded-md py-2.5 text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3 text-left',
                    activeNav === item.id ? 'bg-primary-light text-primary' : 'text-text-muted hover:bg-gray-50 hover:text-text'
                  )}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                >
                  <span className="flex h-5 w-5 items-center justify-center text-base" aria-hidden="true">{item.icon}</span>
                  {!collapsed && item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className={classNames('border-t border-border', collapsed ? 'p-2' : 'p-3')}>
        <div className={classNames('flex items-center py-2', collapsed ? 'justify-center' : 'gap-3 px-2')}>
          {user?.picture ? (
            <img src={user.picture} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">{user?.name?.charAt(0) || 'G'}</div>
          )}
          {!collapsed && <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text">{user?.name || 'Guru'}</p>
            <p className="truncate text-[11px] text-text-muted">{user?.email || ''}</p>
          </div>}
        </div>
        <button type="button" onClick={onLogout} title={collapsed ? 'Keluar' : undefined} aria-label={collapsed ? 'Keluar' : undefined} className={classNames('mt-1 flex w-full items-center rounded-md py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-light/50', collapsed ? 'justify-center px-0' : 'gap-3 px-3')}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4" />
          </svg>
          {!collapsed && 'Keluar'}
        </button>
      </div>
    </>
  )
}

export default function Layout({ children, activeNav, onNavChange, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sipanda_sidebar_collapsed') === 'true')
  const user = getCurrentUser()

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const handleLogout = () => {
    logout()
    onLogout?.()
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed
      localStorage.setItem('sipanda_sidebar_collapsed', String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className={classNames('fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex', sidebarCollapsed ? 'w-18' : 'w-64')}>
        <SidebarContents activeNav={activeNav} onNavChange={onNavChange} onLogout={handleLogout} user={user} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-slate-950/40" aria-label="Tutup menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex h-full w-[min(82vw,300px)] flex-col border-r border-border bg-surface shadow-xl">
            <button type="button" onClick={() => setMobileMenuOpen(false)} className="absolute right-3 top-3 rounded-md p-2 text-text-muted hover:bg-gray-100 hover:text-text" aria-label="Tutup menu">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <SidebarContents activeNav={activeNav} onNavChange={onNavChange} onLogout={handleLogout} user={user} onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className={classNames('flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200', sidebarCollapsed ? 'lg:ml-18' : 'lg:ml-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="rounded-md p-2 text-text-muted hover:bg-gray-100 hover:text-text lg:hidden" aria-label="Buka menu">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase text-text-muted">Sipanda / Guru</p>
              <p className="text-sm font-semibold text-text">{NAV_ITEMS.find((item) => item.id === activeNav)?.label || 'Dashboard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-xs text-text-muted sm:block">{user?.email}</span>
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">{user?.name?.charAt(0) || 'G'}</div>
            )}
          </div>
        </header>
        <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <footer className="border-t border-border bg-surface px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 text-[11px] text-text-muted">
            <span>&copy; {new Date().getFullYear()} Sipanda v{APP_VERSION}</span>
            <span>Sistem Penilaian Jawaban Siswa</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
