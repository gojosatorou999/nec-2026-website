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
      body="Selected from MGIT and the Idea Incubator cohort, split across the club’s
        seven teams.Check them out here."
      cta="View the winners"
      accent="var(--mint)"
      stats={[
        { value: String(DELEGATES.length), label: 'Winners' },
        { value: String(DEPARTMENTS.length), label: 'Teams' },
        { value: '2026', label: 'Edition' },
      ]}
    />
  );
}
