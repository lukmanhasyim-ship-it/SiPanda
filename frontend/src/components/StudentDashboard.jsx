import { useEffect, useState } from 'react'
import { fetchStudentDashboard } from '../services/hasilApi'

function parseAnalysis(value) {
  if (Array.isArray(value)) return value
  try {
    return JSON.parse(value || '[]')
  } catch {
    return []
  }
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null
}

function summarizeBySubject(records) {
  const groups = new Map()
  records.forEach((record) => {
    const mapel = record.mapel || 'Mata pelajaran'
    if (!groups.has(mapel)) groups.set(mapel, { pg: [], essay: [], overall: [], latest: null, feedback: '', recommendation: '', feedbackDate: null, ocr: '', ocrDate: null })
    const group = groups.get(mapel)
    const analysis = parseAnalysis(record.skorAnalitik)
    const pg = analysis.filter((item) => /^Soal\s+\d+/i.test(item.aspek || ''))
    const essay = analysis.filter((item) => !/^Soal\s+\d+/i.test(item.aspek || ''))

    if (pg.length) {
      const score = pg.reduce((sum, item) => sum + (Number(item.skor) || 0), 0)
      const max = pg.reduce((sum, item) => sum + (Number(item.skorMaks) || 1), 0)
      if (max) group.pg.push((score / max) * 100)
    }
    if (essay.length) {
      const score = essay.reduce((sum, item) => sum + (Number(item.skor) || 0), 0)
      const max = essay.reduce((sum, item) => sum + (Number(item.skorMaks) || 4), 0)
      if (max) group.essay.push((score / max) * 100)
    }
    if (!pg.length && !essay.length && Number(record.totalMaks) > 0) {
      group.overall.push((Number(record.totalSkor || 0) / Number(record.totalMaks)) * 100)
    }

    const timestamp = record.timestamp ? new Date(record.timestamp) : null
    if (timestamp && (!group.latest || timestamp > group.latest)) group.latest = timestamp

    const feedback = String(record.feedbackAI || '').trim()
    const recommendation = String(record.rekomendasi || '').trim()
    if ((feedback || recommendation) && timestamp && (!group.feedbackDate || timestamp > group.feedbackDate)) {
      group.feedback = feedback
      group.recommendation = recommendation
      group.feedbackDate = timestamp
    }

    const ocr = String(record.hasilOCR || '').trim()
    if (ocr && timestamp && (!group.ocrDate || timestamp > group.ocrDate)) {
      group.ocr = ocr
      group.ocrDate = timestamp
    }
  })

  return [...groups.entries()].map(([mapel, group]) => {
    const nilaiPG = average(group.pg)
    const nilaiEsai = average(group.essay)
    const components = [nilaiPG, nilaiEsai].filter((value) => value !== null)
    const nilaiAkhir = components.length ? Math.round(average(components)) : Math.round(average(group.overall) || 0)
    return {
      mapel,
      nilaiPG,
      nilaiEsai,
      nilaiAkhir,
      latest: group.latest,
      feedback: group.feedback,
      recommendation: group.recommendation,
      feedbackDate: group.feedbackDate,
      ocr: group.ocr,
      ocrDate: group.ocrDate,
    }
  }).sort((a, b) => a.mapel.localeCompare(b.mapel))
}

export default function StudentDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchStudentDashboard()
      .then((data) => { if (active) setDashboard(data) })
      .catch((err) => { if (active) setError(err.message || 'Nilai siswa gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const results = summarizeBySubject(dashboard?.hasil || [])
  const gradedResults = results.filter((item) => item.nilaiPG !== null || item.nilaiEsai !== null || item.nilaiAkhir > 0)
  const overallAverage = gradedResults.length
    ? Math.round(gradedResults.reduce((sum, item) => sum + item.nilaiAkhir, 0) / gradedResults.length)
    : null
  const student = dashboard?.siswa || user

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <main className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Dashboard Siswa</p>
            <h1 className="mt-1 text-xl font-semibold text-text">Halo, {student?.nama || student?.namaSiswa || user?.name}</h1>
            <p className="mt-1 text-sm text-text-muted">Kelas {student?.kelas || user?.kelas} · {student?.nis || user?.nis}</p>
          </div>
          <button type="button" onClick={onLogout} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text hover:bg-gray-50">
            Keluar
          </button>
        </header>

        <section className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <h2 className="text-base font-semibold text-text">Nilai per Mata Pelajaran</h2>
            <p className="mt-1 text-sm text-text-muted">Nilai akhir merupakan rata-rata nilai pilihan ganda dan esai.</p>
          </div>
          <div className="border-l-2 border-primary pl-4 sm:text-right">
            <p className="text-xs text-text-muted">Rata-rata seluruh mapel</p>
            <p className="text-2xl font-semibold tabular-nums text-primary">{overallAverage === null ? '—' : `${overallAverage}%`}</p>
          </div>
        </section>

        {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
        {loading ? (
          <p className="py-16 text-center text-sm text-text-muted">Memuat nilai...</p>
        ) : results.length === 0 ? (
          <div className="border-y border-border py-14 text-center">
            <h3 className="text-sm font-semibold text-text">Belum ada nilai</h3>
            <p className="mt-1 text-sm text-text-muted">Nilai akan tampil setelah hasil penilaian untuk akun ini tersimpan.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {results.map((item) => (
              <article key={item.mapel} className="py-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-text">{item.mapel}</h3>
                    <p className="mt-1 text-xs text-text-muted">Terakhir dinilai: {item.latest ? item.latest.toLocaleDateString('id-ID') : '—'}</p>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 sm:min-w-82.5">
                    <div className="text-right">
                      <dt className="text-[11px] text-text-muted">PG</dt>
                      <dd className="text-sm tabular-nums text-text">{item.nilaiPG === null ? '—' : `${Math.round(item.nilaiPG)}%`}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-[11px] text-text-muted">Esai</dt>
                      <dd className="text-sm tabular-nums text-text">{item.nilaiEsai === null ? '—' : `${Math.round(item.nilaiEsai)}%`}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-[11px] text-text-muted">Nilai Akhir</dt>
                      <dd className="text-sm font-semibold tabular-nums text-primary">{item.nilaiAkhir}%</dd>
                    </div>
                  </dl>
                </div>

                {(item.feedback || item.recommendation) && (
                  <section className="mt-4 border-l-2 border-accent pl-4" aria-label={`Masukan untuk ${item.mapel}`}>
                    <h4 className="text-xs font-semibold uppercase text-text-muted">Masukan untuk siswa</h4>
                    {item.feedback && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{item.feedback}</p>}
                    {item.recommendation && (
                      <div className={item.feedback ? 'mt-3' : 'mt-2'}>
                        <p className="text-xs font-medium text-text-muted">Rekomendasi</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text">{item.recommendation}</p>
                      </div>
                    )}
                    {item.feedbackDate && <p className="mt-2 text-[11px] text-text-muted">Diperbarui {item.feedbackDate.toLocaleDateString('id-ID')}</p>}
                  </section>
                )}

                {item.ocr && (
                  <details className="mt-4 border-t border-border pt-3">
                    <summary className="cursor-pointer text-xs font-medium text-text-muted hover:text-text">
                      Lihat hasil OCR{item.ocrDate ? ` · ${item.ocrDate.toLocaleDateString('id-ID')}` : ''}
                    </summary>
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap wrap-break-word rounded-md bg-gray-50 p-3 text-xs leading-relaxed text-text">{item.ocr}</pre>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-text-muted">
          <span>{user?.email}</span>
          <span>{results.length} mata pelajaran</span>
        </footer>
      </main>
    </div>
  )
}
