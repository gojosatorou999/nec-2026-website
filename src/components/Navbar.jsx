import { useEffect, useState } from 'react';
import { BrandLockup } from './BrandLogo';
import { NAV_LINKS } from '../data/site';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        padding: scrolled ? '12px clamp(14px, 4vw, 34px)' : '20px clamp(14px, 4vw, 34px)',
        transition: 'padding 0.5s var(--ease-expo)',
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
        <a href="#top" style={{ textDecoration: 'none' }} aria-label="NEC 2026 Challenge — home">
          <BrandLockup size={34} />
        </a>

        {/* Desktop links */}
        <div
          className="nav-desktop"
          style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 2.4vw, 30px)' }}
        >
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* A real navigation to the winners page, not an in-page anchor */}
          <a
            href="/winners.html"
            className="btn btn-primary nav-cta"
            style={{ padding: '10px 20px', fontSize: '0.82rem' }}
          >
            Winners
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            className="nav-burger social-btn"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {menuOpen && (
        <div
          className="glass nav-sheet"
          style={{
            maxWidth: 1240,
            margin: '10px auto 0',
            padding: 18,
            borderRadius: 'var(--r-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link"
              onClick={() => setMenuOpen(false)}
              style={{ padding: '11px 6px', fontSize: '0.98rem' }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        .nav-burger { display: none; }
        .nav-sheet  { display: none; }
        @media (max-width: 860px) {
          .nav-desktop { display: none !important; }
          .nav-burger  { display: inline-grid; }
          .nav-sheet   { display: flex !important; }
        }
        @media (max-width: 480px) {
          .nav-cta { display: none; }
        }
      `}</style>
    </header>
  );
}
