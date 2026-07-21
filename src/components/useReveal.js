import { useEffect, useRef } from 'react';

/**
 * Adds `.is-in` to every `.reveal` descendant as it scrolls into view,
 * with an optional index-based stagger. One observer per section.
 */
export function useReveal(stagger = 45) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = Number(entry.target.dataset.revealIndex ?? 0);
          entry.target.style.transitionDelay = `${Math.min(i * stagger, 420)}ms`;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    targets.forEach((el, i) => {
      if (el.dataset.revealIndex === undefined) el.dataset.revealIndex = String(i);
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [stagger]);

  return ref;
}
