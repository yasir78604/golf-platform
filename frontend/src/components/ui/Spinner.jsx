function Spinner({ className = 'w-8 h-8' }) {
  return (
    <div className={`${className} border-2 border-accent border-t-transparent rounded-full animate-spin`} />
  )
}

export default Spinner
