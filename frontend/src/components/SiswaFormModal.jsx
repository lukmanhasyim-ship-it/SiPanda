import { useState, useEffect } from 'react'
import { fetchAllKelas } from '../services/kelasApi'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const emptyForm = () => ({ nis: '', nama: '', kelas: '' })

export default function SiswaFormModal({ open, siswa, onSave, onClose }) {
  const isEdit = !!siswa
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [kelasOptions, setKelasOptions] = useState([])

  useEffect(() => {
    fetchAllKelas().then(setKelasOptions).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      if (siswa) {
        setForm({ nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas })
      } else {
        setForm(emptyForm())
      }
      setErrors({})
    }
  }, [open, siswa])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const errs = {}
    if (!form.nis.trim()) errs.nis = 'NIS wajib diisi'
    if (!form.nama.trim()) errs.nama = 'Nama siswa wajib diisi'
    if (!form.kelas) errs.kelas = 'Pilih kelas'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ nis: form.nis.trim(), nama: form.nama.trim(), kelas: form.kelas })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-8">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">
            {isEdit ? 'Edit Siswa' : 'Tambah Siswa Baru'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              NIS <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.nis}
              onChange={(e) => handleChange('nis', e.target.value)}
              readOnly={isEdit}
              className={classNames(
                'w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors',
                isEdit && 'bg-gray-50 text-text-muted cursor-not-allowed',
                errors.nis ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
              )}
              placeholder="Contoh: 2024001"
            />
            {errors.nis && <p className="mt-1 text-xs text-danger">{errors.nis}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Nama Siswa <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => handleChange('nama', e.target.value)}
              className={classNames(
                'w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors',
                errors.nama ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
              )}
              placeholder="Nama lengkap siswa"
            />
            {errors.nama && <p className="mt-1 text-xs text-danger">{errors.nama}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Kelas <span className="text-danger">*</span>
            </label>
            <select
              value={form.kelas}
              onChange={(e) => handleChange('kelas', e.target.value)}
              className={classNames(
                'w-full px-3 py-2.5 rounded-lg border bg-white text-sm appearance-none outline-none transition-colors',
                errors.kelas ? 'border-danger ring-1 ring-danger/20' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
              )}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {errors.kelas && <p className="mt-1 text-xs text-danger">{errors.kelas}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
