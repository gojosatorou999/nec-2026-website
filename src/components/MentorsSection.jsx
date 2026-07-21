import { useState } from 'react';
import { MENTORS } from '../data/site';
import { useReveal } from './useReveal';
import StickyStack from './StickyStack';

/* ═══════════════════════════════════════════════════════════════════════════
   MENTORS & LEADERSHIP
   Large glass cards with actual faculty photos for the people who back the
   club institutionally — the Principal, the coordinator, and the HOD of CSE.
   ═══════════════════════════════════════════════════════════════════════════ */

function MentorPhoto({ mentor }) {
  const [failed, setFailed] = useState(false);

  if (failed || !mentor.photo) {
    return (
      <div className="monogram" aria-hidden="true" style={{ '--accent': mentor.accent }}>
        {mentor.initials}
      </div>
    );
  }

  return (
    <div className="mentor-photo-wrap" style={{ '--accent': mentor.accent }}>
      <img
        src={mentor.photo}
        alt={mentor.name}
        className="mentor-photo"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function MentorsSection() {
  const revealRef = useReveal(90);

  return (
    <section
      id="mentors"
      ref={revealRef}
      style={{
        position: 'relative',
        padding: '0 clamp(20px, 6vw, 80px)',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* Heading is pinned with the deck so the frame stays full throughout */}
        <StickyStack
          header={
            <>
              <div className="eyebrow">Mentors &amp; Leadership</div>

              <h2
                style={{ marginTop: 16, fontSize: 'clamp(2rem, 4.6vw, 3.2rem)', fontWeight: 600 }}
              >
                The people <span className="gradient-text">behind the club</span>
              </h2>

              <p
                style={{
                  marginTop: 18,
                  fontSize: '1rem',
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                }}
              >
                Idea Incubator runs on student energy, but it stands on institutional
                support. These three made the NEC 2026 delegation possible.
              </p>
            </>
          }
        >
          {MENTORS.map((m) => (
            <article key={m.id} className="stack-card" style={{ '--accent': m.accent }}>
              {/* Photo + name header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <MentorPhoto mentor={m} />
                <div style={{ minWidth: 0 }}>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '0.63rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: m.accent,
                    }}
                  >
                    {m.org}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: '0.86rem',
                      color: 'var(--text-2)',
                      lineHeight: 1.4,
                    }}
                  >
                    {m.honorific}
                  </div>
                </div>
              </div>

              <h3
                style={{
                  fontSize: 'clamp(1.5rem, 2.6vw, 1.95rem)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                }}
              >
                {m.name}
              </h3>

              <hr className="hairline" />

              <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.78 }}>
                {m.body}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
                {m.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </StickyStack>
      </div>

      <style>{`
        .mentor-photo-wrap {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid color-mix(in srgb, var(--accent) 40%, transparent);
          box-shadow: 0 0 14px -4px color-mix(in srgb, var(--accent) 50%, transparent);
        }
        .mentor-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
        }
      `}</style>
    </section>
  );
}
