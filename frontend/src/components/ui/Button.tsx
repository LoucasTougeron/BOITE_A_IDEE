import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({ children, fullWidth = false, className = '', ...props }: ButtonProps) {
  const base = 'btn-accent flex items-center justify-center text-sm py-2.5';

  return (
    <button
      className={`${base}${fullWidth ? ' w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
