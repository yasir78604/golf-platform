function Alert({ message, type = 'error' }) {
  if (!message) return null

  const styles = {
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    success: 'bg-accent/10 border-accent/20 text-accent',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }

  return (
    <div className={`mb-6 px-4 py-3 border rounded-lg text-sm text-center ${styles[type]}`}>
      {message}
    </div>
  )
}

export default Alert
