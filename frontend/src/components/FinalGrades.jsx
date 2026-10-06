import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { fetchRiwayatHasil } from '../services/hasilApi'

function getAnalysisItems(item) {
  if (Array.isArray(item.skorAnalitik)) return item.skorAnalitik
  try {
    return JSON.parse(item.skorAnalitik || '[]')
  } catch {
    return []
  }
}

function getRecordSummary(item) {
  const analysis = getAnalysisItems(item)
  const pgItems = analysis.filter((score) => /^Soal\s+\d+/i.test(score.aspek || ''))
  const essayItems = analysis.filter((score) => !/^Soal\s+\d+/i.test(score.aspek || ''))
  const skorPG = pgItems.reduce((sum, score) => sum + (Number(score.skor) || 0), 0)
  const maksPG = pgItems.reduce((sum, score) => sum + (Number(score.skorMaks) || 1), 0)
  const skorEsai = essayItems.reduce((sum, score) => sum + (Number(score.skor) || 0), 0)
  const maksEsai = essayItems.reduce((sum, score) => sum + (Number(score.skorMaks) || 4), 0)
  const totalMaks = Number(item.totalMaks) || 0
  const totalSkor = Number(item.totalSkor) || 0
  return {
    pgPercent: maksPG ? (skorPG / maksPG) * 100 : null,
    essayPercent: maksEsai ? (skorEsai / maksEsai) * 100 : null,
    overallPercent: totalMaks ? (totalSkor / totalMaks) * 100 : null,
  }
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function combineGrades(records) {
  const groups = new Map()
  records.forEach((item) => {
    const key = [item.nis, item.kelas, item.mapel].join('|')
    if (!groups.has(key)) {
      groups.set(key, { ...item, pgResults: [], essayResults: [], overallResults: [] })
    }
    const group = groups.get(key)
    const summary = getRecordSummary(item)
    if (summary.pgPercent !== null) group.pgResults.push(summary.pgPercent)
    if (summary.essayPercent !== null) group.essayResults.push(summary.essayPercent)
    if (summary.pgPercent === null && summary.essayPercent === null && summary.overallPercent !== null) {
      group.overallResults.push(summary.overallPercent)
    }
    if (new Date(item.timestamp) > new Date(group.timestamp)) group.timestamp = item.timestamp
  })

  return [...groups.values()].map((group) => {
    const nilaiPG = average(group.pgResults)
    const nilaiEsai = average(group.essayResults)
    const componentGrades = [nilaiPG, nilaiEsai].filter((value) => value !== null)
    const nilaiAkhir = componentGrades.length
      ? Math.round(average(componentGrades))
      : Math.round(average(group.overallResults) || 0)
    return { ...group, nilaiPG, nilaiEsai, nilaiAkhir }
  })
}

function getSheetName(mapel, usedNames) {
  let name = String(mapel || 'Tanpa Mapel').replace(/[\\/?*:[\]]/g, ' ').trim().slice(0, 31) || 'Tanpa Mapel'
  const baseName = name
  let suffix = 2
  while (usedNames.has(name.toLowerCase())) {
    const suffixText = ` (${suffix++})`
    name = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`
  }
  usedNames.add(name.toLowerCase())
  return name
}

function exportBySubject(rows) {
  if (rows.length === 0) return
  const workbook = XLSX.utils.book_new()
  const bySubject = new Map()

  rows.forEach((item) => {
    const subject = item.mapel || 'Tanpa Mapel'
    if (!bySubject.has(subject)) bySubject.set(subject, [])
    const score = item
    bySubject.get(subject).push({
      Tanggal: item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : '',
      NIS: item.nis || '',
      Nama: item.namaSiswa || '',
      Kelas: item.kelas || '',
      'Nilai PG': score.nilaiPG === null ? '' : Math.round(score.nilaiPG),
      'Nilai Esai': score.nilaiEsai === null ? '' : Math.round(score.nilaiEsai),
      'Nilai Akhir': score.nilaiAkhir,
    })
  })

  const usedNames = new Set()
  bySubject.forEach((data, subject) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    worksheet['!cols'] = [
      { wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 18 },
      { wch: 12 }, { wch: 14 }, { wch: 14 },
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, getSheetName(subject, usedNames))
  })

  XLSX.writeFile(workbook, `nilai_akhir_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export default function FinalGrades() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [filterMapel, setFilterMapel] = useState('')

  useEffect(() => {
    let active = true
    fetchRiwayatHasil(5000)
      .then((data) => { if (active) setGrades(data || []) })
      .catch((err) => { if (active) setError(err.message || 'Gagal memuat nilai akhir') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const classes = [...new Set(grades.map((item) => item.kelas).filter(Boolean))].sort()
  const subjects = [...new Set(grades.map((item) => item.mapel).filter(Boolean))].sort()
  const combinedGrades = combineGrades(grades)
  const filteredGrades = combinedGrades.filter((item) => (
    (!filterKelas || item.kelas === filterKelas) && (!filterMapel || item.mapel === filterMapel)
  ))

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Nilai Akhir</h2>
          <p className="mt-1 text-sm text-text-muted">Nilai akhir dihitung dari rata-rata nilai pilihan ganda dan esai.</p>
        </div>
        <button
          type="button"
          onClick={() => exportBySubject(filteredGrades)}
          disabled={filteredGrades.length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l4-4m-4 4l-4-4m-4 7v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
          </svg>
          Ekspor Excel per Mapel
        </button>
      </div>

      <div className="flex flex-wrap gap-3 border-y border-border py-3">
        <select aria-label="Filter kelas" value={filterKelas} onChange={(event) => setFilterKelas(event.target.value)} className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text">
          <option value="">Semua kelas</option>
          {classes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Filter mata pelajaran" value={filterMapel} onChange={(event) => setFilterMapel(event.target.value)} className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text">
          <option value="">Semua mapel</option>
          {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <span className="ml-auto self-center text-xs tabular-nums text-text-muted">{filteredGrades.length} hasil</span>
      </div>

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-text-muted">Memuat nilai akhir...</p>
      ) : filteredGrades.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">Belum ada nilai untuk ditampilkan.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-gray-50/70 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Siswa</th>
                <th className="px-4 py-3 font-medium">Kelas</th>
                <th className="px-4 py-3 font-medium">Mapel</th>
                <th className="px-4 py-3 text-right font-medium">PG</th>
                <th className="px-4 py-3 text-right font-medium">Esai</th>
                <th className="px-4 py-3 text-right font-medium">Nilai Akhir</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGrades.map((item, index) => {
                return (
                  <tr key={`${item.timestamp}-${item.nis}-${index}`} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{item.namaSiswa || '-'}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{item.nis || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-text">{item.kelas || '-'}</td>
                    <td className="px-4 py-3 text-text">{item.mapel || '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text">{item.nilaiPG === null ? '-' : `${Math.round(item.nilaiPG)}%`}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text">{item.nilaiEsai === null ? '-' : `${Math.round(item.nilaiEsai)}%`}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">{item.nilaiAkhir}%</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">{item.timestamp ? new Date(item.timestamp).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
