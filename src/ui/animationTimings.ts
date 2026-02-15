export const FEEDBACK_TIMINGS = {
  // Keep these aligned with CSS timing tokens in src/index.css:
  // --anim-trail-duration, --anim-discard-reveal-delay,
  // --anim-action-tag-duration, --anim-market-flash, --anim-gold-delta
  trailDurationMs: 920,
  discardPileRevealDelayMs: 920,
  actionTagDurationMs: 1100,
  marketFlashDurationMs: 900,
  goldDeltaDurationMs: 1200,
} as const;
