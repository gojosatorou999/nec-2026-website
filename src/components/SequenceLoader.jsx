import { useEffect, useRef, useState } from 'react';
import { EVENT } from '../data/site';

/* ═══════════════════════════════════════════════════════════════════════════
   SEQUENCE LOADER
   ───────────────────────────────────────────────────────────────────────────
   The bulb-to-logo film from the ideaclublogoeffect build, playing as the
   preloader instead of the old shard sphere. The 80 frames in public/sequence
   are pre-graded into the site's ink palette by scripts/grade-sequence.mjs —
   the backdrop sinks to ink, the filament stays amber, and the black logo art
   is inverted so the "iDEA INCUBATOR MGIT" lockup reads white on dark. The
   lockup itself is untouched; only the NEC copy below it is ours.

   In the source project this was scrub-driven by ScrollTrigger. A preloader
   can't be scrolled, so playback runs on a clock — but it is gated on decode
   so it can never show a frame that hasn't arrived yet.
   ═══════════════════════════════════════════════════════════════════════════ */

const FRAME_COUNT = 80;
const FPS = 24;
const START_AFTER = 10; // frames buffered before playback begins
const frameSrc = (i) => `/sequence/bulb_${String(i).padStart(3, '0')}.jpg`;

export default function SequenceLoader({ onComplete }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const images = new Array(FRAME_COUNT);
    let decoded = 0;
    let raf = 0;
    let startedAt = 0;
    let cancelled = false;

    const draw = (i) => {
      const img = images[i];
      if (!img || !ctx) return;

      // cover-fit, matching the source project's canvas sizing
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      const scale = Math.max((w * dpr) / img.width, (h * dpr) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    };

    const finish = () => {
      if (doneRef.current || cancelled) return;
      doneRef.current = true;
      setProgress(100);
      setLeaving(true);
      setTimeout(() => {
        if (!cancelled) onComplete();
      }, 700);
    };

    const tick = (now) => {
      if (cancelled) return;
      if (!startedAt) startedAt = now;

      const scheduled = ((now - startedAt) / 1000) * FPS;
      // never outrun what has actually decoded
      const frame = Math.min(Math.floor(scheduled), decoded - 1, FRAME_COUNT - 1);

      if (frame >= 0) draw(frame);
      setProgress(Math.round((Math.max(0, frame) / (FRAME_COUNT - 1)) * 100));

      if (frame >= FRAME_COUNT - 1) {
        // hold on the resolved lockup for a beat before handing over
        setTimeout(finish, 620);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    // Reduced motion: no film, just the resolved logo frame and a short hold.
    if (reduced) {
      const img = new Image();
      img.onload = () => {
        images[FRAME_COUNT - 1] = img;
        decoded = FRAME_COUNT;
        draw(FRAME_COUNT - 1);
        setProgress(100);
        setTimeout(finish, 900);
      };
      img.onerror = finish;
      img.src = frameSrc(FRAME_COUNT - 1);
      return () => {
        cancelled = true;
      };
    }

    // Sequential decode keeps frames in order, so `decoded` is a safe high-water
    // mark — with parallel loads frame 40 could land before frame 3.
    const loadFrom = (i) => {
      if (cancelled || i >= FRAME_COUNT) return;
      const img = new Image();
      const next = () => {
        if (cancelled) return;
        decoded = i + 1;
        if (decoded === START_AFTER && !startedAt) raf = requestAnimationFrame(tick);
        loadFrom(i + 1);
      };
      img.onload = () => {
        images[i] = img;
        if (i === 0) draw(0);
        next();
      };
      // A missing frame must not stall the loader — skip it and keep going.
      img.onerror = next;
      img.src = frameSrc(i);
    };
    loadFrom(0);

    // If the network is hopeless, don't trap the visitor on the loader.
    const bail = setTimeout(finish, 12000);

    const onResize = () => draw(Math.min(Math.max(0, decoded - 1), FRAME_COUNT - 1));
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(bail);
      window.removeEventListener('resize', onResize);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading ${EVENT.name}, ${progress} percent`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--ink)',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'scale(1.03)' : 'none',
        transition: 'opacity 0.7s var(--ease-expo), transform 0.7s var(--ease-expo)',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />

      {/* Vignette so the overlay copy holds against the brightest frames */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(5,7,13,0.55) 78%, rgba(5,7,13,0.92) 100%)',
        }}
      />

      {/* ── The NEC framing. The lockup itself is baked into the film. ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'clamp(38px, 7vh, 76px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        <div
          className="eyebrow"
          style={{ fontSize: '0.62rem', letterSpacing: '0.3em', color: 'var(--text-2)' }}
        >
          {EVENT.full}
        </div>

        <div
          style={{
            width: 'min(280px, 64vw)',
            height: 2,
            borderRadius: 'var(--r-pill)',
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 'var(--r-pill)',
              background: 'linear-gradient(90deg, var(--peri), var(--mint), var(--violet))',
              transition: 'width 0.2s linear',
            }}
          />
        </div>

        <div className="eyebrow" style={{ fontSize: '0.58rem', color: 'var(--text-3)' }}>
          {String(progress).padStart(3, '0')}% · {EVENT.venue}
        </div>
      </div>
    </div>
  );
}
