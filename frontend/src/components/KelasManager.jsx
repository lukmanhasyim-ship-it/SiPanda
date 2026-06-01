import { useState, useEffect } from 'react'
import { fetchAllKelas, addKelas, deleteKelas } from '../services/kelasApi'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function KelasManager() {
  const [kelasList, setKelasList] = useState([])
  const [loading, setLoading] = useState(true)
  const [newKelas, setNewKelas] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchAllKelas()
      setKelasList(data)
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

  const handleAdd = async () => {
    if (!newKelas.trim()) return
    try {
      await addKelas(newKelas.trim())
      showToast(`Kelas ${newKelas.trim()} berhasil ditambahkan`)
      setNewKelas('')
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (kelas) => {
    if (!window.confirm(`Hapus kelas ${kelas}?`)) return
    try {
      await deleteKelas(kelas)
      showToast(`Kelas ${kelas} berhasil dihapus`)
      loadData()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {toast && (
        <div className={classNames(
          'fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
          toast.type === 'error' ? 'bg-danger text-white' : 'bg-secondary text-white'
        )}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Manajemen Kelas
        </h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newKelas}
          onChange={(e) => setNewKelas(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nama kelas baru..."
          className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        <button
          onClick={handleAdd}
          disabled={!newKelas.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Tambah
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-text-muted">Memuat data...</div>
      ) : kelasList.length === 0 ? (
        <div className="text-center py-10 text-sm text-text-muted">Belum ada kelas</div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">No</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Nama Kelas</th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kelasList.map((k, i) => (
                  <tr key={k} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-text">{k}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(k)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light/50 transition-colors" title="Hapus">
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
            Total: {kelasList.length} kelas
          </div>
        </div>
      )}
    </div>
  )
}
