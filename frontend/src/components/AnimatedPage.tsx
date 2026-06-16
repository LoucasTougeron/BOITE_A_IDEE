import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedPage({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 30, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}