import { useCallback, useEffect, useState } from 'react';
import { DELEGATES } from '../data/site';
import { useReveal } from './useReveal';
import { IconClose, IconArrow } from './BrandLogo';

/* ═══════════════════════════════════════════════════════════════════════════
   TILE ROSTER  (the v2 display)
   A flat grid of all 25 delegates; selecting one slides a detail panel in
   from the right. Kept intact so the version switch can fall back to it.
   ═══════════════════════════════════════════════════════════════════════════ */

function DetailPanel({ person, onClose }) {
  const open = Boolean(person);

  // Escape to close + lock body scroll while the panel is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div className="panel-scrim" data-open={open} onClick={onClose} aria-hidden="true" />

      <aside
        className="detail-panel"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label={person ? `Details for ${person.name}` : 'Delegate details'}
        aria-hidden={!open}
      >
        <span className="panel-edge" aria-hidden="true" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="social-btn"
          style={{ position: 'absolute', top: 24, right: 24 }}
        >
          <IconClose />
        </button>

        {person && (
          <>
            <div className="eyebrow" style={{ color: 'var(--mint)' }}>
              Delegate {person.id} / 25
            </div>

            <h3
              style={{
                marginTop: 14,
                fontSize: 'clamp(2rem, 4.4vw, 2.9rem)',
                fontWeight: 600,
              }}
            >
              {person.name}
            </h3>

            <hr className="hairline" style={{ margin: '26px 0' }} />

            <dl style={{ display: 'grid', gap: 18, margin: 0 }}>
              {[
                ['Branch', person.branch],
                ['Year', person.year],
                ['Focus', person.focus],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '104px 1fr',
                    gap: 16,
                    alignItems: 'baseline',
                  }}
                >
                  <dt className="eyebrow" style={{ margin: 0 }}>
                    {k}
                  </dt>
                  <dd
                    style={{
                      margin: 0,
                      fontFamily: 'Sora, sans-serif',
                      fontSize: '1.02rem',
                      color: 'var(--text)',
                    }}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            <hr className="hairline" style={{ margin: '26px 0' }} />

            <p style={{ color: 'var(--text-2)', fontSize: '0.97rem', lineHeight: 1.75 }}>
              {person.body}
            </p>

            <div style={{ marginTop: 'auto', paddingTop: 34 }}>
              <div className="chip">NEC 2026 · IIT Bombay</div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function DelegateTile({ person, isActive, onSelect, index }) {
  return (
    <button
      type="button"
      className="tile reveal"
      data-active={isActive}
      data-reveal-index={index}
      onClick={() => onSelect(person)}
      aria-label={`View details for ${person.name}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span
          className="font-mono"
          style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-3)' }}
        >
          {person.id}
        </span>
        <span
          style={{
            color: 'var(--text-3)',
            display: 'inline-flex',
            transition: 'transform 0.45s var(--ease-expo), color 0.3s',
            transform: isActive ? 'translateX(3px)' : 'none',
          }}
        >
          <IconArrow size={14} />
        </span>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: '1.02rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            lineHeight: 1.25,
          }}
        >
          {person.name}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: '0.8rem',
            color: 'var(--text-3)',
          }}
        >
          {person.branch} · {person.year}
        </div>
      </div>

      <div
        className="font-mono"
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: '1px solid var(--glass-brd)',
          fontSize: '0.63rem',
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        {person.focus}
      </div>
    </button>
  );
}

/** All 25 delegates as tiles. */
export default function TileRoster() {
  const [selected, setSelected] = useState(null);
  const revealRef = useReveal(28);
  const close = useCallback(() => setSelected(null), []);

  return (
    <div ref={revealRef}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(208px, 1fr))',
          gap: 'clamp(12px, 1.6vw, 18px)',
        }}
      >
        {DELEGATES.map((person, i) => (
          <DelegateTile
            key={person.id}
            person={person}
            index={i}
            isActive={selected?.id === person.id}
            onSelect={setSelected}
          />
        ))}
      </div>

      <DetailPanel person={selected} onClose={close} />
    </div>
  );
}
