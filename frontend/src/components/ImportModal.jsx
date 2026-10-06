import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

const COLUMN_MAP = {
  siswa: [
    { key: 'nis', label: 'NIS', aliases: ['NIS', 'nis', 'No Induk'] },
    { key: 'nama', label: 'Nama', aliases: ['Nama', 'nama', 'Nama_Siswa', 'Nama Siswa', 'nama_siswa'] },
    { key: 'kelas', label: 'Kelas', aliases: ['Kelas', 'kelas'] },
  ],
  rubrik: [
    { key: 'kelas', label: 'Kelas', aliases: ['Kelas', 'kelas'] },
    { key: 'mapel', label: 'Mapel', aliases: ['Mapel', 'mapel', 'Mata Pelajaran', 'Mata_Pelajaran'] },
    { key: 'aspek', label: 'Aspek Penilaian', aliases: ['Aspek_Penilaian', 'Aspek Penilaian', 'aspek_penilaian', 'aspek'] },
    { key: 'skor_4', label: 'Skor 4', aliases: ['Skor_4', 'Skor 4', 'skor_4'] },
    { key: 'skor_3', label: 'Skor 3', aliases: ['Skor_3', 'Skor 3', 'skor_3'] },
    { key: 'skor_2', label: 'Skor 2', aliases: ['Skor_2', 'Skor 2', 'skor_2'] },
    { key: 'skor_1', label: 'Skor 1', aliases: ['Skor_1', 'Skor 1', 'skor_1'] },
    { key: 'no_soal', label: 'No. Soal', aliases: ['No_Soal', 'No. Soal', 'No Soal', 'Nomor_Soal', 'Nomor Soal', 'No', 'Nomor'] },
    { key: 'kunci_jawaban', label: 'Kunci Jawaban', aliases: ['Kunci_Jawaban', 'Kunci Jawaban', 'Kunci', 'Jawaban_Benar'] },
  ],
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve(json)
      } catch (err) {
        reject(new Error('Gagal membaca file: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsArrayBuffer(file)
  })
}

function mapColumns(raw, type) {
  const cols = COLUMN_MAP[type]
  return raw.map((row) => {
    const mapped = {}
    for (const col of cols) {
      let val = ''
      for (const alias of col.aliases) {
        if (row[alias] !== undefined && String(row[alias]).trim()) {
          val = String(row[alias]).trim()
          break
        }
      }
      mapped[col.key] = val
    }
    return mapped
  }).filter((row) => {
    if (type === 'siswa') return row.nis && row.nama && row.kelas
    if (type === 'rubrik') {
      const rubricRow = row.kelas && row.mapel && row.aspek
      const answerKey = row.kelas && row.mapel && /^\d+$/.test(row.no_soal) && /^[ABCDE]$/i.test(row.kunci_jawaban)
      return rubricRow || answerKey
    }
    return false
  })
}

export default function ImportModal({ open, type, onImport, onClose }) {
  const [mapped, setMapped] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef(null)

  if (!open) return null

  const label = type === 'siswa' ? 'Siswa' : 'Rubrik & Kunci Jawaban'
  const columns = COLUMN_MAP[type]

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    setLoading(true)
    try {
      const json = await parseFile(file)
      const results = mapColumns(json, type)
      setMapped(results)
      if (results.length === 0) {
        setError('Tidak ada data valid ditemukan. Pastikan format kolom sesuai.')
      }
    } catch (err) {
      setError(err.message)
      setMapped([])
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (mapped.length === 0) return
    setLoading(true)
    try {
      await onImport(mapped)
      setMapped([])
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMapped([])
    setFileName('')
    setError('')
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const headerRow = [columns.map((c) => c.label)]
    if (type === 'siswa') {
      headerRow.push(['2024001', 'Contoh Nama', 'X-A'])
    } else {
      headerRow.push(['X-A', 'Matematika', 'Ketelitian', 'Sangat teliti', 'Teliti', 'Cukup', 'Kurang', '', ''])
      headerRow.push(['X-A', 'Matematika', '', '', '', '', '', '1', 'A'])
    }
    const ws = XLSX.utils.aoa_to_sheet(headerRow)
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `template_${type}.xlsx`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-8">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-2xl z-10 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text">Import Data {label}</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFile}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg className="w-10 h-10 mx-auto text-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-text mb-1">
                {fileName || 'Klik untuk upload file'}
              </p>
              <p className="text-xs text-text-muted">Format: CSV atau Excel (.xlsx, .xls)</p>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={downloadTemplate} className="text-xs text-primary hover:text-primary-dark underline">
              Download template {label}
            </button>
          </div>

          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-lg border border-danger/20">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 rounded-full border-4 border-primary-light animate-spin border-t-primary shadow-sm" />
              <span className="ml-3 text-sm text-text-muted">Memproses data...</span>
            </div>
          )}

          {mapped.length > 0 && !loading && (
            <div>
              <p className="text-sm font-medium text-text mb-2">
                {mapped.length} baris rubrik dan/atau kunci siap diimport:
              </p>
              <div className="border border-border rounded-xl overflow-auto max-h-60">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-border">
                      {columns.map((col) => (
                        <th key={col.key} className="text-left px-3 py-2 font-medium text-text-muted uppercase tracking-wider">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mapped.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {columns.map((col) => (
                          <td key={col.key} className="px-3 py-2 text-text">{row[col.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mapped.length > 50 && (
                  <div className="px-3 py-2 text-xs text-text-muted border-t border-border bg-gray-50/50 text-center">
                    ...dan {mapped.length - 50} data lainnya
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={mapped.length === 0 || loading}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? 'Mengimport...' : `Import ${mapped.length} Baris`}
          </button>
        </div>
      </div>
    </div>
  )
}
