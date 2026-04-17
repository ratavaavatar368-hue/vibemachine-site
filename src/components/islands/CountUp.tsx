import { useEffect, useRef, useState } from 'react';

interface Props {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/**
 * CountUp — анимация от 0 к `to` при попадании в viewport.
 *
 * Важно: SSR рендерит финальное значение `to` → контент всегда видим даже без JS.
 * После hydration: useEffect сбрасывает в 0 и запускает IO.
 * Fallback: если IO не сработал за 2.5s — анимация стартует принудительно
 * (защищает от Lenis / iOS quirks).
 */
export default function CountUp({
  to,
  suffix = '',
  prefix = '',
  duration = 1600,
  className = '',
}: Props) {
  const [value, setValue] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const node = ref.current;
    if (!node) return;

    // Сбросим в 0 для анимации
    setValue(0);

    const runAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
        setValue(Math.round(to * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation();
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    );
    io.observe(node);

    // Fallback — если IO не сработал за 2.5 с (edge case Lenis / iOS), запускаем
    const fallbackTimer = window.setTimeout(() => {
      runAnimation();
      io.disconnect();
    }, 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
