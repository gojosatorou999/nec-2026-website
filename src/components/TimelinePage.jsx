import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandLockup, IconArrow } from './BrandLogo';
import WaterLayer from './WaterLayer';

/* ═══════════════════════════════════════════════════════════════════════════
   TIMELINE PAGE — Circuit Trace Edition
   ───────────────────────────────────────────────────────────────────────────
   A vertical "circuit board" trace that draws itself as you scroll, with
   glowing solder-point nodes that light up event-by-event. Much more
   readable than the speedometer — every event is visible at once, and the
   active one is highlighted as you move down.
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

/* Build circuit SVG path — a zigzag trace through N solder points */
function buildTracePath(events) {
  // Path is 80px wide, height is (events.length * NODE_GAP) px
  // Even events: connector comes from right; odd from left — chevron pattern
  const NODE_GAP = 110;
  const H = events.length * NODE_GAP;
  // Simple straight vertical trace centered in the 80px column
  return `M40,0 ${events.map((_, i) => `L40,${(i + 1) * NODE_GAP}`).join(' ')}`;
}

function buildSolderPoints(events) {
  const NODE_GAP = 110;
  return events.map((ev, i) => ({
    cy: (i + 0.5) * NODE_GAP,
    idx: i,
    color: ev.color,
  }));
}

const TRACE_PATH = buildTracePath(EVENTS);
const SOLDER_PTS = buildSolderPoints(EVENTS);
const TRACE_HEIGHT = EVENTS.length * 110;

/* bidirectional viewport fade — shared for all beats */
function useBeatsInView(count, threshold = 0.1) {
  const refs = useRef(Array.from({ length: count }, () => null));
  const [inViews, setInViews] = useState(() => Array(count).fill(false));

  useEffect(() => {
    const observers = refs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) =>
          setInViews((prev) => {
            const next = [...prev];
            next[i] = entry.isIntersecting;
            return next;
          }),
        { threshold, rootMargin: '-20px 0px -20px 0px' }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [count, threshold]);

  const setRef = (i) => (el) => { refs.current[i] = el; };
  return { inViews, setRef };
}

export default function TimelinePage() {
  const sectionRef = useRef(null);
  const traceRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Pre-allocate one InView observer per event — no hooks in loops
  const { inViews, setRef } = useBeatsInView(EVENTS.length, 0.15);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSectionVisible(entry.isIntersecting),
      { threshold: 0.02 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section || !sectionVisible) return;
    const rect = section.getBoundingClientRect();
    const traveled = window.innerHeight - rect.top;
    const progress = Math.max(0, Math.min(1, traveled / (rect.height + window.innerHeight * 0.3)));
    setScrollProgress(progress);
  }, [sectionVisible]);

  useEffect(() => {
    if (reducedMotion) { setScrollProgress(1); return; }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, reducedMotion]);

  useEffect(() => {
    const path = traceRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length * (1 - scrollProgress)}`;
  }, [scrollProgress]);

  const isBeatActive = (i) => reducedMotion || inViews[i];

  return (
    <>
      <WaterLayer />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* ── Nav ── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 60, padding: '16px clamp(14px, 4vw, 34px)' }}>
          <nav
            className="glass glass-sheen"
            style={{
              maxWidth: 1240, margin: '0 auto',
              padding: '10px 12px 10px 16px',
              borderRadius: 'var(--r-pill)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}
          >
            <a href="/" style={{ textDecoration: 'none' }} aria-label="Back to NEC 2026 Challenge">
              <BrandLockup size={34} />
            </a>
            <a href="/" className="btn btn-ghost" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
              <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}>
                <IconArrow size={14} />
              </span>
              Back to main site
            </a>
          </nav>
        </header>

        {/* ── Main timeline section ── */}
        <section
          ref={sectionRef}
          className="tl-section"
          aria-label="Idea Incubator Club Timeline"
        >
          <div className="tl-inner">
            {/* Header */}
            <div className="tl-page-header">
              <div className="eyebrow">Idea Incubator · MGIT</div>
              <h1 className="tl-title">
                Club <span className="gradient-text">Timeline</span>
              </h1>
              <p className="tl-subtitle">
                Every session, workshop and milestone on the road to NEC 2026.
              </p>
            </div>

            <div className="tl-body">
              {/* ── Circuit trace (desktop: right edge, mobile: left edge) ── */}
              <div className="tl-trace tl-trace-desktop" aria-hidden="true">
                <svg
                  className="tl-trace-svg"
                  viewBox={`0 0 80 ${TRACE_HEIGHT}`}
                  preserveAspectRatio="none"
                  fill="none"
                >
                  {/* Ghost track */}
                  <path
                    d={TRACE_PATH}
                    stroke="rgba(163,178,255,0.08)"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* Animated drawing trace */}
                  <path
                    ref={traceRef}
                    d={TRACE_PATH}
                    stroke="var(--peri)"
                    strokeWidth="2"
                    fill="none"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(163,178,255,0.6))', transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                  {/* Solder nodes */}
                  {SOLDER_PTS.map(({ cy, idx, color }) => (
                    <g key={idx}>
                      <circle
                        cx="40" cy={cy} r="12"
                        fill={isBeatActive(idx) ? `${color}22` : 'transparent'}
                        style={{ transition: 'fill 0.6s ease' }}
                      />
                      <circle
                        cx="40" cy={cy} r="6"
                        fill={isBeatActive(idx) ? color : 'rgba(163,178,255,0.15)'}
                        stroke={isBeatActive(idx) ? color : 'rgba(163,178,255,0.2)'}
                        strokeWidth="1.5"
                        style={{
                          transition: 'fill 0.5s ease, stroke 0.5s ease, filter 0.5s ease',
                          filter: isBeatActive(idx) ? `drop-shadow(0 0 8px ${color})` : 'none',
                        }}
                      />
                      {/* Number label */}
                      <text
                        x="40" y={cy + 0.4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="5"
                        fontFamily="monospace"
                        fill={isBeatActive(idx) ? '#05070d' : 'rgba(163,178,255,0.5)'}
                        fontWeight="700"
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Mobile left-edge trace */}
              <div className="tl-trace tl-trace-mobile" aria-hidden="true">
                <svg
                  className="tl-trace-svg"
                  viewBox={`0 0 32 ${TRACE_HEIGHT}`}
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <line x1="16" y1="0" x2="16" y2={TRACE_HEIGHT} stroke="rgba(163,178,255,0.08)" strokeWidth="2" />
                  <line
                    x1="16" y1="0" x2="16" y2={TRACE_HEIGHT}
                    stroke="var(--peri)" strokeWidth="2"
                    strokeDasharray={TRACE_HEIGHT}
                    strokeDashoffset={TRACE_HEIGHT * (1 - scrollProgress)}
                    style={{ filter: 'drop-shadow(0 0 4px rgba(163,178,255,0.5))', transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                  {SOLDER_PTS.map(({ cy, idx, color }) => (
                    <circle
                      key={idx}
                      cx="16" cy={cy} r="4"
                      fill={isBeatActive(idx) ? color : 'rgba(163,178,255,0.15)'}
                      style={{
                        transition: 'fill 0.5s ease, filter 0.5s ease',
                        filter: isBeatActive(idx) ? `drop-shadow(0 0 6px ${color})` : 'none',
                      }}
                    />
                  ))}
                </svg>
              </div>

              {/* ── Event beats ── */}
              <div className="tl-beats">
                {EVENTS.map((ev, i) => (
                  <div
                    key={ev.id}
                    ref={setRef(i)}
                    className="tl-beat"
                    data-in={isBeatActive(i)}
                    style={{ transitionDelay: reducedMotion ? '0ms' : `${i * 30}ms` }}
                  >
                    <div className="tl-beat-head">
                      <span
                        className="tl-rule"
                        style={{ background: ev.color, boxShadow: `0 0 8px ${ev.color}88` }}
                      />
                      <span className="tl-beat-num font-mono">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="tl-beat-date font-mono">{ev.date}</span>
                    </div>
                    <h2 className="tl-beat-title" style={{ color: ev.color }}>
                      {ev.title}
                    </h2>
                    <p className="tl-beat-sub">{ev.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ambient glow */}
          <div className="tl-glow" aria-hidden="true" />
        </section>
      </div>

      <style>{`
        .tl-section {
          position: relative;
          overflow: hidden;
          flex: 1;
        }

        .tl-inner {
          max-width: 1152px;
          margin: 0 auto;
          padding: clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px) clamp(80px, 12vw, 140px);
        }

        .tl-page-header {
          text-align: center;
          margin-bottom: clamp(48px, 8vw, 96px);
        }
        .tl-title {
          font-family: var(--font-display);
          font-size: clamp(2.8rem, 8vw, 5.5rem);
          font-weight: 700;
          letter-spacing: -0.05em;
          line-height: 1;
          margin: 16px 0 20px;
        }
        .tl-subtitle {
          font-size: clamp(1rem, 1.8vw, 1.2rem);
          color: var(--text-2);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.7;
        }

        .tl-body { position: relative; }

        /* ── Circuit trace column ── */
        .tl-trace {
          position: absolute;
          top: 0;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        .tl-trace-svg { width: 100%; height: 100%; }
        .tl-trace-desktop { right: 0; width: 64px; display: none; }
        .tl-trace-mobile  { left: 0;  width: 32px; display: block; }
        @media (min-width: 768px) {
          .tl-trace-desktop { display: block; }
          .tl-trace-mobile  { display: none; }
        }
        @media (min-width: 1024px) {
          .tl-trace-desktop { width: 96px; }
        }

        /* ── Event beats list ── */
        .tl-beats {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: clamp(40px, 7vw, 72px);
          padding-left: 40px;
        }
        @media (min-width: 768px) {
          .tl-beats { padding-left: 0; padding-right: 96px; }
        }
        @media (min-width: 1024px) {
          .tl-beats { padding-right: 128px; }
        }

        .tl-beat {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s var(--ease-expo), transform 0.8s var(--ease-expo);
        }
        .tl-beat[data-in='true'] { opacity: 1; transform: none; }

        .tl-beat-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .tl-rule {
          display: inline-block;
          flex-shrink: 0;
          width: 28px;
          height: 2px;
          border-radius: 1px;
        }
        .tl-beat-num {
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          color: var(--text-3);
          font-weight: 700;
        }
        .tl-beat-date {
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          color: var(--text-3);
          text-transform: uppercase;
        }

        .tl-beat-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3.5vw, 2.4rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 8px;
        }

        .tl-beat-sub {
          font-size: 1rem;
          color: var(--text-2);
          line-height: 1.65;
          max-width: 560px;
        }
        @media (min-width: 768px) { .tl-beat-sub { font-size: 1.1rem; } }

        .tl-glow {
          position: absolute;
          left: -100px;
          top: 40%;
          transform: translateY(-50%);
          width: 600px;
          height: 600px;
          border-radius: 50%;
          opacity: 0.05;
          pointer-events: none;
          background: radial-gradient(circle, var(--peri) 0%, transparent 70%);
        }

        @media (prefers-reduced-motion: reduce) {
          .tl-beat { opacity: 1; transform: none; transition: none; }
        }
      `}</style>
    </>
  );
}
