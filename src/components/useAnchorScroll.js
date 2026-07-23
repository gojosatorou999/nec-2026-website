import { useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   ANCHOR SCROLL
   ───────────────────────────────────────────────────────────────────────────
   In-page links have to land somewhere the section is actually *showing*.

   The redirect tiles are pinned rails: the tile is invisible at the very top
   of its rail and only fades in once you have scrolled a little way into it.
   A plain `#delegation` jump therefore landed on a blank screen and the user
   had to nudge the wheel before anything appeared. Same for `#about`.

   So instead of aligning to the top of the section, a jump into a pinned rail
   lands at the point along it where the content has settled. Ordinary sections
   still align to the top, just clear of the fixed navbar.
   ═══════════════════════════════════════════════════════════════════════════ */

// how far into a pinned rail to land: past the entrance, before the exit
const RAIL_LANDING = 0.42;
const NAV_CLEARANCE = 92;

function targetFor(el) {
  const vh = window.innerHeight;
  const top = el.getBoundingClientRect().top + window.scrollY;

  // The rail is either the section itself (redirect tiles) or a .stack inside.
  const rail = el.classList.contains('redirect-rail')
    ? el
    : el.querySelector('.redirect-rail, .stack');

  if (rail) {
    const railTop = rail.getBoundingClientRect().top + window.scrollY;
    const scrollable = rail.offsetHeight - vh;
    if (scrollable > vh * 0.2) return railTop + scrollable * RAIL_LANDING;
  }

  return Math.max(0, top - NAV_CLEARANCE);
}

export function useAnchorScroll() {
  useEffect(() => {
    const onClick = (e) => {
      // let modified clicks (new tab, etc.) behave normally
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;

      const link = e.target.closest?.('a[href^="#"]');
      if (!link) return;

      const id = link.getAttribute('href').slice(1);
      if (!id) return;

      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: targetFor(el), behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${id}`);
    };

    // A page loaded with a hash has the same problem, and the browser has
    // already jumped by the time this runs — so correct it once mounted.
    const onLoad = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el) window.scrollTo({ top: targetFor(el), behavior: 'auto' });
    };
    const t = setTimeout(onLoad, 60);

    document.addEventListener('click', onClick);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', onClick);
    };
  }, []);
}
