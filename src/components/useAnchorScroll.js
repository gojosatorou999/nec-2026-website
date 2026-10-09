import { useEffect } from 'react';
import { scrollToY } from '../smoothScroll';

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
      scrollToY(targetFor(el));
      history.replaceState(null, '', `#${id}`);
    };

    // A page loaded with a hash (/#mentors, e.g. from another page's nav) has
    // the same problem. On the home page the sections only mount once the
    // intro sequence finishes, so wait for the target to exist, then let the
    // layout settle for a frame before jumping to it.
    let observer = null;
    let t = 0;
    const onLoad = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const jump = (el) => requestAnimationFrame(() => scrollToY(targetFor(el), { immediate: true }));
      const el = document.getElementById(id);
      if (el) return jump(el);
      observer = new MutationObserver(() => {
        const found = document.getElementById(id);
        if (!found) return;
        observer.disconnect();
        observer = null;
        jump(found);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };
    t = setTimeout(onLoad, 60);

    document.addEventListener('click', onClick);
    return () => {
      clearTimeout(t);
      observer?.disconnect();
      document.removeEventListener('click', onClick);
    };
  }, []);
}
