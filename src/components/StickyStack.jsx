import { Children, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   STICKY STACK
   ───────────────────────────────────────────────────────────────────────────
   A centred deck that holds still while it builds. The section pins, heading
   and all, and each card flies up from below to land on the pile — lifting the
   ones beneath it up and back so all three are visible at once as a stack.

   It has to be pinned. Driving this from the deck's viewport crossing meant
   the cards were still arriving while they slid past the fold, so the reveal
   happened below where anyone was looking. Pinning costs page height, but it
   is the only way to hold the deck centred while the animation plays.

   The pin is therefore sized to provably fit one screen: heading, deck and
   navbar clearance all budgeted, with a short-viewport fallback that drops the
   supporting line rather than letting a card overflow the frame.

   Card state is a pure function of scroll position, never accumulated, so
   scrolling up unstacks through exactly the states scrolling down stacked.
   ═══════════════════════════════════════════════════════════════════════════ */

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// How far each buried card peeks out above the one in front. The deck reserves
// headroom from this and the card count, so a four-card stack gets more room
// than a three-card one — with a fixed reservation the deepest card lifted
// straight out of the frame and got clipped.
const LIFT = 34;

export default function StickyStack({
  children,
  header = null,
  perCard = 26, // vh of scroll each card after the first gets to land in
  maxWidth = 900,
  minWidth = 861,
  // Only genuinely tiny windows drop the pin. Everything above this keeps the
  // stack and scales the deck to fit instead — see fitDeck().
  minHeight = 480,
  className = '',
}) {
  const rootRef = useRef(null);
  const items = Children.toArray(children);
  const count = items.length;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let enabled = false;

    const cards = () => Array.from(root.querySelectorAll(':scope .stack-item'));

    const clear = () => {
      cards().forEach((el) => {
        el.style.transform = '';
        el.style.opacity = '';
        el.style.filter = '';
      });
      const deck = root.querySelector(':scope .stack-deck');
      if (deck) {
        deck.style.transform = '';
        deck.style.marginBottom = '';
      }
    };

    /**
     * Scale the deck down to whatever room the pin actually has.
     *
     * The alternative was to drop the pin on short viewports, which silently
     * removed the stacking effect people had asked for. This keeps the stack
     * at every size and shrinks it to fit instead — the tallest card plus the
     * headroom the pile lifts into, measured against the space left after the
     * heading. Transforms don't affect layout, so the deck's box is pulled in
     * by the same amount to keep the flex centring honest.
     */
    const fitDeck = () => {
      const pin = root.querySelector(':scope .stack-pin');
      const deck = root.querySelector(':scope .stack-deck');
      const header = root.querySelector(':scope .stack-header');
      if (!pin || !deck) return;

      deck.style.transform = 'none';
      deck.style.marginBottom = '0px';

      const cs = getComputedStyle(pin);
      const avail =
        pin.clientHeight -
        parseFloat(cs.paddingTop) -
        parseFloat(cs.paddingBottom) -
        (header ? header.offsetHeight + (parseFloat(cs.rowGap) || 0) : 0);

      const need = deck.offsetHeight; // headroom + the tallest card
      if (need <= 0 || avail <= 0) return;

      const k = Math.min(1, avail / need);
      if (k < 0.999) {
        deck.style.transform = `scale(${k})`;
        deck.style.marginBottom = `${-need * (1 - k)}px`;
      } else {
        deck.style.transform = '';
        deck.style.marginBottom = '';
      }
    };

    const update = () => {
      raf = 0;
      const list = cards();
      if (!list.length) return;

      const rect = root.getBoundingClientRect();
      const scrollable = Math.max(1, root.offsetHeight - window.innerHeight);
      const p = clamp01(-rect.top / scrollable);

      // Card i lands over the i-th slice of the rail. Card 0 is the base of the
      // pile and is already down at p = 0, so the first slice belongs to card 1.
      // Dividing by 0.9 lands the last card just before the pin releases, so it
      // isn't still arriving as the section leaves.
      const span = Math.max(1, list.length - 1) / 0.9;
      const arrival = list.map((_, i) => easeOutCubic(clamp01(p * span - (i - 1))));

      for (let i = 0; i < list.length; i++) {
        const el = list[i];
        const t = arrival[i];

        // how much of the pile is sitting on top of this card
        let depth = 0;
        for (let j = i + 1; j < list.length; j++) depth += arrival[j];

        const enter = (1 - t) * 150; // rises into place from below
        const lift = depth * LIFT; // buried cards peek out above the front one
        el.style.transform = `translateY(${enter - lift}px) scale(${1 - depth * 0.055})`;
        // opacity leads the movement so a card is readable while it travels
        el.style.opacity = String(clamp01(t * 1.8));
        // floor is deliberately high — dimmed past ~0.6 the buried cards go so
        // dark they read as empty space rather than as a stack
        el.style.filter = `brightness(${Math.max(0.62, 1 - depth * 0.19)})`;
      }
    };

    const onScroll = () => {
      if (!enabled) return;
      if (!raf) raf = requestAnimationFrame(update);
    };

    const mq = window.matchMedia(
      `(min-width: ${minWidth}px) and (min-height: ${minHeight}px)`
    );
    const applyMode = () => {
      enabled = mq.matches;
      root.dataset.stacked = String(enabled);
      if (enabled) {
        fitDeck();
        update();
      } else {
        clear();
      }
    };

    const onResize = () => {
      if (enabled) fitDeck();
      onScroll();
    };

    applyMode();

    // Card height depends on the webfont, so refit once it lands — measuring
    // against fallback metrics leaves the scale slightly wrong.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (enabled) {
          fitDeck();
          update();
        }
      });
    }

    // Images inside cards (the mentor portraits) also change the height.
    const imgs = Array.from(root.querySelectorAll('img'));
    const onImg = () => enabled && (fitDeck(), update());
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener('load', onImg, { once: true });
    });

    mq.addEventListener('change', applyMode);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      mq.removeEventListener('change', applyMode);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      imgs.forEach((img) => img.removeEventListener('load', onImg));
    };
  }, [minWidth, minHeight, count]);

  return (
    <div
      ref={rootRef}
      className={`stack ${className}`}
      style={{
        '--stack-rail': `${100 + Math.max(0, count - 1) * perCard}svh`,
        '--stack-max': `${maxWidth}px`,
        // exactly the room the deepest card needs to lift into, plus a margin
        '--stack-headroom': `${Math.max(0, count - 1) * LIFT + 22}px`,
      }}
    >
      <div className="stack-pin">
        {header && <div className="stack-header">{header}</div>}

        <div className="stack-deck">
          {items.map((child, i) => (
            <div key={i} className="stack-item" style={{ zIndex: i + 1 }}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
