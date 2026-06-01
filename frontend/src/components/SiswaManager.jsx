import { useState, useEffect } from 'react'
import { fetchAllSiswa, addSiswa, updateSiswa, deleteSiswa, importSiswa } from '../services/siswaApi'
import SiswaFormModal from './SiswaFormModal'
import ImportModal from './ImportModal'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SiswaManager() {
  const [siswaList, setSiswaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSiswa, setEditSiswa] = useState(null)
  const [filterKelas, setFilterKelas] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchAllSiswa()
      setSiswaList(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAdd = () => {
    setEditSiswa(null)
    setModalOpen(true)
  }

  const handleEdit = (siswa) => {
    setEditSiswa(siswa)
    setModalOpen(true)
  }

  const handleSave = async ({ nis, nama, kelas }) => {
    try {
      if (editSiswa) {
        await updateSiswa(editSiswa.nis, { nama, kelas })
        showToast(`Data ${nama} berhasil diperbarui`)
      } else {
        await addSiswa({ nis, nama, kelas })
        showToast(`Siswa ${nama} berhasil ditambahkan`)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (siswa) => {
    if (!window.confirm(`Hapus siswa ${siswa.nama} (NIS: ${siswa.nis})?`)) return
    try {
      await deleteSiswa(siswa.nis)
      showToast(`Siswa ${siswa.nama} berhasil dihapus`)
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filtered = siswaList.filter((s) => {
    if (filterKelas && s.kelas !== filterKelas) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.nis.toLowerCase().includes(q) && !s.nama.toLowerCase().includes(q)) return false
    }
    return true
  })

  const kelasOptions = [...new Set(siswaList.map((s) => s.kelas))].sort()

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toast && (
        <div className={classNames(
          'fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300',
          toast.type === 'error' ? 'bg-danger text-white' : 'bg-secondary text-white'
        )}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Manajemen Siswa
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {siswaList.length} siswa terdaftar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text text-sm font-medium hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import
          </button>
          <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Siswa
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIS atau nama..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>
        <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm bg-white appearance-none">
          <option value="">Semua Kelas</option>
          {kelasOptions.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        {(filterKelas || search) && (
          <button onClick={() => { setFilterKelas(''); setSearch('') }} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text border border-border hover:bg-gray-50 transition-colors">
            Hapus Filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-primary-light animate-spin border-t-primary shadow-sm" />
            <p className="mt-3 text-sm text-text-muted">Memuat data siswa...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-text">
            {siswaList.length === 0 ? 'Belum ada siswa' : 'Tidak ada siswa yang sesuai'}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {siswaList.length === 0 ? 'Klik "Tambah Siswa" untuk mendaftarkan siswa pertama' : 'Coba ubah kata kunci pencarian'}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">NIS</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Nama Siswa</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Kelas</th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((siswa) => (
                  <tr key={siswa.nis} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text">{siswa.nis}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text">{siswa.nama}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                        {siswa.kelas}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(siswa)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light/50 transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(siswa)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light/50 transition-colors" title="Hapus">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border bg-gray-50/50 text-xs text-text-muted text-right">
            Menampilkan {filtered.length} dari {siswaList.length} siswa
          </div>
        </div>
      )}

      <SiswaFormModal open={modalOpen} siswa={editSiswa} onSave={handleSave} onClose={() => setModalOpen(false)} />

      <ImportModal
        open={importOpen}
        type="siswa"
        onImport={async (rows) => {
          await importSiswa(rows)
          showToast(`${rows.length} siswa berhasil diimport`)
          setImportOpen(false)
          loadData()
        }}
        onClose={() => setImportOpen(false)}
      />
    </div>
  )
}
