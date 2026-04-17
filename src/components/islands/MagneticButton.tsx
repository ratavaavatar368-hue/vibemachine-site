import { useEffect, useRef } from 'react';

interface Props {
  children: React.ReactNode;
  href?: string;
  className?: string;
  target?: string;
  rel?: string;
  strength?: number;
  radius?: number;
}

/**
 * MagneticButton — пуль button к курсору в радиусе.
 * Применяется к <a>-кнопкам. Выключен на touch.
 */
export default function MagneticButton({
  children,
  href = '#',
  className = '',
  target,
  rel,
  strength = 0.28,
  radius = 120,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        const force = 1 - dist / radius;
        targetX = dx * strength * force;
        targetY = dy * strength * force;
      } else {
        targetX = 0;
        targetY = 0;
      }
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafId);
      el.style.transform = '';
    };
  }, [strength, radius]);

  return (
    <a
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      className={className}
      style={{ display: 'inline-flex', willChange: 'transform' }}
    >
      {children}
    </a>
  );
}
