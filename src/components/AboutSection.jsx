import RedirectTile from './RedirectTile';

/* ═══════════════════════════════════════════════════════════════════════════
   ABOUT — teaser only.
   The explainer used to be three cards here, duplicating what /about.html
   already covers. This is now a single hand-off tile; the four bodies behind
   NEC 2026 are told properly on that page.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AboutSection() {
  return (
    <RedirectTile
      id="about"
      href="/about.html"
      kicker="About"
      title={
        <>
          The four bodies <span className="gradient-text">behind NEC 2026</span>
        </>
      }
      body="The competition, the host, the council it runs under, and the club sending
        twenty-two people to Powai. Read how NEC, E-Cell IIT Bombay, the Institution’s
        Innovation Council and Idea Incubator fit together."
      cta="Read about us"
      accent="var(--peri)"
      stats={[
        { value: '4', label: 'Bodies' },
        { value: '6', label: 'Months' },
        { value: '2026', label: 'Edition' },
      ]}
    />
  );
}
