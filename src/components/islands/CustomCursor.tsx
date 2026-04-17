import { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor — dot + following ring.
 * Desktop only (skip on touch).
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');

    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let rafId: number;
    const tick = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      }
      // Ring smoothly follows
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (ringRef.current) {
        const scale = hovering ? 1.8 : 1;
        ringRef.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale})`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Hover states
    const hoverSelectors = 'a, button, [role="button"], details > summary, input, textarea, select';
    const enterHover = () => { hovering = true; };
    const leaveHover = () => { hovering = false; };

    const attachHoverListeners = () => {
      document.querySelectorAll<HTMLElement>(hoverSelectors).forEach((el) => {
        el.addEventListener('mouseenter', enterHover);
        el.addEventListener('mouseleave', leaveHover);
      });
    };
    attachHoverListeners();

    // Re-attach when DOM mutates (details accordion, dynamic content)
    const mo = new MutationObserver(() => attachHoverListeners());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
      mo.disconnect();
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          borderRadius: '50%',
          background: '#FFCC00',
          pointerEvents: 'none',
          zIndex: 10000,
          willChange: 'transform',
          boxShadow: '0 0 8px rgba(255, 204, 0, 0.6)',
        }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          borderRadius: '50%',
          border: '1px solid rgba(255, 204, 0, 0.5)',
          pointerEvents: 'none',
          zIndex: 10000,
          willChange: 'transform',
          transition: 'transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s',
          mixBlendMode: 'normal',
        }}
      />
    </>
  );
}
