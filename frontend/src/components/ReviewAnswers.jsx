import { useEffect, useState } from 'react'
import { fetchSoalByMapel } from '../services/hasilApi'

const OPTIONS = ['-', 'A', 'B', 'C', 'D', 'E']

export default function ReviewAnswers({ data, onSubmit, loading }) {
  const [nomorSoal, setNomorSoal] = useState([])
  const [jawaban, setJawaban] = useState({})
  const [skorEsai, setSkorEsai] = useState(data.skorAnalitik || [])
  const [loadingSoal, setLoadingSoal] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchSoalByMapel(data.kelas, data.mapel)
      .then((numbers) => {
        if (active) {
          setNomorSoal(numbers || [])
          setJawaban(Object.fromEntries((numbers || []).map((item) => [item.nomor, '-'])))
        }
      })
      .catch((err) => { if (active) setError(err.message || 'Gagal memuat daftar soal') })
      .finally(() => { if (active) setLoadingSoal(false) })
    return () => { active = false }
  }, [data.kelas, data.mapel])

  const totalEsai = skorEsai.reduce((sum, item) => sum + (Number(item.skor) || 0), 0)
  const maksEsai = skorEsai.reduce((sum, item) => sum + (Number(item.skorMaks) || 4), 0)
  const skorPG = nomorSoal.reduce((sum, item) => sum + (jawaban[item.nomor] === item.kunci ? 1 : 0), 0)
  const totalMaks = maksEsai + nomorSoal.length
  const totalSkor = totalEsai + skorPG
  const totalPersentase = totalMaks > 0 ? Math.round((totalSkor / totalMaks) * 100) : 0

  const handleSubmit = (event) => {
    event.preventDefault()
    if (loadingSoal || nomorSoal.length === 0) {
      setError('Daftar soal untuk mapel ini belum tersedia.')
      return
    }
    setError('')
    onSubmit({
      jawaban: nomorSoal.map((item) => ({ nomor: item.nomor, jawaban: jawaban[item.nomor] || '-' })),
      aiResult: { ...data, skorAnalitik: skorEsai },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-text">Review Jawaban Siswa</h2>
            <p className="mt-1 text-sm text-text-muted">Evaluasi AI berhasil. Tinjau nilai esai dan masukkan jawaban pilihan ganda.</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-text">{data.namaSiswa}</p>
            <p className="text-xs text-text-muted">{data.kelas} · {data.mapel}</p>
          </div>
        </div>
      </section>

      {skorEsai.length > 0 && (
        <section className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-3.5 sm:px-6">
            <h3 className="text-sm font-semibold text-text">Review Skor Esai dari AI</h3>
          </div>
          <div className="divide-y divide-border">
            {skorEsai.map((item, index) => (
              <div key={`${item.aspek}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{item.aspek}</p>
                  <p className="mt-1 text-xs text-text-muted">{item.deskriptor}</p>
                  {item.feedback && <p className="mt-1 text-xs text-text-muted">{item.feedback}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm text-text">
                  Skor
                  <select
                    className="rounded-md border border-border bg-white px-2.5 py-2 text-sm"
                    value={item.skor}
                    onChange={(event) => setSkorEsai((previous) => previous.map((score, scoreIndex) => (
                      scoreIndex === index ? { ...score, skor: Number(event.target.value) } : score
                    )))}
                    aria-label={`Skor untuk ${item.aspek}`}
                  >
                    {Array.from({ length: Number(item.skorMaks) || 4 }, (_, score) => score + 1).map((score) => (
                      <option key={score} value={score}>{score} / {item.skorMaks || 4}</option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6">
          <h3 className="text-sm font-semibold text-text">Jawaban Pilihan Ganda</h3>
          <span className="text-xs tabular-nums text-text-muted">
            {loadingSoal ? 'Memuat soal...' : `${nomorSoal.length} soal · A-E`}
          </span>
        </div>
        {loadingSoal ? (
          <p className="px-5 py-8 text-center text-sm text-text-muted">Memuat jumlah soal dari Database_Soal...</p>
        ) : nomorSoal.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-warning">Kunci soal mapel ini belum tersedia di Database_Soal.</p>
        ) : (
          <div className="grid gap-x-8 sm:grid-cols-2">
            {nomorSoal.map((item) => (
              <label key={item.nomor} className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 sm:px-6">
                <span className="text-sm font-medium tabular-nums text-text">Soal {item.nomor}</span>
                <select
                  className="min-w-24 rounded-md border border-border bg-white px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  value={jawaban[item.nomor] || '-'}
                  onChange={(event) => setJawaban((previous) => ({ ...previous, [item.nomor]: event.target.value }))}
                  aria-label={`Jawaban soal ${item.nomor}`}
                >
                  {OPTIONS.map((option) => <option key={option} value={option}>{option === '-' ? 'Kosong' : option}</option>)}
                </select>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase text-text-muted">Nilai sementara</p>
          <p className="mt-1 text-sm text-text">Esai {totalEsai}/{maksEsai} · PG {skorPG}/{nomorSoal.length} poin</p>
        </div>
        <p className="text-2xl font-bold tabular-nums text-primary">{totalPersentase}<span className="text-base font-medium">%</span></p>
      </section>

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}
      {data.hasilOCR && (
        <details className="rounded-lg border border-border bg-surface px-5 py-4">
          <summary className="cursor-pointer text-sm font-medium text-text">Lihat hasil OCR esai</summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-text-muted">{data.hasilOCR}</pre>
        </details>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || loadingSoal || nomorSoal.length === 0}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Menyimpan hasil...' : 'Simpan Hasil Review'}
        </button>
      </div>
    </form>
  )
}