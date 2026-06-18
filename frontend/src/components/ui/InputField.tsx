import { Eye, EyeOff, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface InputFieldProps {
  label?: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
}

export default function InputField({
  label,
  hint,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  required = false,
  disabled = false,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const hasRightAction = (value && !disabled) || isPassword;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase">
          {label}
          {required && <span style={{ color: 'var(--accent-2)' }}> *</span>}
          {hint && (
            <span className="ml-1 font-normal text-[var(--text-muted)] normal-case tracking-normal">{hint}</span>
          )}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="input-modern"
          style={{
            paddingLeft: icon ? '2.25rem' : undefined,
            paddingRight: hasRightAction ? '2.25rem' : undefined,
          }}
        />
        {/* Clear button — visible quand il y a une valeur (hors password) */}
        {!isPassword && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={14} />
          </button>
        )}
        {/* Toggle visibilité password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
