import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner',
  required = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-select-dropdown]')
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleOpen() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
    setOpen((v) => !v);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label
        className="block text-xs font-semibold tracking-wide uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--accent-2)' }}> *</span>}
      </label>

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="input-modern flex items-center justify-between gap-2 text-left"
        style={{
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          borderColor: open ? 'var(--accent-2)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(168, 85, 247, 0.15)' : undefined,
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={15}
          style={{
            color: 'var(--text-muted)',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown via portal — échappe tout contexte de stacking parent */}
      {open && createPortal(
        <div
          data-select-dropdown
          className="rounded-xl overflow-hidden"
          style={{
            ...dropdownStyle,
            background: 'var(--bg-glass-heavy)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors duration-150"
                style={{
                  color: isSelected ? 'var(--accent-2)' : 'var(--text-primary)',
                  background: isSelected ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                  fontWeight: isSelected ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168, 85, 247, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={13} style={{ color: 'var(--accent-2)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
