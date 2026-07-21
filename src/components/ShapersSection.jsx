import { SHAPERS } from '../data/site';
import { useReveal } from './useReveal';
import StickyStack from './StickyStack';

/* ═══════════════════════════════════════════════════════════════════════════
   THE SHAPERS
   Varun, Nivas, Vaishnavi and Balaji — deliberately separated from the 25
   delegates and placed last, as the people who built the club and ran the
   NEC 2026 campaign rather than as part of the selected cohort.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ShapersSection() {
  const revealRef = useReveal(80);

  return (
    <section
      id="shapers"
      ref={revealRef}
      style={{
        position: 'relative',
        padding: '0 clamp(20px, 6vw, 80px)',
      }}
    >
      {/* Soft radial lift so this closing section feels like a destination */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(70% 55% at 50% 0%, rgba(163,178,255,0.09), transparent 72%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto' }}>
        {/* Heading is pinned with the deck so the frame stays full throughout */}
        <StickyStack
          header={
            <>
              <div className="eyebrow">The Shapers</div>

              <h2
                style={{ marginTop: 16, fontSize: 'clamp(2rem, 4.6vw, 3.2rem)', fontWeight: 600 }}
              >
                Who <span className="gradient-text">built this</span>
              </h2>

              <p
                style={{
                  marginTop: 18,
                  fontSize: '1rem',
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                }}
              >
                Before there was a delegation, there was a club to run and a campaign to
                make happen. These four hold Idea Incubator together and drove NEC 2026 at
                MGIT.
              </p>
            </>
          }
        >
          {SHAPERS.map((s) => (
            <article key={s.id} className="stack-card" style={{ '--accent': s.accent }}>
              <div className="monogram" aria-hidden="true">
                {s.initials}
              </div>

              <div>
                <h3 style={{ fontSize: '1.42rem', fontWeight: 600, lineHeight: 1.2 }}>
                  {s.name}
                </h3>
                <div
                  style={{
                    marginTop: 9,
                    fontSize: '0.83rem',
                    color: s.accent,
                    lineHeight: 1.5,
                  }}
                >
                  {s.role}
                </div>
              </div>

              <hr className="hairline" />

              <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', lineHeight: 1.75 }}>
                {s.body}
              </p>
            </article>
          ))}
        </StickyStack>
      </div>
    </section>
  );
}
