import { useEffect, useState } from 'react'
import { fetchSiswaByKelas } from '../services/siswaApi'
import { fetchAllKelas } from '../services/kelasApi'
import { fetchAllMapel } from '../services/mapelApi'
import { fetchSoalByMapel } from '../services/hasilApi'

const OPTIONS = ['A', 'B', 'C', 'D', 'E']

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ManualGradeForm({ onSubmit, loading }) {
  const [kelas, setKelas] = useState('')
  const [mapel, setMapel] = useState('')
  const [nis, setNis] = useState('')
  const [kelasOptions, setKelasOptions] = useState([])
  const [mapelOptions, setMapelOptions] = useState([])
  const [siswaList, setSiswaList] = useState([])
  const [nomorSoal, setNomorSoal] = useState([])
  const [jawaban, setJawaban] = useState({})
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  const [loadingSoal, setLoadingSoal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllKelas().then(setKelasOptions).catch(() => setError('Gagal memuat daftar kelas'))
    fetchAllMapel().then(setMapelOptions).catch(() => setError('Gagal memuat daftar mapel'))
  }, [])

  useEffect(() => {
    setNis('')
    setSiswaList([])
    if (!kelas) return
    let active = true
    setLoadingSiswa(true)
    fetchSiswaByKelas(kelas)
      .then((data) => { if (active) setSiswaList(data) })
      .catch(() => { if (active) setError('Gagal memuat siswa untuk kelas ini') })
      .finally(() => { if (active) setLoadingSiswa(false) })
    return () => { active = false }
  }, [kelas])

  useEffect(() => {
    setNomorSoal([])
    setJawaban({})
    if (!kelas || !mapel) return
    let active = true
    setLoadingSoal(true)
    setError('')
    fetchSoalByMapel(kelas, mapel)
      .then((numbers) => {
        if (active) setNomorSoal(numbers || [])
      })
      .catch((err) => { if (active) setError(err.message || 'Gagal memuat kunci soal') })
      .finally(() => { if (active) setLoadingSoal(false) })
    return () => { active = false }
  }, [kelas, mapel])

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    if (!nis || !kelas || !mapel) {
      setError('Pilih kelas, mata pelajaran, dan siswa terlebih dahulu.')
      return
    }
    if (nomorSoal.length === 0) {
      setError('Belum ada kunci soal untuk mapel dan kelas ini di Database_Soal.')
      return
    }
    const unanswered = nomorSoal.find((number) => !jawaban[number])
    if (unanswered) {
      setError(`Jawaban soal nomor ${unanswered} belum dipilih.`)
      return
    }
    onSubmit({
      nis,
      kelas,
      mapel,
      jawaban: nomorSoal.map((nomor) => ({ nomor, jawaban: jawaban[nomor] })),
    })
  }

  const selectClass = 'w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20'

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-text">Koreksi Pilihan Ganda</h2>
            <p className="mt-1 text-sm text-text-muted">Pilih jawaban siswa untuk setiap soal. Kunci dibaca dari Database_Soal.</p>
          </div>
          <span className="shrink-0 rounded-md bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">A-E</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-text">
            Kelas
            <select className={`${selectClass} mt-1.5`} value={kelas} onChange={(event) => setKelas(event.target.value)}>
              <option value="">Pilih kelas</option>
              {kelasOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-text">
            Mata Pelajaran
            <select className={`${selectClass} mt-1.5`} value={mapel} onChange={(event) => setMapel(event.target.value)}>
              <option value="">Pilih mapel</option>
              {mapelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-text">
            Siswa
            <select className={`${selectClass} mt-1.5 disabled:bg-gray-50 disabled:text-text-muted`} value={nis} onChange={(event) => setNis(event.target.value)} disabled={!kelas || loadingSiswa}>
              <option value="">{loadingSiswa ? 'Memuat siswa...' : 'Pilih siswa'}</option>
              {siswaList.map((siswa) => <option key={siswa.nis} value={siswa.nis}>{siswa.nis} - {siswa.nama}</option>)}
            </select>
          </label>
        </div>
      </section>

      {kelas && mapel && (
        <section className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6">
            <h3 className="text-sm font-semibold text-text">Jawaban Siswa</h3>
            <span className="text-xs tabular-nums text-text-muted">
              {loadingSoal ? 'Memuat soal...' : `${nomorSoal.length} soal`}
            </span>
          </div>
          {loadingSoal ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">Memuat daftar soal untuk mapel ini...</p>
          ) : nomorSoal.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-warning">Kunci soal untuk mapel dan kelas ini belum tersedia.</p>
          ) : (
            <div className="divide-y divide-border">
              {nomorSoal.map((nomor) => (
                <fieldset key={nomor} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 sm:px-6">
                  <legend className="sr-only">Soal {nomor}</legend>
                  <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-text">Soal {nomor}</span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Jawaban soal ${nomor}`}>
                    {OPTIONS.map((option) => (
                      <label key={option} className={classNames(
                        'flex h-9 w-10 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition-colors',
                        jawaban[nomor] === option
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-text hover:border-primary/60'
                      )}>
                        <input
                          className="sr-only"
                          type="radio"
                          name={`jawaban-${nomor}`}
                          value={option}
                          checked={jawaban[nomor] === option}
                          onChange={() => setJawaban((previous) => ({ ...previous, [nomor]: option }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </section>
      )}

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-text-muted">Jumlah soal mengikuti Database_Soal untuk mapel terpilih.</span>
        <button
          type="submit"
          disabled={loading || loadingSoal || nomorSoal.length === 0}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Koreksi'}
        </button>
      </div>
    </form>
  )
}