export default function LoadingSpinner({ message = 'Memproses penilaian...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-primary-light animate-spin border-t-primary shadow-sm" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <p className="mt-6 text-sm font-medium text-text">{message}</p>
      <p className="mt-1 text-xs text-text-muted">Mohon tunggu sebentar...</p>
    </div>
  )
}
