import { useEffect, useRef } from 'react';
import { IconArrow } from './BrandLogo';

/* ═══════════════════════════════════════════════════════════════════════════
   REDIRECT TILE
   ───────────────────────────────────────────────────────────────────────────
   A single wide tile that stands in for a whole section and hands off to its
   own page. Reveals on scroll with the same easing and lift the card decks
   use, so the two read as one motion language rather than two.

   Driven by scroll position into inline styles, exactly like StickyStack —
   not by an IntersectionObserver toggling a data attribute. That version
   looked correct (the attribute really did flip to "true") but the browser
   did not always recalculate style off it, so the tile stayed invisible;
   re-setting the identical attribute value later made it appear. Writing the
   values straight onto the element side-steps that entirely, and reversing
   the scroll reverses the reveal for free.
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
  accent = 'var(--peri)',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // 0 while the tile is still low in the viewport, 1 once it has risen to
      // a comfortable reading position.
      const p = easeOutCubic(clamp01((vh * 0.9 - r.top) / (vh * 0.42)));

      el.style.opacity = String(p);
      el.style.transform = `translateY(${(1 - p) * 46}px) scale(${0.97 + p * 0.03})`;
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
    <section id={id} className="redirect-section">
      <a ref={ref} href={href} className="redirect-tile" style={{ '--accent': accent }}>
        <div className="redirect-main">
          <div className="eyebrow" style={{ color: accent }}>
            {kicker}
          </div>

          <h2 className="redirect-title">{title}</h2>

          <p className="redirect-body">{body}</p>

          <span className="btn btn-primary redirect-cta">
            {cta} <IconArrow />
          </span>
        </div>

        {stats.length > 0 && (
          <div className="redirect-stats">
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
    </section>
  );
}
