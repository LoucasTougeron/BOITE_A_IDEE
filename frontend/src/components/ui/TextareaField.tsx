interface TextareaFieldProps {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

export default function TextareaField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  rows = 4,
  required = false,
  disabled = false,
  error = false,
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-xs font-semibold tracking-wide uppercase" style={{ color: error ? 'var(--error, #ef4444)' : 'var(--text-secondary)' }}>
        {label}
        {required && <span style={{ color: error ? 'var(--error, #ef4444)' : 'var(--accent-2)' }}> *</span>}
        {hint && (
          <span className="ml-1 font-normal text-[var(--text-muted)] normal-case tracking-normal">
            {hint}
          </span>
        )}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        className="input-modern resize-none"
        style={{
          borderColor: error ? 'var(--error, #ef4444)' : undefined,
          boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : undefined,
        }}
      />
    </div>
  );
}
