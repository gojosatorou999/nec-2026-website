import { useEffect, useRef } from 'react';
import { IconArrow } from './BrandLogo';

/* ═══════════════════════════════════════════════════════════════════════════
   REDIRECT TILE — Scroll-Pinned Edition
   ───────────────────────────────────────────────────────────────────────────
   A wide tile that stands in for a section and hands off to its own page.
   Now uses a sticky-pinned rail (like StickyStack) so the tile holds still
   while inner elements — kicker, title, body, CTA and stats — reveal in a
   staggered cascade, then fade out as the user scrolls past.

   The whole reveal/dismiss is a pure function of scroll position so it
   reverses perfectly when scrolling back up.
   ═══════════════════════════════════════════════════════════════════════════ */

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function RedirectTile({
  id,
  href,
  kicker,
  title,
  body,
  cta,
  stats = [],
  photo = null,
  accent = 'var(--peri)',
}) {
  const rootRef = useRef(null);
  const tileRef = useRef(null);
  const kickerRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const ctaRef = useRef(null);
  const statsRef = useRef(null);
  const photoRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const tile = tileRef.current;
    if (!root || !tile) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      tile.style.opacity = '1';
      tile.style.transform = 'none';
      [kickerRef, titleRef, bodyRef, ctaRef, photoRef, statsRef].forEach((r) => {
        if (r.current) {
          r.current.style.opacity = '1';
          r.current.style.transform = 'none';
        }
      });
      return;
    }

    const parts = [kickerRef, titleRef, bodyRef, ctaRef, photoRef, statsRef]
      .map((r) => r.current)
      .filter(Boolean);

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = Math.max(1, root.offsetHeight - vh);

      // p goes 0→1 as the rail scrolls past
      const p = clamp01(-rect.top / scrollable);

      /* Entrance only, then hold. There is deliberately NO fade-out: the tile
         stays fully visible and simply scrolls away when the sticky pin
         releases. The old exit fade was the cause of both problems — it made
         the tile flash out early (glitchy on a short rail) and it left an empty
         pinned screen between one tile and the next (the "big gap"). */
      // Fade in over a wide slice of the rail so it is a smooth ramp, not a
      // pop. On a 135svh rail this is ~0.4 of a screen of scroll.
      const enterT = easeOutCubic(clamp01(p / 0.55));
      tile.style.opacity = String(enterT);
      tile.style.transform = `translateY(${(1 - enterT) * 42}px) scale(${0.98 + enterT * 0.02})`;

      /* Staggered inner reveal — cascades in step with the container fade. */
      for (let i = 0; i < parts.length; i++) {
        const el = parts[i];
        const start = 0.04 + (i / Math.max(1, parts.length - 1)) * 0.34;
        const t = easeOutCubic(clamp01((p - start) / 0.3));
        el.style.opacity = String(t);
        el.style.transform = `translateY(${(1 - t) * 26}px)`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section id={id} ref={rootRef} className="redirect-rail">
      <div className="redirect-pin">
        <a ref={tileRef} href={href} className="redirect-tile" style={{ '--accent': accent }}>
          <div className="redirect-main">
            <div ref={kickerRef} className="eyebrow redirect-reveal" style={{ color: accent }}>
              {kicker}
            </div>

            <h2 ref={titleRef} className="redirect-title redirect-reveal">{title}</h2>

            <p ref={bodyRef} className="redirect-body redirect-reveal">{body}</p>

            <span ref={ctaRef} className="btn btn-primary redirect-cta redirect-reveal">
              {cta} <IconArrow />
            </span>
          </div>

          <div className="redirect-aside">
            {photo && (
              <img
                ref={photoRef}
                className="redirect-photo redirect-reveal"
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(max-width: 900px) 92vw, 40vw"
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
              />
            )}

            {stats.length > 0 && (
              <div ref={statsRef} className="redirect-stats redirect-reveal">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="redirect-stat-value gradient-text">{s.value}</div>
                    <div className="eyebrow" style={{ fontSize: '0.56rem', marginTop: 6 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </a>
      </div>
    </section>
  );
}

