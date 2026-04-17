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
 * MagneticButton — тянет кнопку к курсору в радиусе.
 * RAF запускается только когда мышь в радиусе, иначе stopped → 0 CPU.
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
    // Отключаем на touch и reduced-motion
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId = 0;
    let running = false;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      el.style.transform = `translate3d(${currentX.toFixed(2)}px,${currentY.toFixed(2)}px,0)`;

      // Останавливаем RAF когда близко к нулю — нет смысла крутить зря
      if (Math.abs(currentX) < 0.05 && Math.abs(currentY) < 0.05 && targetX === 0 && targetY === 0) {
        el.style.transform = '';
        running = false;
        return; // RAF не переназначается → loop stops
      }
      rafId = requestAnimationFrame(tick);
    };

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

      // Запускаем RAF только если не бежит
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: true });

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
      style={{ display: 'inline-flex' }}
    >
      {children}
    </a>
  );
}
