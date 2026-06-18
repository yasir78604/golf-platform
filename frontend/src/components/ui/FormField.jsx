function FormField({ label, type = 'text', value, onChange, placeholder, min, max, step }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[#888] text-sm font-medium">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full px-4 py-3 bg-elevated text-white placeholder:text-[#444] rounded-lg border border-border focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  )
}

export default FormField
