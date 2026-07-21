/**
 * Brand marks.
 *
 * IdeaIncubatorLogo is a faithful redraw of the actual club logo:
 * a sky-blue field, a heavy black serif "I", and an amber lightbulb
 * sitting in the middle of the stem. (The previous build was using the
 * unrelated "iiii" mark — this replaces it everywhere.)
 */

export function IdeaIncubatorLogo({ size = 40, rounded = true, className = '' }) {
  const rx = rounded ? 22 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Idea Incubator"
    >
      <defs>
        <linearGradient id="ii-field" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9adcf7" />
          <stop offset="100%" stopColor="#74cdf2" />
        </linearGradient>
        <linearGradient id="ii-bulb" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="100%" stopColor="#f7c93f" />
        </linearGradient>
      </defs>

      {/* Sky-blue field */}
      <rect x="0" y="0" width="100" height="100" rx={rx} fill="url(#ii-field)" />

      {/* Heavy serif "I" with the split foot — traced from the logo artwork */}
      <path
        d="M20.4 16.7 H79.6 V29.2 H64.8 V64.8 H79.6 V75.5 H53.7 V54.6
           H47.2 V75.5 H20.4 V64.8 H37 V29.2 H20.4 Z"
        fill="#000000"
      />

      {/* Bulb glow halo */}
      <circle cx="50" cy="45" r="15" fill="#ffd65c" opacity="0.18" />

      {/* Radiating rays */}
      <g stroke="#ffe27a" strokeWidth="2.1" strokeLinecap="round">
        <line x1="50" y1="26.5" x2="50" y2="31.5" />
        <line x1="36.5" y1="32" x2="40" y2="35.5" />
        <line x1="63.5" y1="32" x2="60" y2="35.5" />
        <line x1="31" y1="45" x2="36" y2="45" />
        <line x1="69" y1="45" x2="64" y2="45" />
      </g>

      {/* Bulb glass */}
      <circle cx="50" cy="45" r="10.5" fill="url(#ii-bulb)" stroke="#000000" strokeWidth="1.4" />

      {/* Filament */}
      <path
        d="M46.4 44.2 q1.8 4 1.8 7.4 M50 43.6 q0 4.4 0 8 M53.6 44.2 q-1.8 4 -1.8 7.4"
        fill="none"
        stroke="#000000"
        strokeWidth="1.25"
        strokeLinecap="round"
      />

      {/* Screw base */}
      <path
        d="M45.6 53.5 h8.8 l-1.5 6 h-5.8 Z"
        fill="url(#ii-bulb)"
        stroke="#000000"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Compact lockup used in the navbar and footer. */
export function BrandLockup({ size = 38, stacked = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <IdeaIncubatorLogo size={size} />
      <div style={{ display: stacked ? 'block' : 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <div
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: '0.83rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}
        >
          Idea Incubator
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginTop: 2,
          }}
        >
          MGIT · IIC
        </div>
      </div>
    </div>
  );
}

/* ─── Social / link icons ────────────────────────────────────────────────── */

export function IconLinkedIn({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.65h.05A4.17 4.17 0 0 1 17.6 8.7c4 0 4.75 2.63 4.75 6.05V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4V9Z" />
    </svg>
  );
}

export function IconInstagram({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.4" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconGlobe({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

export function IconArrow({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13M12 5l7 7-7 7" />
    </svg>
  );
}

export function IconClose({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
