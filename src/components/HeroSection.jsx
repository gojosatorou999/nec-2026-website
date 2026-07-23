import { useEffect, useRef, Suspense, lazy } from 'react';
import { EVENT, DELEGATES } from '../data/site';
import { IdeaIncubatorLogo, IconArrow } from './BrandLogo';

const IdeaLogoScene = lazy(() => import('./IdeaLogoScene'));

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
   ───────────────────────────────────────────────────────────────────────────
   A long pinned scroll. The 3D "I" mark holds whole, breaks into eight shards
   revealing the bulb at its core, then reassembles — all keyed to scroll
   position, so scrolling back up runs it backwards exactly.

   The event stays the headline; the club, the host and the collaboration sit
   in the credit rail along the bottom, where a presenting credit belongs.

   Everything below is driven imperatively from one rAF loop. Putting scroll
   progress in React state here would re-render the whole hero every frame.
   ═══════════════════════════════════════════════════════════════════════════ */

// caption visibility windows, in scroll progress
const CAPTION_WINDOWS = [
  [0.03, 0.16],
  [0.34, 0.6],
  [0.76, 0.93],
];

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/* Mean separation across the eight shards — mirrors IdeaLogoScene's per-shard
   curve so the copy fades in step with the mark. Monotonic: the logo no longer
   reassembles on its own at the end of the rail. */
function shardSeparation(p) {
  return smoothstep(0.05, 0.8, p);
}

export default function HeroSection() {
  const progressRef = useRef(0);
  const wrapperRef = useRef(null);
  const headlineRef = useRef(null);
  const captionRefs = [useRef(null), useRef(null), useRef(null)];
  const ctaRef = useRef(null);
  const hintRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const el = wrapperRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const p = Math.max(0, Math.min(1, -rect.top / scrollable));
      progressRef.current = p;

      const sep = shardSeparation(p);

      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 0.85 - p * 9));
      if (headlineRef.current) {
        headlineRef.current.style.opacity = String(Math.max(0.12, 1 - sep * 1.05));
        headlineRef.current.style.transform = `translateY(${-sep * 26}px)`;
      }

      for (let i = 0; i < 3; i++) {
        const node = captionRefs[i].current;
        if (!node) continue;
        const [a, b] = CAPTION_WINDOWS[i];
        const mid = (a + b) / 2;
        const half = (b - a) / 2;
        const vis =
          smoothstep(a, Math.min(mid, a + half * 0.5), p) *
          (1 - smoothstep(Math.max(mid, b - half * 0.5), b, p));
        node.style.opacity = String(vis);
        node.style.transform = `translateX(-50%) translateY(${(1 - vis) * 16}px)`;
      }

      if (ctaRef.current) {
        const vis = smoothstep(0.84, 0.96, p);
        ctaRef.current.style.opacity = String(vis);
        ctaRef.current.style.pointerEvents = vis > 0.5 ? 'auto' : 'none';
        ctaRef.current.style.transform = `translateY(${(1 - vis) * 18}px)`;
      }
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
    // captionRefs is a stable array of refs created once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="top" ref={wrapperRef} className="hero-rail" aria-label="NEC 2026 Challenge">
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100svh',
          overflow: 'hidden',
          background: 'var(--ink)',
        }}
      >
        {/* ── 3D mark ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Suspense fallback={null}>
            <IdeaLogoScene progressRef={progressRef} />
          </Suspense>
        </div>

        {/* Scroll progress */}
        <div
          ref={barRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '0 0 auto 0',
            zIndex: 60,
            height: 2,
            transformOrigin: 'left',
            transform: 'scaleX(0)',
            background: 'linear-gradient(90deg, var(--peri), var(--mint), var(--violet))',
          }}
        />

        {/* Scrim keeps the headline readable over the logo */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            // Pulled up and lightened: at 0.8 centred on 32% this sat directly
            // over the logo and smothered it. It only needs to protect the
            // headline, which lives in the top third.
            background:
              'radial-gradient(58% 26% at 50% 16%, rgba(5,7,13,0.82), rgba(5,7,13,0.32) 62%, transparent 82%)',
          }}
        />

        {/* ── Headline ── */}
        <div
          ref={headlineRef}
          style={{
            position: 'absolute',
            insetInline: 0,
            top: 'clamp(88px, 15vh, 150px)',
            zIndex: 2,
            textAlign: 'center',
            padding: '0 clamp(20px, 6vw, 80px)',
            pointerEvents: 'none',
            willChange: 'opacity, transform',
          }}
        >
          <div
            className="chip"
            style={{ marginBottom: 24, animation: 'float-y 6s ease-in-out infinite' }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--mint)',
                boxShadow: '0 0 10px var(--mint)',
                animation: 'soft-pulse 2.4s ease-in-out infinite',
              }}
            />
            {EVENT.venue}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.9rem, 9vw, 6.6rem)',
              fontWeight: 700,
              letterSpacing: '-0.045em',
              lineHeight: 0.94,
            }}
          >
            NEC <span className="gradient-text">2026</span>
            <br />
            Challenge
          </h1>

          <p
            style={{
              margin: '26px auto 0',
              maxWidth: 600,
              fontSize: 'clamp(1rem, 1.7vw, 1.12rem)',
              color: 'var(--text-2)',
              lineHeight: 1.72,
            }}
          >
            The National Entrepreneurship Challenge, Asia&rsquo;s largest business model
            competition. Twenty-two from MGIT are going to Powai.
          </p>
        </div>

        {/* ── Scroll captions ── */}
        {[
          <>
            Every idea starts <span className="gradient-text">whole</span>
          </>,
          <>
            Take it <span className="gradient-text">apart</span>
          </>,
          <>
            Build it back <span className="gradient-text">on the way up</span>
          </>,
        ].map((copy, i) => (
          <div
            key={i}
            ref={captionRefs[i]}
            className="hero-caption"
            style={{ opacity: 0, transform: 'translateX(-50%) translateY(16px)' }}
          >
            {copy}
          </div>
        ))}

        {/* ── CTA, arriving once the logo is whole again ── */}
        <div
          ref={ctaRef}
          style={{
            position: 'absolute',
            insetInline: 0,
            bottom: 'clamp(112px, 15vh, 160px)',
            zIndex: 3,
            display: 'flex',
            gap: 13,
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '0 20px',
            opacity: 0,
            pointerEvents: 'none',
            willChange: 'opacity, transform',
          }}
        >
          <a href="#delegation" className="btn btn-primary">
            Meet the {DELEGATES.length} <IconArrow />
          </a>
          <a href="#about" className="btn btn-ghost">
            About the challenge
          </a>
        </div>

        {/* ── Credit rail ── */}
        <div
          style={{
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            zIndex: 2,
            padding: '0 clamp(20px, 6vw, 80px) clamp(22px, 3.5vw, 34px)',
          }}
        >
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <hr className="hairline" style={{ marginBottom: 18 }} />

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px 28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <IdeaIncubatorLogo size={34} />
                <div>
                  <div className="eyebrow" style={{ fontSize: '0.6rem' }}>
                    Presented by
                  </div>
                  <div className="credit-name">Idea Incubator · MGIT</div>
                </div>
              </div>

              <div>
                <div className="eyebrow" style={{ fontSize: '0.6rem' }}>
                  In collaboration with
                </div>
                <div className="credit-name">{EVENT.host}</div>
              </div>

              <div>
                <div className="eyebrow" style={{ fontSize: '0.6rem' }}>
                  Under
                </div>
                <div className="credit-name">Institution&rsquo;s Innovation Council</div>
              </div>

              <div
                ref={hintRef}
                className="eyebrow hero-scroll-cue"
                style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.6rem' }}
              >
                Scroll to explore
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 1,
                    height: 20,
                    background: 'linear-gradient(180deg, var(--mint), transparent)',
                    animation: 'float-y 2.2s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
