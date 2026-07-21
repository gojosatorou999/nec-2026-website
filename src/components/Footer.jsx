import { LINK_GROUPS, EVENT, NAV_LINKS } from '../data/site';
import {
  IdeaIncubatorLogo,
  IconLinkedIn,
  IconInstagram,
  IconGlobe,
} from './BrandLogo';

const ICONS = {
  linkedin: IconLinkedIn,
  instagram: IconInstagram,
  globe: IconGlobe,
};

/* Placeholder links: real URLs to be supplied, so these are inert and
   announced as unavailable rather than pretending to navigate. */
function SocialRow({ group }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: '0.6rem', marginBottom: 11 }}>
        {group.label}
      </div>
      <div style={{ display: 'flex', gap: 9 }}>
        {group.links.map((link) => {
          const Icon = ICONS[link.type];
          const isPlaceholder = link.href === '#';
          return (
            <a
              key={link.type}
              href={link.href}
              className="social-btn"
              aria-label={`${group.label} on ${link.label}${isPlaceholder ? ' (link coming soon)' : ''}`}
              aria-disabled={isPlaceholder || undefined}
              title={isPlaceholder ? `${link.label} — link coming soon` : link.label}
              target={isPlaceholder ? undefined : '_blank'}
              rel={isPlaceholder ? undefined : 'noreferrer noopener'}
              onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
            >
              <Icon />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        padding: 'clamp(56px, 8vw, 96px) clamp(20px, 6vw, 80px) clamp(30px, 4vw, 44px)',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div
          className="glass glass-sheen"
          style={{
            borderRadius: 'var(--r-2xl)',
            padding: 'clamp(28px, 4.5vw, 52px)',
          }}
        >
          {/* ── Top: identity + nav + links ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'clamp(28px, 4vw, 52px)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <IdeaIncubatorLogo size={46} />
                <div>
                  <div
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      fontSize: '1.06rem',
                      fontWeight: 600,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    {EVENT.name}
                  </div>
                  <div className="eyebrow" style={{ fontSize: '0.6rem', marginTop: 3 }}>
                    {EVENT.delegation}
                  </div>
                </div>
              </div>

              <p
                style={{
                  marginTop: 20,
                  maxWidth: 330,
                  fontSize: '0.9rem',
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                }}
              >
                Idea Incubator is MGIT&rsquo;s entrepreneurship body under the
                Institution&rsquo;s Innovation Council, representing the college at{' '}
                {EVENT.host}&rsquo;s National Entrepreneurship Challenge.
              </p>
            </div>

            <div>
              <div className="eyebrow" style={{ fontSize: '0.6rem', marginBottom: 13 }}>
                Sections
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="nav-link"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {LINK_GROUPS.map((g) => (
                <SocialRow key={g.id} group={g} />
              ))}
            </div>
          </div>

          <hr className="hairline" style={{ margin: 'clamp(28px, 4vw, 44px) 0 20px' }} />

          {/* ── Bottom bar ── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px 24px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="eyebrow" style={{ fontSize: '0.58rem' }}>
              © 2026 Idea Incubator · MGIT
            </span>
            <span className="eyebrow" style={{ fontSize: '0.58rem' }}>
              {EVENT.venue}
            </span>
          </div>
          <div
            style={{
              marginTop: 14,
              textAlign: 'center',
              fontSize: '0.6rem',
              color: 'var(--text-3)',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Built &amp; maintained by the{' '}
            <span style={{ color: 'var(--peri)' }}>Developers Team</span>
            {' '}· Idea Incubator, MGIT
          </div>
        </div>
      </div>
    </footer>
  );
}
