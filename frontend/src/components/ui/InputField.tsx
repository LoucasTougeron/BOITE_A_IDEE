interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function InputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase">
        {label}
        {required && <span style={{ color: 'var(--accent-2)' }}> *</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="input-modern"
      />
    </div>
  );
}
