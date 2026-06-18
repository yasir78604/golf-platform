function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-2xl p-6 border border-border ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
