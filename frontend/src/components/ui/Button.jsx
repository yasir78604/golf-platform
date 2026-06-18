function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  onClick,
}) {
  const base = 'w-full py-3 font-bold rounded-full transition-all duration-200 disabled:opacity-50'
  const variants = {
    primary: 'bg-accent text-black hover:bg-[#00b386]',
    secondary: 'bg-elevated text-white border border-border hover:border-accent/50',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    ghost: 'bg-transparent text-accent hover:text-[#00b386] w-auto py-2',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
