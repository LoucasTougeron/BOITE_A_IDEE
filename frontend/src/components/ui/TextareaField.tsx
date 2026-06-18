interface TextareaFieldProps {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
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
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase">
        {label}
        {required && <span style={{ color: 'var(--accent-2)' }}> *</span>}
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
        required={required}
        disabled={disabled}
        className="input-modern resize-none"
      />
    </div>
  );
}
