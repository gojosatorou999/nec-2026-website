import { BrandLockup } from './components/BrandLogo';

/* ═══════════════════════════════════════════════════════════════════════════
   IDEA BOX PAGE
   Embeds the MGIT Founders Expo app under the site's own nav bar.
   ═══════════════════════════════════════════════════════════════════════════ */
const IDEA_BOX_URL = 'https://mgit-founders-expo.vercel.app/';

export default function IdeaBoxPage() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#050505' }}>
      <header style={{ padding: '16px clamp(14px, 4vw, 34px)', flexShrink: 0 }}>
        <nav
          className="glass glass-sheen"
          style={{
            maxWidth: 1240, margin: '0 auto',
            padding: '10px 12px 10px 16px',
            borderRadius: 'var(--r-pill)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}
        >
          <a href="/" style={{ textDecoration: 'none' }} aria-label="NEC 2026 — home">
            <BrandLockup size={34} />
          </a>
          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={IDEA_BOX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              Open in new tab ↗
            </a>
            <a href="/" className="btn btn-ghost" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>← Home</a>
          </div>
        </nav>
      </header>

      <iframe
        title="Idea Box"
        src={IDEA_BOX_URL}
        allow="clipboard-write"
        style={{ flex: 1, width: '100%', border: 0, background: '#fff' }}
      />
    </div>
  );
}
