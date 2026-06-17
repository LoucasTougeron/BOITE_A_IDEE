import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  accent: 'btn-accent',
  ghost: 'btn-ghost',
  danger:
    'bg-transparent text-red-500 border border-red-500/20 rounded-xl hover:bg-red-50/80 transition-all disabled:opacity-50',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'py-1.5 px-3 text-xs',
  md: 'py-2.5 text-sm',
  lg: 'py-3 text-sm',
};

export default function Button({
  children,
  variant = 'accent',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const base = `flex items-center justify-center gap-2 font-semibold ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`;

  return (
    <button
      className={`${base}${fullWidth ? ' w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
