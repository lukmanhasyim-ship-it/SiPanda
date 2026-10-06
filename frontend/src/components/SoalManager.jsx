import { useEffect, useState } from 'react'
import { addSoal, deleteSoal, fetchAllSoal } from '../services/soalApi'
import { fetchAllKelas } from '../services/kelasApi'
import { fetchAllMapel } from '../services/mapelApi'

const OPTIONS = ['A', 'B', 'C', 'D', 'E']

export default function SoalManager() {
  const [soalList, setSoalList] = useState([])
  const [kelasOptions, setKelasOptions] = useState([])
  const [mapelOptions, setMapelOptions] = useState([])
  const [kelas, setKelas] = useState('')
  const [mapel, setMapel] = useState('')
  const [nomor, setNomor] = useState('')
  const [kunci, setKunci] = useState('A')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([fetchAllKelas(), fetchAllMapel(), fetchAllSoal()])
      .then(([kelasData, mapelData, soalData]) => {
        if (!active) return
        setKelasOptions(kelasData)
        setMapelOptions(mapelData)
        setSoalList(soalData)
      })
      .catch((err) => { if (active) setError(err.message || 'Gagal memuat data kunci') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const loadSoal = async () => {
    try {
      setError('')
      setSoalList(await fetchAllSoal())
    } catch (err) {
      setError(err.message || 'Gagal memuat data kunci')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!kelas || !mapel || !/^\d+$/.test(nomor)) {
      setError('Pilih kelas, mapel, dan isi nomor soal berupa angka.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addSoal({ kelas, mapel, nomor, kunci })
      setNomor('')
      setToast('Kunci jawaban berhasil ditambahkan.')
      await loadSoal()
    } catch (err) {
      setError(err.message || 'Gagal menambahkan kunci jawaban')
    } finally {
      setSaving(false)
      window.setTimeout(() => setToast(''), 3000)
    }
  }

  const handleDelete = async (soal) => {
    const label = `soal ${soal.nomor} ${soal.mapel} (${soal.kelas})`
    if (!window.confirm(`Hapus kunci untuk ${label}?`)) return
    try {
      await deleteSoal(soal)
      setToast('Kunci jawaban berhasil dihapus.')
      await loadSoal()
    } catch (err) {
      setError(err.message || 'Gagal menghapus kunci jawaban')
    } finally {
      window.setTimeout(() => setToast(''), 3000)
    }
  }

  const groupedSoal = soalList.reduce((mapelGroups, soal) => {
    const mapelName = soal.mapel || 'Tanpa Mapel'
    const kelasName = soal.kelas || 'Semua kelas'
    if (!mapelGroups.has(mapelName)) mapelGroups.set(mapelName, new Map())
    const kelasGroups = mapelGroups.get(mapelName)
    if (!kelasGroups.has(kelasName)) kelasGroups.set(kelasName, [])
    kelasGroups.get(kelasName).push(soal)
    return mapelGroups
  }, new Map())

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-base font-semibold text-text">Kunci Pilihan Ganda</h2>
        <p className="mt-1 text-sm text-text-muted">Kelola kunci per nomor, kelas, dan mata pelajaran. Impor massal tersedia bersama rubrik penilaian.</p>
      </div>

      {toast && <p role="status" className="rounded-md border border-secondary/30 bg-secondary-light px-4 py-3 text-sm text-secondary">{toast}</p>}
      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-sm font-medium text-text">
          Kelas
          <select required value={kelas} onChange={(event) => setKelas(event.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm">
            <option value="">Pilih kelas</option>
            {kelasOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-text sm:col-span-2 lg:col-span-1">
          Mapel
          <select required value={mapel} onChange={(event) => setMapel(event.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm">
            <option value="">Pilih mapel</option>
            {mapelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-text">
          No. soal
          <input required min="1" step="1" type="number" value={nomor} onChange={(event) => setNomor(event.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm" />
        </label>
        <label className="text-sm font-medium text-text">
          Kunci
          <select value={kunci} onChange={(event) => setKunci(event.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm">
            {OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={saving || kelasOptions.length === 0 || mapelOptions.length === 0} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Tambah Kunci'}
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-semibold text-text">Daftar Kunci</h3>
          <span className="text-xs tabular-nums text-text-muted">{loading ? 'Memuat...' : `${soalList.length} soal`}</span>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-text-muted">Memuat kunci...</p>
        ) : soalList.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-text-muted">Belum ada kunci pilihan ganda.</p>
        ) : (
          <div className="divide-y divide-border">
            {[...groupedSoal.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mapelName, kelasGroups]) => {
              const subjectCount = [...kelasGroups.values()].reduce((sum, questions) => sum + questions.length, 0)
              return (
                <details key={mapelName} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50/70 [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-center gap-3">
                      <svg className="h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      <span className="truncate text-sm font-semibold text-text">{mapelName}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-text-muted">{kelasGroups.size} kelas · {subjectCount} soal</span>
                  </summary>
                  <div className="divide-y divide-border border-t border-border bg-gray-50/40">
                    {[...kelasGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([kelasName, questions]) => (
                      <details key={`${mapelName}|${kelasName}`} className="group/kelas">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 pl-10 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 items-center gap-2">
                            <svg className="h-3.5 w-3.5 shrink-0 text-text-muted transition-transform group-open/kelas:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className="truncate text-sm font-medium text-text">{kelasName}</span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-text-muted">{questions.length} soal</span>
                        </summary>
                        <div className="overflow-x-auto border-t border-border bg-white">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
                                <th className="px-5 py-2.5 pl-14 font-medium">No. Soal</th>
                                <th className="px-4 py-2.5 font-medium">Kunci</th>
                                <th className="px-4 py-2.5 text-right font-medium">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {[...questions].sort((a, b) => Number(a.nomor) - Number(b.nomor)).map((soal) => (
                                <tr key={`${soal.kelas}|${soal.mapel}|${soal.nomor}`}>
                                  <td className="px-5 py-2.5 pl-14 tabular-nums text-text">Soal {soal.nomor}</td>
                                  <td className="px-4 py-2.5"><span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary-light font-semibold text-primary">{soal.kunci}</span></td>
                                  <td className="px-4 py-2.5 text-right">
                                    <button type="button" onClick={() => handleDelete(soal)} className="rounded p-1.5 text-text-muted hover:bg-danger-light/50 hover:text-danger" title="Hapus kunci" aria-label={`Hapus kunci soal ${soal.nomor}`}>
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
