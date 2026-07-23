import { useRef, useState, useEffect, useCallback } from 'react';
import { ABOUT_ENTITIES } from '../data/site';
import StickyStack from './StickyStack';

/* ═══════════════════════════════════════════════════════════════════════════
   ABOUT — IDEA INCUBATOR MGIT
   Two halves, in order:
     1. the four bodies behind NEC 2026, as a stacking deck (copy from
        data/site.js, verbatim as supplied)
     2. the race circuit event gallery, unchanged — a position:fixed panel
        driven by a tall scroll zone, so it works regardless of parent overflow
   ═══════════════════════════════════════════════════════════════════════════ */

const EVENTS = [
  { image: '/images/hack4sdg.png',    title: 'Ideathon Hack4SDG',   category: 'Hackathon',   accent: '#7fd4f5', description: 'A 24-hour hackathon building solutions for the UN SDGs. 40+ teams, real prototypes, real impact.' },
  { image: '/images/bplan.png',       title: 'B-Plan Demo Day',      category: 'Pitch Event', accent: '#a3b2ff', description: 'Investor-style demo day — shortlisted teams pitched to founders. Top 3 went to state-level competitions.' },
  { image: '/images/panel.png',       title: 'Panel Discussion',     category: 'Discussion',  accent: '#bc7aff', description: 'Founders shared candid insights on funding, tier-2 cities, and what building a startup really looks like.' },
  { image: '/images/innovation.png',  title: 'Innovation Workshop',  category: 'Workshop',    accent: '#ffd65c', description: 'Full-day design-thinking sprint — map a problem, prototype a solution, stress-test assumptions. One room, one day.' },
  { image: '/images/mentorship.png',  title: 'Startup Mentorship',   category: 'Mentorship',  accent: '#7affcf', description: 'One-on-one with successful entrepreneurs. War stories, deck reviews, honest feedback — no syllabus teaches this.' },
  { image: '/images/achievement.png', title: 'Achievement Awards',   category: 'Awards',      accent: '#ff9a72', description: 'Annual ceremony honouring outstanding innovations — recognising both the idea and the grind behind it.' },
];

/* F1-style circuit path in a 900×520 viewBox.
   6 checkpoints at key bends — each anchors an event card. */
const CIRCUIT_PATH = `
  M 80 260
  C 80 170, 130 100, 220 80
  L 390 65
  C 450 60, 490 90, 505 140
  L 530 215
  C 545 250, 580 265, 625 258
  L 720 244
  C 775 238, 815 198, 830 155
  C 848 108, 835 58, 792 40
  C 748 22, 690 30, 662 68
  C 636 102, 642 146, 665 170
  C 688 194, 718 204, 748 198
  C 768 194, 782 178, 775 158
  C 768 138, 748 132, 735 140
  L 820 390
  C 832 428, 808 468, 765 480
  L 490 493
  C 428 498, 388 468, 378 426
  L 358 352
  C 347 312, 318 294, 278 300
  L 188 315
  C 138 320, 95 348, 78 398
  C 62 448, 74 488, 105 505
  C 136 522, 175 510, 182 478
  C 190 446, 168 416, 143 410
  C 118 404, 100 424, 108 446
  L 80 260
`;

const CHECKPOINTS = [
  { t: 0.10, x: 305, y: 64,  side: 'top',    event: 0 },
  { t: 0.25, x: 530, y: 178, side: 'right',  event: 1 },
  { t: 0.40, x: 738, y: 52,  side: 'top',    event: 2 },
  { t: 0.58, x: 790, y: 440, side: 'bottom', event: 3 },
  { t: 0.73, x: 368, y: 410, side: 'left',   event: 4 },
  { t: 0.90, x: 143, y: 460, side: 'bottom', event: 5 },
];

/* ══════════════════════════════════════════════════════════
   RACE CIRCUIT — fixed-panel approach, immune to sticky bugs
   ══════════════════════════════════════════════════════════ */
function RaceCircuit() {
  /* The "zone" div measures where on the page the circuit section lives.
     When zone is scrolling through the viewport, the fixed panel is shown. */
  const zoneRef     = useRef(null);
  const pathRef     = useRef(null);
  const trailRef    = useRef(null);
  const dotRef      = useRef(null);
  const dotGlowRef  = useRef(null);
  const rafRef      = useRef(null);
  const smoothRef   = useRef(0);
  const rawRef      = useRef(0);

  const [phase, setPhase] = useState('before'); // 'before' | 'active' | 'after'
  const [activeCP, setActiveCP] = useState(-1);
  const activeCPRef = useRef(-1);
  const phaseRef = useRef('before');

  /* Compute scroll progress (0–1) and phase from the zone rect */
  const tick = useCallback(() => {
    const zone = zoneRef.current;
    if (!zone) { rafRef.current = requestAnimationFrame(tick); return; }

    const rect = zone.getBoundingClientRect();
    const vh   = window.innerHeight;

    // Zone enters viewport when rect.top < vh
    // Zone exits viewport when rect.bottom < 0
    // Progress: 0 when zone top hits top of viewport, 1 when zone bottom hits top of viewport
    const scrolled = -rect.top;          // pixels past the top of viewport
    const total    = rect.height - vh;   // total scroll distance while active

    let newPhase;
    let p;
    if (rect.top > vh) {
      newPhase = 'before'; p = 0;
    } else if (rect.bottom < 0) {
      newPhase = 'after'; p = 1;
    } else {
      newPhase = 'active';
      p = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0;
    }

    rawRef.current = p;

    if (newPhase !== phaseRef.current) {
      phaseRef.current = newPhase;
      setPhase(newPhase);
    }

    // Smooth follow
    smoothRef.current += (rawRef.current - smoothRef.current) * 0.07;
    const sp = smoothRef.current;

    // Drive SVG animation
    const path  = pathRef.current;
    const trail = trailRef.current;
    const dot   = dotRef.current;
    const glow  = dotGlowRef.current;
    if (path && trail && dot) {
      const len = path.getTotalLength();
      path.style.strokeDashoffset  = len * (1 - sp);
      trail.style.strokeDashoffset = len * (1 - Math.max(0, sp - 0.06));
      const pt = path.getPointAtLength(sp * len);
      dot.setAttribute('cx', pt.x);
      dot.setAttribute('cy', pt.y);
      if (glow) { glow.setAttribute('cx', pt.x); glow.setAttribute('cy', pt.y); }
    }

    // Checkpoints
    const newCP = CHECKPOINTS.reduce((best, cp, i) => sp >= cp.t && i > best ? i : best, -1);
    if (newCP !== activeCPRef.current) {
      activeCPRef.current = newCP;
      setActiveCP(newCP);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Init dash arrays once path is in the DOM
    const path  = pathRef.current;
    const trail = trailRef.current;
    if (path && trail) {
      const len = path.getTotalLength();
      path.style.strokeDasharray  = len;
      path.style.strokeDashoffset = len;
      trail.style.strokeDasharray  = len;
      trail.style.strokeDashoffset = len;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const isActive = phase === 'active';
  const isAfter  = phase === 'after';

  return (
    <>
      {/* ── Tall scroll zone — this IS in document flow and gives scroll height ── */}
      <div
        ref={zoneRef}
        style={{
          position: 'relative',
          height: '500vh',
          /* Transparent spacer — only exists to measure scroll progress */
        }}
      >
        {/* ── Fixed panel — pinned to viewport when active ── */}
        <div
          style={{
            position:   isActive ? 'fixed' : 'absolute',
            top:        isActive ? 0 : isAfter ? 'auto' : 0,
            bottom:     isAfter  ? 0 : 'auto',
            left:       0,
            right:      0,
            height:     '100vh',
            zIndex:     50,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            overflow:   'hidden',
          }}
        >
          {/* Track SVG area */}
          <div style={{ position: 'relative', width: 'min(96vw, 960px)', aspectRatio: '900/520', maxHeight: '88vh' }}>
            <svg
              viewBox="0 0 900 520"
              preserveAspectRatio="xMidYMid meet"
              style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
              aria-hidden="true"
            >
              <defs>
                <filter id="rc-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="rc-glow-soft" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <radialGradient id="dot-grad" cx="50%" cy="35%" r="60%">
                  <stop offset="0%"   stopColor="#ffffff"/>
                  <stop offset="55%"  stopColor="#7fd4f5"/>
                  <stop offset="100%" stopColor="#a3b2ff" stopOpacity="0.3"/>
                </radialGradient>
              </defs>

              {/* ── Tarmac base ── */}
              <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"/>
              {/* ── Kerb dashes ── */}
              <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.06)"  strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16 12"/>
              {/* ── Centre line ── */}
              <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="2"  strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 16"/>

              {/* ── Neon trail (bright, slightly behind car) ── */}
              <path ref={trailRef} d={CIRCUIT_PATH} fill="none" stroke="rgba(163,178,255,0.6)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#rc-glow-strong)"/>
              {/* ── Main drawn line ── */}
              <path ref={pathRef}  d={CIRCUIT_PATH} fill="none" stroke="#a3b2ff"               strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#rc-glow-soft)"/>

              {/* ── Checkpoints ── */}
              {CHECKPOINTS.map((cp, i) => {
                const reached = i <= activeCP;
                const ev = EVENTS[cp.event];
                return (
                  <g key={i}>
                    <circle cx={cp.x} cy={cp.y} r={reached ? 15 : 10} fill="none"
                      stroke={reached ? ev.accent : 'rgba(255,255,255,0.12)'}
                      strokeWidth={reached ? 2 : 1}
                      opacity={reached ? 0.75 : 0.3}
                      style={{ transition: 'all 0.5s ease' }}
                    />
                    <circle cx={cp.x} cy={cp.y} r={reached ? 6.5 : 4}
                      fill={reached ? ev.accent : 'rgba(255,255,255,0.18)'}
                      filter={reached ? 'url(#rc-glow-soft)' : undefined}
                      style={{ transition: 'all 0.5s ease' }}
                    />
                    <text x={cp.x} y={cp.y + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize="5" fontWeight="700" fontFamily="JetBrains Mono, monospace"
                      fill={reached ? 'rgba(5,7,13,0.9)' : 'rgba(255,255,255,0.25)'}
                      style={{ transition: 'fill 0.5s ease' }}
                    >{String(i + 1).padStart(2, '0')}</text>
                  </g>
                );
              })}

              {/* ── Car dot ── */}
              <circle ref={dotRef}     cx="80" cy="260" r="9"   fill="url(#dot-grad)" filter="url(#rc-glow-strong)"/>
              <circle ref={dotGlowRef} cx="80" cy="260" r="3.5" fill="white" opacity="0.95"/>
            </svg>

            {/* ── Event cards overlaid on SVG ── */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {CHECKPOINTS.map((cp, i) => {
                const ev = EVENTS[cp.event];
                const reached = i <= activeCP;
                const leftPct = `${(cp.x / 900) * 100}%`;
                const topPct  = `${(cp.y / 520) * 100}%`;

                /* Offset direction by side */
                const offsets = {
                  top:    { transform: 'translate(-50%, calc(-100% - 20px))' },
                  bottom: { transform: 'translate(-50%, 20px)' },
                  left:   { transform: 'translate(calc(-100% - 20px), -50%)' },
                  right:  { transform: 'translate(20px, -50%)' },
                };

                return (
                  <div
                    key={i}
                    style={{
                      position:   'absolute',
                      left:       leftPct,
                      top:        topPct,
                      width:      'clamp(140px, 16vw, 210px)',
                      ...offsets[cp.side],
                      background: 'rgba(6,8,18,0.92)',
                      border:     `1px solid ${reached ? ev.accent + '44' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 14,
                      overflow:   'hidden',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      opacity:    reached ? 1 : 0,
                      scale:      reached ? '1' : '0.82',
                      transition: 'opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), scale 0.5s cubic-bezier(0.34,1.56,0.64,1), border-color 0.5s ease',
                      boxShadow:  reached ? `0 8px 32px -6px rgba(0,0,0,0.8), 0 0 20px -4px ${ev.accent}55` : 'none',
                    }}
                  >
                    {/* Photo */}
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img src={ev.image} alt={ev.title} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                                 transform: reached ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s ease' }}
                      />
                    </div>
                    {/* Text */}
                    <div style={{ padding: '8px 11px 11px' }}>
                      <span style={{ display: 'block', fontSize: '0.56rem', fontWeight: 700,
                                     letterSpacing: '1.8px', textTransform: 'uppercase',
                                     fontFamily: 'var(--font-mono)', color: ev.accent, marginBottom: 3 }}>
                        {ev.category}
                      </span>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 700,
                                    color: 'var(--text)', lineHeight: 1.25, marginBottom: 5 }}>
                        {ev.title}
                      </div>
                      <p style={{ fontSize: '0.64rem', color: 'var(--text-2)', lineHeight: 1.55, margin: 0,
                                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ev.description}
                      </p>
                    </div>
                    {/* Connector line toward checkpoint dot */}
                    <div style={{
                      position: 'absolute',
                      background: ev.accent,
                      opacity: 0.35,
                      borderRadius: 1,
                      ...{
                        top:    { bottom: 0,  left: '50%', width: 2, height: 20, transform: 'translateX(-50%) translateY(100%)' },
                        bottom: { top: 0,    left: '50%', width: 2, height: 20, transform: 'translateX(-50%) translateY(-100%)' },
                        left:   { right: 0,  top: '50%',  height: 2, width: 20, transform: 'translateY(-50%) translateX(100%)' },
                        right:  { left: 0,   top: '50%',  height: 2, width: 20, transform: 'translateY(-50%) translateX(-100%)' },
                      }[cp.side],
                    }}/>
                  </div>
                );
              })}
            </div>

            {/* Checkpoint counter */}
            <div style={{ position: 'absolute', top: 20, right: 20, textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.18em',
                            color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 2 }}>
                Checkpoint
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--peri)' }}>
                {activeCP < 0 ? '— / 6' : `${activeCP + 1} / 6`}
              </div>
            </div>

            {/* Scroll hint */}
            {activeCP < 0 && isActive && (
              <div style={{
                position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase',
                animation: 'rc-hint-fade 2s ease infinite',
                pointerEvents: 'none',
              }}>
                <span>Scroll to drive</span>
                <div style={{ width: 16, height: 16,
                              borderRight: '2px solid var(--text-3)', borderBottom: '2px solid var(--text-3)',
                              transform: 'rotate(45deg)', animation: 'rc-bounce 2s infinite' }}/>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rc-bounce {
          0%,100% { transform: rotate(45deg) translate(0,0); opacity:.4; }
          50%      { transform: rotate(45deg) translate(4px,4px); opacity:1; }
        }
        @keyframes rc-hint-fade {
          0%,100% { opacity:.5; } 50% { opacity:1; }
        }
      `}</style>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════ */
export default function AboutClub() {
  return (
    <>
      {/* ── The four bodies behind NEC 2026, as a stacking deck ── */}
      <section id="about" aria-label="About Idea Incubator MGIT" style={{ position: 'relative' }}>
        <div className="ab-inner" style={{ paddingBlock: 0 }}>
          <StickyStack
            maxWidth={900}
            header={
              <>
                <div className="eyebrow">About</div>
                <h1
                  style={{
                    marginTop: 16,
                    fontSize: 'clamp(2rem, 4.6vw, 3.2rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                  }}
                >
                  The four bodies <span className="gradient-text">behind NEC 2026</span>
                </h1>
                <p
                  style={{
                    marginTop: 18,
                    fontSize: '1rem',
                    color: 'var(--text-2)',
                    lineHeight: 1.7,
                  }}
                >
                  The competition, the host, the council it runs under, and the club
                  sending twenty-five people to Powai.
                </p>
              </>
            }
          >
            {ABOUT_ENTITIES.map((e) => (
              <article
                key={e.id}
                className="stack-card about-card"
                style={{ '--accent': e.accent }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: '0.63rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: e.accent,
                  }}
                >
                  {e.kicker}
                </span>

                <h2
                  style={{
                    fontSize: 'clamp(1.35rem, 2.6vw, 1.85rem)',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {e.title}
                </h2>

                <p style={{ color: e.accent, fontSize: '0.9rem', lineHeight: 1.5 }}>{e.lede}</p>

                <hr className="hairline" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {e.body.map((para, i) => (
                    <p key={i} className="about-para">
                      {para}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </StickyStack>
        </div>
        <div className="ab-glow" aria-hidden="true" />
      </section>

      {/* ── Race Circuit ── */}
      <section aria-label="Event highlights — race circuit" style={{ position: 'relative' }}>
        <div className="ab-inner" style={{ paddingBottom: 'clamp(28px, 4vw, 48px)' }}>
          <div className="ab-eyebrow-chip" style={{ marginBottom: 16 }}>Event Highlights</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                       fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 14 }}>
            The club in <span className="gradient-text">action</span>
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 0 }}>
            Scroll to drive around the circuit — each checkpoint reveals an event.
          </p>
        </div>

        <RaceCircuit />
      </section>

      <style>{`
        .ab-inner {
          max-width: 1200px; margin: 0 auto;
          padding: clamp(72px,10vw,128px) clamp(20px,5vw,72px) clamp(56px,8vw,96px);
        }
        .ab-eyebrow-chip {
          display: inline-block; background: rgba(163,178,255,0.1);
          border: 1px solid rgba(163,178,255,0.2); color: var(--peri);
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          padding: 6px 14px; border-radius: 50px; margin-bottom: 20px; font-family: var(--font-mono);
        }
        /* right:0, not right:-150px. Hanging it off the edge relied on
           overflow-x clip on the root, which Safari only understands from
           version 16 — on anything older it produced a sideways scroll. */
        .ab-glow {
          position:absolute; right:0; top:40%; transform:translateY(-50%);
          width:min(600px, 100%); height:600px; border-radius:50%;
          opacity:0.05; pointer-events:none;
          background:radial-gradient(circle, var(--peri) 0%, transparent 70%);
        }

        /* ── the four-bodies deck ── */
        .about-card { gap: 11px; }
        .about-para { color: var(--text-2); font-size: 0.92rem; line-height: 1.66; }
        /* The Idea Incubator card runs to four paragraphs and E-Cell's second
           one is long — the deck has to stay inside one screen, so the copy
           tightens on shorter viewports rather than spilling out of the pin. */
        @media (max-height: 900px) {
          .about-para { font-size: 0.85rem; line-height: 1.55; }
          .about-card { gap: 8px; }
        }
      `}</style>
    </>
  );
}
