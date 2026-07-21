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
const easeInCubic = (t) => t * t * t;

export default function RedirectTile({
  id,
  href,
  kicker,
  title,
  body,
  cta,
  stats = [],
  accent = 'var(--peri)',
}) {
  const rootRef = useRef(null);
  const tileRef = useRef(null);
  const kickerRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const ctaRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const tile = tileRef.current;
    if (!root || !tile) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      tile.style.opacity = '1';
      tile.style.transform = 'none';
      [kickerRef, titleRef, bodyRef, ctaRef, statsRef].forEach((r) => {
        if (r.current) {
          r.current.style.opacity = '1';
          r.current.style.transform = 'none';
        }
      });
      return;
    }

    const parts = [kickerRef, titleRef, bodyRef, ctaRef, statsRef]
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

      /* ─── Tile entrance: 0→0.3 of rail ─── */
      const enterT = easeOutCubic(clamp01(p / 0.3));

      /* ─── Tile exit: 0.75→1.0 of rail ─── */
      const exitT = easeInCubic(clamp01((p - 0.75) / 0.25));

      /* Combined tile opacity and transform */
      const tileOpacity = clamp01(enterT - exitT);
      const tileY = (1 - enterT) * 60 + exitT * -40;
      const tileScale = 0.96 + enterT * 0.04 - exitT * 0.02;

      tile.style.opacity = String(tileOpacity);
      tile.style.transform = `translateY(${tileY}px) scale(${tileScale})`;

      /* ─── Staggered inner reveals: each element gets a slice ─── */
      const staggerStart = 0.1;
      const staggerEnd = 0.55;
      const staggerRange = staggerEnd - staggerStart;
      const sliceWidth = 0.22; // each element's transition window

      for (let i = 0; i < parts.length; i++) {
        const el = parts[i];
        const sliceStart = staggerStart + (i / Math.max(1, parts.length - 1)) * (staggerRange - sliceWidth);
        const sliceP = clamp01((p - sliceStart) / sliceWidth);
        const eased = easeOutCubic(sliceP);

        // Exit stagger (slightly later for earlier elements, creating a sweep)
        const exitSliceStart = 0.7 + (i / Math.max(1, parts.length - 1)) * 0.08;
        const exitSliceP = clamp01((p - exitSliceStart) / 0.2);
        const exitEased = easeInCubic(exitSliceP);

        const elOpacity = clamp01(eased - exitEased);
        const elY = (1 - eased) * 32 + exitEased * -20;

        el.style.opacity = String(elOpacity);
        el.style.transform = `translateY(${elY}px)`;
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
        </a>
      </div>
    </section>
  );
}

