import { useState } from 'react';
import { useVersion, VERSIONS } from '../version';

/** Floating build toggle so you can flip back to the previous version. */
export default function VersionSwitch() {
  const { version, setVersion } = useVersion();
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        left: 'clamp(14px, 3vw, 26px)',
        bottom: 'clamp(14px, 3vw, 26px)',
        zIndex: 95,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      {open && (
        <div
          className="glass"
          style={{
            padding: 12,
            borderRadius: 'var(--r-md)',
            width: 208,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div className="eyebrow" style={{ fontSize: '0.56rem', marginBottom: 2 }}>
            Build
          </div>

          {Object.values(VERSIONS).map((v) => {
            const active = v.id === version;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVersion(v.id)}
                aria-pressed={active}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 11px',
                  borderRadius: 'var(--r-sm)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: active ? 'var(--glass-bg-strong)' : 'transparent',
                  border: `1px solid ${active ? 'var(--glass-brd-lit)' : 'transparent'}`,
                  transition: 'background 0.25s var(--ease-soft), border-color 0.25s',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: active ? 'var(--mint)' : 'var(--text-3)',
                    boxShadow: active ? '0 0 9px var(--mint)' : 'none',
                  }}
                />
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'Sora, sans-serif',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    {v.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.68rem',
                      color: 'var(--text-3)',
                      lineHeight: 1.35,
                      marginTop: 1,
                    }}
                  >
                    {v.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="glass"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Hide build switcher' : 'Show build switcher'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 15px',
          borderRadius: 'var(--r-pill)',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.66rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-2)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--mint)',
            boxShadow: '0 0 8px var(--mint)',
          }}
        />
        {version}
      </button>
    </div>
  );
}
