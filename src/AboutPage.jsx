import { BrandLockup, IconArrow } from './components/BrandLogo';
import WaterLayer from './components/WaterLayer';
import AboutClub from './components/AboutClub';

/* ═══════════════════════════════════════════════════════════════════════════
   ABOUT — its own page at /about.html.
   About the club with its 3D flip card gallery.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AboutPage() {
  return (
    <>
      {/* Same scroll-driven water caustics as the rest of the site */}
      <WaterLayer />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* ── Nav ── */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 60,
            padding: '16px clamp(14px, 4vw, 34px)',
          }}
        >
          <nav
            className="glass glass-sheen"
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              padding: '10px 12px 10px 16px',
              borderRadius: 'var(--r-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <a href="/" style={{ textDecoration: 'none' }} aria-label="Back to NEC 2026 Challenge">
              <BrandLockup size={34} />
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <a href="/timeline.html" className="nav-link about-nav-timeline">
                Timeline
              </a>
              <a
                href="/"
                className="btn btn-ghost"
                style={{ padding: '9px 18px', fontSize: '0.82rem' }}
              >
                <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}>
                  <IconArrow size={14} />
                </span>
                Back to main site
              </a>
            </div>
          </nav>
        </header>

        <main>
          <AboutClub />
        </main>

        {/* ── Footer ── */}
        <footer style={{ padding: '0 clamp(20px, 6vw, 80px) clamp(28px, 4vw, 44px)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <hr className="hairline" style={{ marginBottom: 18 }} />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px 24px',
                justifyContent: 'space-between',
              }}
            >
              <span className="eyebrow" style={{ fontSize: '0.58rem' }}>
                © 2026 Idea Incubator · MGIT
              </span>
              <a href="/" className="eyebrow" style={{ fontSize: '0.58rem', textDecoration: 'none' }}>
                ← NEC 2026 Challenge
              </a>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .about-nav-timeline { display: none; }
        }
      `}</style>
    </>
  );
}
