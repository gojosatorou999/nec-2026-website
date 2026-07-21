import { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   SPEEDOMETER TIMELINE
   ───────────────────────────────────────────────────────────────────────────
   The club's 12 milestones sit on the arc where a speedometer's numbers would
   be. The gauge pins itself to the viewport while the section scrolls past, so
   the dial stays visually stationary and the needle sweeps in place — you are
   never scrolled away from it mid-sweep. No autoplay.

   Only the current event is shown, and it rides on the needle's own bearing
   just outside the arc, sitting on top of the point being aimed at rather than
   being buried in the middle of the dial where it could not be read.
   ═══════════════════════════════════════════════════════════════════════════ */


const EVENTS = [
  {
    id: 1,
    date: '22 Oct 2024',
    title: 'Motivational Session',
    sub: 'By Successful Innovator',
    color: '#7fd4f5',
  },
  {
    id: 2,
    date: '21 Nov 2024',
    title: 'Panel Discussion',
    sub: 'Innovation & Start-up Ecosystem Enablers',
    color: '#a3b2ff',
  },
  {
    id: 3,
    date: '25 Feb 2025',
    title: 'Lean Start-up & MVP',
    sub: 'Boot Camp: Min Viable Product/Business',
    color: '#bc7aff',
  },
  {
    id: 4,
    date: '24 Apr 2025',
    title: 'IP Rights Workshop',
    sub: 'Protecting IPRs & IP Management for Start-ups',
    color: '#ffd65c',
  },
  {
    id: 5,
    date: '30 Jul 2025',
    title: 'Value Proposition Fit',
    sub: 'Achieving Value Prop & Business Fit',
    color: '#7affcf',
  },
  {
    id: 6,
    date: '31 Jul 2025',
    title: 'NSIC Registration',
    sub: 'Process of Establishing a Startup — NSIC (MSME)',
    color: '#ff9a72',
  },
  {
    id: 7,
    date: '4 Aug 2025',
    title: 'Business Model Canvas',
    sub: 'Session on Business Model Canvas',
    color: '#72ffdd',
  },
  {
    id: 8,
    date: '4 Aug 2025',
    title: 'Problem-Solution Fit',
    sub: 'Achieving Problem-Solution & Product-Market Fit',
    color: '#a3b2ff',
  },
  {
    id: 9,
    date: '26 Aug 2025',
    title: 'Lab Tech Transfer',
    sub: 'Commercialization of Lab Technologies & Technology Transfer',
    color: '#7fd4f5',
  },
  {
    id: 10,
    date: '26 Aug 2025',
    title: 'Ideation Workshop',
    sub: 'Problem Solving and Ideation Workshop',
    color: '#bc7aff',
  },
  {
    id: 11,
    date: '29 Aug 2025',
    title: 'Angel & VC Funding',
    sub: 'Session on Angel Investment & Venture Capital Funding Opportunity',
    color: '#ffd65c',
  },
  {
    id: 12,
    date: '30 Aug 2025',
    title: 'B-Plan Pitch: Demo Day',
    sub: 'B-Plan Pitch: Demo Day & Exhibition',
    color: '#7affcf',
  },
];

/* Speedometer arc: a 240° sweep running clockwise from 210° (lower-left),
   up over the top, round to -30° (lower-right) — the classic gauge span. */
const ARC_START_DEG = 210;
const ARC_END_DEG   = -30;

function degToRad(d) { return (d * Math.PI) / 180; }

/** Position on a circle of radius r centered at cx,cy. */
function circlePoint(cx, cy, r, angleDeg) {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad), // SVG y-axis is inverted
  };
}

/** SVG arc path from startDeg → endDeg (going clockwise when endDeg < startDeg
    in standard math coords). */
function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = circlePoint(cx, cy, r, startDeg);
  const end   = circlePoint(cx, cy, r, endDeg);
  // Clockwise arc (sweep-flag=1), large-arc if span > 180°
  const span  = ((startDeg - endDeg) + 360) % 360; // clockwise degrees
  const large = span > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

/** Map event index → angle on the arc (clockwise from ARC_START_DEG to ARC_END_DEG) */
function eventAngle(idx, total) {
  const t = total <= 1 ? 0 : idx / (total - 1);
  // Sweep 240° clockwise from ARC_START_DEG
  return ARC_START_DEG - t * 240;
}

const MAX_INDEX = EVENTS.length - 1;
const VH_PER_EVENT = 30; // scroll distance allotted to each milestone

export default function SpeedometerTimeline() {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0); // continuous, 0 … MAX_INDEX

  /* Scroll position within the (tall) track drives the needle. The gauge is
     sticky, so the page moves but the dial does not. */
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const t = span > 0 ? Math.min(Math.max(-rect.top / span, 0), 1) : 0;
      setProgress(t * MAX_INDEX);
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

  /** Scroll so the needle lands on a given event. */
  const goToEvent = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const span = el.offsetHeight - window.innerHeight;
    const t = Math.min(MAX_INDEX, Math.max(0, i)) / MAX_INDEX;
    window.scrollTo({ top: el.offsetTop + t * span, behavior: 'smooth' });
  };

  /* Arrow keys step through events — but only while the dial is actually
     pinned, so they do not hijack scrolling elsewhere on the page. */
  useEffect(() => {
    const onKey = (e) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pinned = rect.top <= 0 && rect.bottom >= window.innerHeight;
      if (!pinned) return;

      const here = Math.round(progress);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goToEvent(here + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goToEvent(here - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [progress]);

  const active = Math.min(MAX_INDEX, Math.max(0, Math.round(progress)));
  const currentEvent = EVENTS[active];
  // Needle follows the continuous value so it glides between events
  const needleAngle = ARC_START_DEG - (progress / MAX_INDEX) * 240;

  /* SVG viewport */
  const W = 700, H = 700;
  const cx = W / 2, cy = H / 2 + 40;
  const R_OUTER     = 270;
  const R_DOT       = 250;
  const R_INNER_ARC = 205;
  const R_TICK_OUT  = 260;
  const R_TICK_IN   = 245;
  const NEEDLE_LEN  = 185;
  const NEEDLE_BACK = 38;

  const ticks = [];
  for (let a = ARC_START_DEG; a >= ARC_END_DEG; a -= 20) {
    ticks.push({ a, p1: circlePoint(cx, cy, R_TICK_IN, a), p2: circlePoint(cx, cy, R_TICK_OUT, a) });
  }

  const needleRad  = degToRad(needleAngle);
  const needleTip  = { x: cx + NEEDLE_LEN * Math.cos(needleRad), y: cy - NEEDLE_LEN * Math.sin(needleRad) };
  const needleBack = { x: cx - NEEDLE_BACK * Math.cos(needleRad), y: cy + NEEDLE_BACK * Math.sin(needleRad) };
  const perpRad    = needleRad + Math.PI / 2;
  const nw = 7;
  const needleL    = { x: cx + nw * Math.cos(perpRad), y: cy - nw * Math.sin(perpRad) };
  const needleR    = { x: cx - nw * Math.cos(perpRad), y: cy + nw * Math.sin(perpRad) };

  /* Where the floating event card sits: just outside the arc, on the needle's
     own bearing — so it always rides on top of the point being aimed at. */
  const R_LABEL = 322;
  const labelPt = circlePoint(cx, cy, R_LABEL, needleAngle);
  const labelX  = (labelPt.x / W) * 100;
  const labelY  = (labelPt.y / H) * 100;
  const labelDX = labelX < 34 ? '-8%' : labelX > 66 ? '-92%' : '-50%';

  return (
    <section
      id="timeline"
      ref={trackRef}
      className="tl-track"
      style={{ height: `calc(100vh + ${MAX_INDEX * VH_PER_EVENT}vh)` }}
      aria-label="Club timeline"
    >
      <div className="tl-stage">
        <div className="tl-stage-inner">
          {/* Title */}
          <div className="tl-header">
            <div className="eyebrow" style={{ marginBottom: 6 }}>Idea Incubator · MGIT</div>
            <h2 className="tl-h1">Club <span className="gradient-text">Timeline</span></h2>
            <p className="tl-sub">Every session, workshop &amp; milestone on the road to NEC 2026.</p>
          </div>

        {/* SVG Gauge */}
        <div className="tl-speedo-wrap">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="tl-speedo-svg"
            aria-label={`Idea Incubator timeline. Event ${active + 1} of ${EVENTS.length}: ${currentEvent.title}, ${currentEvent.date}.`}
            role="img"
          >
            <defs>
              {/* Outer glow filter */}
              <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur1" />
                <feGaussianBlur stdDeviation="12" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-soft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-needle" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="8" result="blur1" />
                <feGaussianBlur stdDeviation="3" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-text" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Radial gradient for inner center */}
              <radialGradient id="center-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#1a1e35" stopOpacity="1" />
                <stop offset="100%" stopColor="#05070d" stopOpacity="1" />
              </radialGradient>
              {/* Needle gradient */}
              <linearGradient id="needle-grad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#7affcf" />
                <stop offset="100%" stopColor="#a3b2ff" />
              </linearGradient>
              {/* Arc gradient (approximated with multiple stops) */}
              <linearGradient id="arc-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%"   stopColor="#7fd4f5" />
                <stop offset="33%"  stopColor="#a3b2ff" />
                <stop offset="66%"  stopColor="#bc7aff" />
                <stop offset="100%" stopColor="#7affcf" />
              </linearGradient>
            </defs>

            {/* === Background outer ring (dim track) === */}
            <path
              d={arcPath(cx, cy, R_OUTER, ARC_START_DEG, ARC_END_DEG)}
              fill="none"
              stroke="rgba(163,178,255,0.08)"
              strokeWidth={28}
              strokeLinecap="round"
            />

            {/* === Glowing arc track === */}
            <path
              d={arcPath(cx, cy, R_OUTER, ARC_START_DEG, ARC_END_DEG)}
              fill="none"
              stroke="url(#arc-grad)"
              strokeWidth={4}
              strokeLinecap="round"
              filter="url(#glow-soft)"
              opacity={0.85}
            />
            {/* Second pass for stronger glow */}
            <path
              d={arcPath(cx, cy, R_OUTER, ARC_START_DEG, ARC_END_DEG)}
              fill="none"
              stroke="url(#arc-grad)"
              strokeWidth={2}
              strokeLinecap="round"
              filter="url(#glow-strong)"
              opacity={0.5}
            />

            {/* === Inner concentric decorative ring === */}
            <path
              d={arcPath(cx, cy, R_INNER_ARC, ARC_START_DEG, ARC_END_DEG)}
              fill="none"
              stroke="rgba(122,255,207,0.08)"
              strokeWidth={1}
              strokeLinecap="round"
            />

            {/* === Tick marks === */}
            {ticks.map(({ a, p1, p2 }) => {
              const isMajor = a % 60 === 0 || a === ARC_START_DEG || a === ARC_END_DEG;
              return (
                <line
                  key={a}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={isMajor ? 'rgba(163,178,255,0.55)' : 'rgba(163,178,255,0.2)'}
                  strokeWidth={isMajor ? 2 : 1}
                />
              );
            })}

            {/* === Event dots on the arc === */}
            {EVENTS.map((ev, i) => {
              const angle = eventAngle(i, EVENTS.length);
              const p     = circlePoint(cx, cy, R_DOT, angle);
              const isActive = i === active;
              return (
                <g key={ev.id}>
                  {/* Glow ring behind active dot */}
                  {isActive && (
                    <circle
                      cx={p.x} cy={p.y} r={18}
                      fill={ev.color}
                      opacity={0.25}
                      filter="url(#glow-strong)"
                    />
                  )}
                  <circle
                    cx={p.x} cy={p.y}
                    r={isActive ? 11 : 7}
                    fill={isActive ? ev.color : 'rgba(163,178,255,0.35)'}
                    stroke={isActive ? ev.color : 'rgba(163,178,255,0.6)'}
                    strokeWidth={isActive ? 0 : 1.5}
                    filter={isActive ? 'url(#glow-soft)' : undefined}
                    style={{ cursor: 'pointer', transition: 'r 0.4s, fill 0.4s' }}
                    onClick={() => goToEvent(i)}
                  />
                  {/* Event number label */}
                  <text
                    x={p.x} y={p.y + 0.4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={isActive ? 8 : 6}
                    fontFamily="var(--font-mono)"
                    fill={isActive ? '#05070d' : 'rgba(163,178,255,0.7)'}
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {/* === Needle === */}
            <g filter="url(#glow-needle)" style={{ transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
              <polygon
                points={`${needleTip.x},${needleTip.y} ${needleL.x},${needleL.y} ${needleBack.x},${needleBack.y} ${needleR.x},${needleR.y}`}
                fill="url(#needle-grad)"
                opacity={0.95}
              />
            </g>

            {/* Center pivot */}
            <circle cx={cx} cy={cy} r={22} fill="url(#center-grad)" />
            <circle cx={cx} cy={cy} r={18} fill="rgba(122,255,207,0.18)" filter="url(#glow-strong)" />
            <circle cx={cx} cy={cy} r={10} fill="#7affcf" filter="url(#glow-soft)" />
            <circle cx={cx} cy={cy} r={5}  fill="#fff" />

            {/* === Center label: "IDEA INCUBATOR TIMELINE" === */}
            <text
              x={cx} y={cy - 80}
              textAnchor="middle"
              fontSize={11}
              fontFamily="var(--font-mono)"
              letterSpacing="0.25em"
              textDecoration="uppercase"
              fill="#a3b2ff"
              filter="url(#glow-text)"
              opacity={0.9}
            >
              IDEA INCUBATOR
            </text>
            <text
              x={cx} y={cy - 62}
              textAnchor="middle"
              fontSize={9}
              fontFamily="var(--font-mono)"
              letterSpacing="0.38em"
              fill="#7affcf"
              filter="url(#glow-text)"
              opacity={0.75}
            >
              TIMELINE
            </text>

            {/* Progress counter where the info box used to be. The event itself
                now rides on the needle instead — see .tl-float-card below. */}
            <text
              x={cx} y={cy + 62}
              textAnchor="middle"
              fontSize={26}
              fontFamily="var(--font-display)"
              fontWeight="700"
              fill={currentEvent.color}
              filter="url(#glow-text)"
            >
              {String(active + 1).padStart(2, '0')}
              <tspan fontSize={13} fill="rgba(163,178,255,0.5)"> / {EVENTS.length}</tspan>
            </text>

            {/* Bottom arc label */}
            <text x={cx} y={cy + 230} textAnchor="middle" fontSize={8.5}
              fontFamily="var(--font-mono)" letterSpacing="0.22em" fill="rgba(163,178,255,0.35)">
              NEC 2026 · MGIT · IDEA INCUBATOR
            </text>
          </svg>

          {/* ── The current event, riding on top of the point the needle aims at.
                Only this one is ever shown — the full list is gone. ── */}
          <div
            className="tl-float-card"
            key={currentEvent.id}
            style={{
              left: `${labelX}%`,
              top: `${labelY}%`,
              transform: `translate(${labelDX}, -108%)`,
              '--ev-color': currentEvent.color,
            }}
          >
            <span className="tl-fc-date">{currentEvent.date}</span>
            <span className="tl-fc-title">{currentEvent.title}</span>
            <span className="tl-fc-sub">{currentEvent.sub}</span>
          </div>
        </div>

        {/* Input cue, fades out once the dial starts moving */}
        <div className="tl-scrollcue" style={{ opacity: progress > 0.15 ? 0 : 0.6 }}>
          <span className="eyebrow" style={{ fontSize: '0.58rem' }}>
            Scroll or use ← → to advance
          </span>
          <span className="tl-scrollcue-line" aria-hidden="true" />
        </div>
        </div>
      </div>

      {/* Screen-reader / keyboard access to every event without showing the list */}
      <ul className="sr-only">
        {EVENTS.map((ev, i) => (
          <li key={ev.id}>
            <button type="button" onClick={() => goToEvent(i)}>
              {ev.date} — {ev.title}. {ev.sub}
            </button>
          </li>
        ))}
      </ul>

      <style>{`
        /* One locked screen. The wheel is captured and converted into needle
           movement, so there is nothing to scroll to and the page never moves. */
        .tl-track { position: relative; }

        /* The gauge pins to the viewport while the track scrolls past it, so
           the dial itself never moves on screen — only the needle sweeps. */
        .tl-stage {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 16px 10px;
        }

        .tl-stage-inner {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* Compact title block inside the pinned panel */
        .tl-header {
          text-align: center;
          flex-shrink: 0;
          padding-bottom: 4px;
        }
        .tl-h1 {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 4vw, 2.6rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin: 0;
        }
        .tl-sub {
          margin-top: 6px;
          font-size: 0.82rem;
          color: var(--text-2);
        }

        /* Must stay exactly square AND match the SVG's rendered box, because
           the floating event card is positioned as a percentage of this
           element. aspect-ratio + max-height would break that the moment the
           height clamped, so both axes are driven by the same min(). */
        .tl-speedo-wrap {
          position: relative;
          --tl-size: min(92vw, 60vh, 520px);
          width:  var(--tl-size);
          height: var(--tl-size);
          flex-shrink: 0;
          margin: 0 auto;
        }

        .tl-speedo-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          user-select: none;
        }

        /* The single active event, floating on the needle bearing */
        .tl-float-card {
          position: absolute;
          width: max-content;
          max-width: min(260px, 46vw);
          padding: 12px 16px;
          border-radius: var(--r-md);
          background: rgba(10, 14, 24, 0.72);
          border: 1px solid color-mix(in srgb, var(--ev-color) 45%, transparent);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          box-shadow:
            0 0 22px -6px color-mix(in srgb, var(--ev-color) 55%, transparent),
            0 18px 40px -18px rgba(0, 0, 0, 0.9);
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 3px;
          animation: tl-pop 0.45s var(--ease-expo) both;
        }

        @keyframes tl-pop {
          from { opacity: 0; filter: blur(3px); }
          to   { opacity: 1; filter: blur(0); }
        }

        .tl-fc-date {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ev-color);
        }

        .tl-fc-title {
          font-family: var(--font-display);
          font-size: 0.98rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--text);
          line-height: 1.25;
        }

        .tl-fc-sub {
          font-size: 0.74rem;
          color: var(--text-3);
          line-height: 1.45;
        }

        .tl-scrollcue {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          transition: opacity 0.5s var(--ease-soft);
          pointer-events: none;
          flex-shrink: 0;
        }

        .tl-scrollcue-line {
          width: 1px;
          height: 22px;
          background: linear-gradient(180deg, var(--mint), transparent);
          animation: float-y 2.2s ease-in-out infinite;
        }

        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 560px) {
          .tl-float-card { max-width: 56vw; padding: 10px 12px; }
          .tl-fc-title { font-size: 0.86rem; }
          .tl-speedo-wrap { --tl-size: min(92vw, 52vh, 520px); }
          .tl-h1 { font-size: 1.5rem; }
        }
      `}</style>
    </section>
  );
}
