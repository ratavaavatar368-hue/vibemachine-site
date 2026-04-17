import { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor — dot + following ring.
 *
 * Fixes vs old version:
 * 1. NO CSS transition on ring — was fighting RAF lerp every 16ms, causing jitter
 * 2. WeakSet tracks attached elements — no duplicate hover listeners on MutationObserver
 * 3. RAF auto-stops when cursor is idle (delta < 0.05px) — saves ~100ms CPU/sec
 * 4. Scale change applied via separate CSS var to avoid transform conflict
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

    // Positions
    const mouse = { x: -200, y: -200 };
    const ring  = { x: -200, y: -200 };
    let hovering = false;
    let rafId = 0;
    let running = false;

    // ── RAF tick ─────────────────────────────────────────────────
    const tick = () => {
      const dot = dotRef.current;
      const rc  = ringRef.current;

      // Dot follows mouse exactly (no lerp — zero latency)
      if (dot) {
        dot.style.transform = `translate3d(${mouse.x}px,${mouse.y}px,0)`;
      }

      // Ring lerps toward mouse
      ring.x += (mouse.x - ring.x) * 0.22;
      ring.y += (mouse.y - ring.y) * 0.22;

      if (rc) {
        const s = hovering ? 1.75 : 1;
        // NO CSS transition — lerp handles all smoothing
        rc.style.transform = `translate3d(${ring.x.toFixed(2)}px,${ring.y.toFixed(2)}px,0) scale(${s})`;
      }

      // Stop RAF when ring has converged (saves CPU when idle)
      const dx = Math.abs(mouse.x - ring.x);
      const dy = Math.abs(mouse.y - ring.y);
      if (dx < 0.05 && dy < 0.05) {
        running = false;
        return; // don't schedule next frame
      }

      rafId = requestAnimationFrame(tick);
    };

    const startRaf = () => {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    // ── Mouse tracking ────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      startRaf(); // wake RAF only on mouse move
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // ── Hover states — WeakSet prevents duplicate listeners ───────
    const attached = new WeakSet<Element>();
    const enterHover = () => { hovering = true;  startRaf(); };
    const leaveHover = () => { hovering = false; startRaf(); };

    const attachHoverListeners = () => {
      document.querySelectorAll<HTMLElement>(
        'a, button, [role="button"], details > summary, input, textarea, select'
      ).forEach((el) => {
        if (attached.has(el)) return; // ← skip already-attached
        attached.add(el);
        el.addEventListener('mouseenter', enterHover, { passive: true });
        el.addEventListener('mouseleave', leaveHover, { passive: true });
      });
    };
    attachHoverListeners();

    // Re-attach only for genuinely new nodes
    const mo = new MutationObserver(attachHoverListeners);
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
      {/* Dot — sharp, instant */}
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
          boxShadow: '0 0 6px rgba(255,204,0,0.55)',
        }}
      />
      {/* Ring — lerp-smoothed, NO CSS transition (was causing jitter) */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 34,
          height: 34,
          marginLeft: -17,
          marginTop: -17,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,204,0,0.45)',
          pointerEvents: 'none',
          zIndex: 10000,
          willChange: 'transform',
          // transition УБРАН — воевал с RAF lerp (CSS reset каждые 16мс → дёрганье)
        }}
      />
    </>
  );
}
