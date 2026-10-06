import { useEffect, useState, useCallback } from 'react'
import { fetchTeacherDashboard } from '../services/hasilApi'

function parseScores(value) {
  if (Array.isArray(value)) return value
  try {
    return JSON.parse(value || '[]')
  } catch {
    return []
  }
}

function getComponentGrades(result) {
  const scores = parseScores(result.skorAnalitik)
  const pg = scores.filter((item) => /^Soal\s+\d+/i.test(item.aspek || ''))
  const essay = scores.filter((item) => !/^Soal\s+\d+/i.test(item.aspek || ''))
  const percentage = (items, defaultMax) => {
    if (!items.length) return null
    const score = items.reduce((sum, item) => sum + (Number(item.skor) || 0), 0)
    const max = items.reduce((sum, item) => sum + (Number(item.skorMaks) || defaultMax), 0)
    return max ? (score / max) * 100 : null
  }
  return { pg: percentage(pg, 1), essay: percentage(essay, 4) }
}

function buildOverview(records) {
  const studentSubjects = new Map()
  for (const record of records) {
    const key = [record.nis, record.kelas, record.mapel].join('|')
    if (!studentSubjects.has(key)) studentSubjects.set(key, { mapel: record.mapel || 'Lainnya', pg: [], essay: [], total: [] })
    const group = studentSubjects.get(key)
    const scores = getComponentGrades(record)
    if (scores.pg !== null) group.pg.push(scores.pg)
    if (scores.essay !== null) group.essay.push(scores.essay)
    if (scores.pg === null && scores.essay === null && Number(record.totalMaks) > 0) {
      group.total.push((Number(record.totalSkor || 0) / Number(record.totalMaks)) * 100)
    }
  }

  const subjectGrades = new Map()
  for (const group of studentSubjects.values()) {
    const pg = group.pg.length ? group.pg.reduce((sum, value) => sum + value, 0) / group.pg.length : null
    const essay = group.essay.length ? group.essay.reduce((sum, value) => sum + value, 0) / group.essay.length : null
    const parts = [pg, essay].filter((value) => value !== null)
    const final = parts.length
      ? parts.reduce((sum, value) => sum + value, 0) / parts.length
      : group.total.length ? group.total.reduce((sum, value) => sum + value, 0) / group.total.length : null
    if (final === null) continue
    if (!subjectGrades.has(group.mapel)) subjectGrades.set(group.mapel, [])
    subjectGrades.get(group.mapel).push(final)
  }

  return [...subjectGrades.entries()]
    .map(([mapel, grades]) => ({ mapel, average: Math.round(grades.reduce((sum, value) => sum + value, 0) / grades.length), assessed: grades.length }))
    .sort((a, b) => b.average - a.average)
}

function formatDate(value) {
  if (!value) return 'Tanggal tidak tersedia'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Tanggal tidak tersedia' : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function Metric({ label, value, detail, tone = 'blue' }) {
  const tones = {
    blue: 'border-l-blue-600',
    green: 'border-l-emerald-600',
    amber: 'border-l-amber-500',
    ink: 'border-l-slate-700',
  }
  return (
    <div className={`min-w-0 border-l-2 ${tones[tone]} py-1 pl-4`}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{detail}</p>
    </div>
  )
}

export default function TeacherDashboard({ user, onNavigate }) {
  const [data, setData] = useState({ siswa: [], kelas: [], mapel: [], hasil: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(() => {
    let active = true
    setLoading(true)
    setError('')

    fetchTeacherDashboard()
      .then((dashboardData) => {
        if (active && dashboardData) {
          setData({
            siswa: dashboardData.siswa || [],
            kelas: dashboardData.kelas || [],
            mapel: dashboardData.mapel || [],
            hasil: dashboardData.hasil || [],
          })
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Ringkasan dashboard gagal dimuat.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    return loadDashboard()
  }, [loadDashboard])

  const overview = buildOverview(data.hasil)
  const finalAverage = overview.length
    ? Math.round(overview.reduce((sum, subject) => sum + subject.average, 0) / overview.length)
    : null
  const latest = data.hasil.slice(0, 6)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-lg bg-slate-900 px-6 py-7 text-white sm:px-8 sm:py-9">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-300">Ruang kerja guru</p>
            <h2 className="mt-2 text-2xl font-semibold">Selamat datang, {user?.name?.split(' ')[0] || 'Guru'}</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">Pantau penilaian kelas dan lanjutkan pekerjaan yang perlu ditinjau.</p>
          </div>
          <button type="button" onClick={() => onNavigate('upload')} className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" /></svg>
            Penilaian baru
          </button>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-12 h-48 w-48 rounded-full border border-emerald-300/20" />
      </section>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadDashboard}
            className="ml-4 font-semibold underline hover:text-danger/80"
          >
            Coba lagi
          </button>
        </div>
      )}

      <section aria-label="Ringkasan data" className="grid grid-cols-2 gap-y-6 border-y border-border py-5 sm:grid-cols-4 sm:gap-0">
        <Metric label="Siswa terdaftar" value={loading ? '—' : data.siswa.length} detail={`${data.kelas.length} kelas`} tone="blue" />
        <Metric label="Mata pelajaran" value={loading ? '—' : data.mapel.length} detail="Tersedia untuk dinilai" tone="green" />
        <Metric label="Penilaian tersimpan" value={loading ? '—' : data.hasil.length} detail="Seluruh riwayat" tone="amber" />
        <Metric label="Rata-rata nilai" value={loading || finalAverage === null ? '—' : `${finalAverage}%`} detail={`${overview.length} mapel dengan nilai`} tone="ink" />
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-text">Aktivitas penilaian</h3>
              <p className="mt-1 text-xs text-text-muted">Hasil terbaru yang masuk</p>
            </div>
            <button type="button" onClick={() => onNavigate('history')} className="text-xs font-semibold text-primary hover:text-primary-dark">Lihat riwayat</button>
          </div>
          {loading ? (
            <p className="border-y border-border py-8 text-sm text-text-muted">Memuat aktivitas...</p>
          ) : latest.length === 0 ? (
            <div className="border-y border-border py-8">
              <p className="text-sm font-medium text-text">Belum ada aktivitas penilaian</p>
              <p className="mt-1 text-xs text-text-muted">Mulai dengan mengunggah lembar jawaban siswa.</p>
            </div>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {latest.map((item, index) => {
                const percentage = Number(item.totalMaks) > 0 ? Math.round((Number(item.totalSkor) / Number(item.totalMaks)) * 100) : 0
                return (
                  <button key={`${item.nis}-${item.timestamp}-${index}`} type="button" onClick={() => onNavigate('history')} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 text-left hover:bg-white/70">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text">{item.namaSiswa}</span>
                      <span className="mt-1 block truncate text-xs text-text-muted">{item.kelas} · {item.mapel} · {formatDate(item.timestamp)}</span>
                    </span>
                    <span className={`text-sm font-semibold tabular-nums ${percentage >= 75 ? 'text-secondary' : percentage >= 55 ? 'text-warning' : 'text-danger'}`}>{percentage}%</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <aside>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text">Rata-rata per mapel</h3>
            <p className="mt-1 text-xs text-text-muted">Rata-rata akhir tiap siswa</p>
          </div>
          {loading ? (
            <p className="border-y border-border py-8 text-sm text-text-muted">Menghitung nilai...</p>
          ) : overview.length === 0 ? (
            <p className="border-y border-border py-8 text-sm text-text-muted">Belum ada hasil untuk diringkas.</p>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {overview.slice(0, 6).map((subject) => (
                <div key={subject.mapel} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-text">{subject.mapel}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-text">{subject.average}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, subject.average))}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">{subject.assessed} siswa dinilai</p>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => onNavigate('nilai')} className="mt-3 text-xs font-semibold text-primary hover:text-primary-dark">Buka rekap nilai</button>
        </aside>
      </section>

      <section className="border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-text">Akses cepat</h3>
            <p className="mt-1 text-xs text-text-muted">Kelola data penilaian</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Data siswa', meta: `${data.siswa.length} siswa`, nav: 'siswa', tone: 'text-blue-700' },
            { label: 'Manajemen kunci', meta: 'Rubrik dan kunci PG', nav: 'rubrik', tone: 'text-emerald-700' },
            { label: 'Kelas', meta: `${data.kelas.length} kelas`, nav: 'kelas', tone: 'text-amber-700' },
            { label: 'Mata pelajaran', meta: `${data.mapel.length} mapel`, nav: 'mapel', tone: 'text-slate-700' },
          ].map((action) => (
            <button key={action.nav} type="button" onClick={() => onNavigate(action.nav)} className="border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-white">
              <span className={`block text-sm font-semibold ${action.tone}`}>{action.label}</span>
              <span className="mt-1 block text-xs text-text-muted">{action.meta}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
