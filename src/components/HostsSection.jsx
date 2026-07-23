import { HOSTS } from '../data/site';
import { useReveal } from './useReveal';
import StickyStack from './StickyStack';

/* ═══════════════════════════════════════════════════════════════════════════
   THE HOSTS
   Varun, Balaji and Nivas — deliberately separated from the 22 winners and
   placed last, as the people hosting NEC 2026 at MGIT rather than as part of
   the selected cohort.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function HostsSection() {
  const revealRef = useReveal(80);

  return (
    <section
      id="hosts"
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
              <div className="eyebrow">The Hosts</div>

              <h2
                style={{ marginTop: 16, fontSize: 'clamp(2rem, 4.6vw, 3.2rem)', fontWeight: 600 }}
              >
                Who <span className="gradient-text">runs this</span>
              </h2>

              <p
                style={{
                  marginTop: 18,
                  fontSize: '1rem',
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                }}
              >
                Before there was a delegation, there was a campaign to make happen. These
                three host NEC 2026 at MGIT and lead Idea Incubator.
              </p>
            </>
          }
        >
          {HOSTS.map((s) => (
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
