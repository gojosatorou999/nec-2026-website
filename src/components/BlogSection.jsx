import RedirectTile from './RedirectTile';

/* ═══════════════════════════════════════════════════════════════════════════
   BLOG SECTION — home-page teaser only.
   The full blog lives at /blog.html; this is the hand-off tile.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function BlogSection() {
  return (
    <RedirectTile
      id="blog"
      href="/blog.html"
      kicker="Blog"
      title={
        <>
          Stories from the <span className="gradient-text">NEC journey</span>
        </>
      }
      body="Read updates, insights and behind-the-scenes posts written by the
        Idea Incubator team as they prepare for and compete at NEC 2026, IIT Bombay."
      cta="Visit the blog"
      accent="var(--sky)"
      stats={[
        { value: '22', label: 'Delegates' },
        { value: '7', label: 'Teams' },
        { value: '2026', label: 'Edition' },
      ]}
    />
  );
}
