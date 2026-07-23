import { DEPARTMENTS, DELEGATES } from '../data/site';
import RedirectTile from './RedirectTile';

/* ═══════════════════════════════════════════════════════════════════════════
   DELEGATION — teaser only.
   The roster itself lives on its own page at /winners.html; this hands off
   with a real navigation rather than an anchor jump. Sits above the mentors
   so the members come before the faculty backing them.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function DelegationSection() {
  return (
    <RedirectTile
      id="delegation"
      href="/winners.html"
      kicker="The Delegation"
      title={
        <>
          Meet the <span className="gradient-text">{DELEGATES.length} winners</span>
        </>
      }
      body="Twenty-two students selected from across MGIT, split across seven teams.
        Check them out here."
      cta="View the winners"
      accent="var(--mint)"
      photo={{
        src: '/images/winners-1400.jpg',
        srcSet: '/images/winners-800.jpg 800w, /images/winners-1400.jpg 1400w',
        alt: `The ${DELEGATES.length} MGIT students selected for NEC 2026, outside MGIT`,
        width: 1400,
        height: 1050,
      }}
      stats={[
        { value: String(DELEGATES.length), label: 'Winners' },
        { value: String(DEPARTMENTS.length), label: 'Teams' },
        { value: '2026', label: 'Edition' },
      ]}
    />
  );
}
