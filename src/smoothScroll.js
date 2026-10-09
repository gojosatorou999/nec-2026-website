import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/* ═══════════════════════════════════════════════════════════════════════════
   SMOOTH SCROLL
   ───────────────────────────────────────────────────────────────────────────
   Lenis interpolates mouse-wheel / trackpad input into one continuous glide,
   but still moves the *native* scroll position — so position: sticky, every
   window 'scroll' listener and IntersectionObserver keep working untouched.

   Touch is deliberately left native (syncTouch off). iOS and Android momentum
   scrolling runs on the compositor thread and is already the smoothest thing
   a phone can do; replaying it in JavaScript only adds latency.

   Imported once per page entry. Other modules reach the instance through
   `scrollToY` rather than calling window.scrollTo, so jumps glide too.
   ═══════════════════════════════════════════════════════════════════════════ */

let lenis = null;

const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (typeof window !== 'undefined' && !reduced) {
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.11, // lower = floatier; 0.1–0.12 reads as smooth without lag
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1,
    // Let scrollable panels (detail drawer, post modal, nav sheet) scroll
    // themselves instead of the page behind them.
    allowNestedScroll: true,
    // A dialog that locks the page sets body overflow:hidden — honour it,
    // otherwise Lenis would keep gliding the page underneath.
    virtualScroll: () => document.body.style.overflow !== 'hidden',
  });
  window.__lenis = lenis;
}

/** Scroll the page to `top`, gliding when smooth scroll is on. */
export function scrollToY(top, { immediate = false } = {}) {
  if (lenis) {
    // Re-measure first: Lenis clamps to the page height it last saw, which is
    // stale right after content mounts (e.g. the home sections appearing once
    // the intro sequence ends) — the jump would otherwise land at the top.
    lenis.resize();
    lenis.scrollTo(top, { immediate, duration: immediate ? 0 : 1.1 });
  } else {
    window.scrollTo({ top, behavior: immediate || reduced ? 'auto' : 'smooth' });
  }
}

export default lenis;
