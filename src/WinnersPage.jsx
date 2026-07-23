import { useCallback, useEffect, useState, Suspense, lazy } from 'react';
import { DEPARTMENTS, DELEGATES, EVENT } from './data/site';

import { BrandLockup, IconClose, IconArrow } from './components/BrandLogo';
import { DEPARTMENT_ICONS } from './components/DepartmentIcons';
import WaterLayer from './components/WaterLayer';

const WinnersScene = lazy(() => import('./components/WinnersScene'));


/* ═══════════════════════════════════════════════════════════════════════════
   WINNERS — its own page at /winners.html, reached by a real navigation.
   ═══════════════════════════════════════════════════════════════════════════ */

function TeamPanel({ dept, onClose }) {
  const open = Boolean(dept);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className="panel-scrim" data-open={open} onClick={onClose} aria-hidden="true" />

      <aside
        className="detail-panel"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label={dept ? `${dept.title} team` : 'Team details'}
        aria-hidden={!open}
      >
        <span className="panel-edge" aria-hidden="true" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close team details"
          className="social-btn"
          style={{ position: 'absolute', top: 24, right: 24 }}
        >
          <IconClose />
        </button>

        {dept && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '2.4rem', lineHeight: 1, display: 'flex' }} aria-hidden="true">
                {(() => {
                  const Icon = DEPARTMENT_ICONS[dept.id];
                  return Icon ? <Icon width="36" height="36" /> : dept.emoji;
                })()}
              </span>
              <div className="eyebrow" style={{ color: dept.accent }}>
                Team · {dept.members.length}{' '}
                {dept.members.length === 1 ? 'winner' : 'winners'}
              </div>
            </div>

            <h2 style={{ marginTop: 18, fontSize: 'clamp(1.7rem, 3.8vw, 2.5rem)', fontWeight: 600 }}>
              {dept.title}
            </h2>

            <hr className="hairline" style={{ margin: '24px 0' }} />

            <p style={{ color: 'var(--text-2)', fontSize: '0.97rem', lineHeight: 1.75 }}>
              {dept.blurb}
            </p>

            <hr className="hairline" style={{ margin: '24px 0' }} />

            <div className="eyebrow" style={{ marginBottom: 16 }}>
              Members
            </div>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none' }}>
              {dept.members.map((m) => (
                <li
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '13px 16px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-brd)',
                  }}
                >
                  <span
                    className="font-mono"
                    style={{ fontSize: '0.68rem', color: dept.accent, flexShrink: 0 }}
                  >
                    {m.id}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'Sora, sans-serif',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                      }}
                    >
                      {m.name}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.76rem',
                        color: 'var(--text-3)',
                        marginTop: 2,
                      }}
                    >
                      {m.role} · {m.branch}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: 32 }}>
              <div className="chip">NEC 2026 · IIT Bombay</div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function WinnersBody() {
  const [selected, setSelected] = useState(null);
  const close = useCallback(() => setSelected(null), []);

  const select = useCallback((dept) => {
    setSelected((cur) => (cur && dept && cur.id === dept.id ? null : dept));
  }, []);

  return (
    <>
      {/* ── The cube field, full bleed behind everything ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Suspense fallback={null}>
          <WinnersScene selectedId={selected?.id ?? null} onSelect={select} />
        </Suspense>
      </div>

      {/* ── Title, clearing out of the way once a team is chosen ── */}
      <div
        className="winners-title"
        data-hidden={Boolean(selected)}
        style={{ position: 'fixed', zIndex: 2 }}
      >
        <div className="eyebrow">
          {EVENT.name} · {EVENT.venue}
        </div>

        <h1
          style={{
            marginTop: 16,
            fontSize: 'clamp(2.4rem, 6.6vw, 5rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 0.98,
          }}
        >
          The <span className="gradient-text">Winners</span>
        </h1>

        <p
          style={{
            marginTop: 20,
            maxWidth: 380,
            fontSize: '0.98rem',
            color: 'var(--text-2)',
            lineHeight: 1.72,
          }}
        >
          {DELEGATES.length} students from MGIT, across seven teams, selected to represent
          the college at the National Entrepreneurship Challenge 2026.
        </p>

        <p className="eyebrow" style={{ marginTop: 26, color: 'var(--text-3)' }}>
          Tap a glowing cube to meet the team
        </p>
      </div>

      {/* ── Team rail: the keyboard-reachable equivalent of clicking a cube ── */}
      <div className="winners-rail" data-hidden={Boolean(selected)}>
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            type="button"
            className="legend-chip"
            data-active={selected?.id === dept.id}
            style={{ '--accent': dept.accent }}
            onClick={() => select(dept)}
            aria-pressed={selected?.id === dept.id}
          >
            <span aria-hidden="true" style={{ display: 'flex' }}>
              {(() => {
                const Icon = DEPARTMENT_ICONS[dept.id];
                return Icon ? <Icon width="18" height="18" /> : dept.emoji;
              })()}
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="legend-title">{dept.title}</span>
              <span className="legend-count">
                {dept.members.length} {dept.members.length === 1 ? 'winner' : 'winners'}
              </span>
            </span>
          </button>
        ))}
      </div>

      <TeamPanel dept={selected} onClose={close} />
    </>
  );
}

function Page() {
  // The cube field is the page — it fills the viewport and owns the whole
  // frame, so the document itself must not scroll behind it.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <>
      {/* Same water caustics as the home page, behind the transparent canvas */}
      <WaterLayer />

      <div style={{ position: 'relative', zIndex: 1, height: '100svh', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <header
        style={{
          position: 'absolute',
          insetInline: 0,
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
        </nav>
      </header>

      <main>
        <WinnersBody />
      </main>

      {/* ── Footer, riding the bottom edge of the field ── */}
      <footer className="winners-footer">
        <span className="eyebrow" style={{ fontSize: '0.58rem' }}>
          © 2026 Idea Incubator · MGIT
        </span>
        <a href="/" className="eyebrow" style={{ fontSize: '0.58rem', textDecoration: 'none' }}>
          ← NEC 2026 Challenge
        </a>
      </footer>
      </div>
    </>
  );
}

export default function WinnersPage() {
  return <Page />;
}
