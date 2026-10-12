'use strict';
const PATTERNS = Array.from({ length: 17 }, (_, index) => {
  const id = index + 1;
  const key = String(id).padStart(2, '0');
  return { id, images: Object.fromEntries(['none', 'first', 'all'].map(level => [level, `assets/patterns/${key}-${level}.png`])), audio: { starting: `assets/audio/${key}-starting.wav`, full: `assets/audio/${key}-full.wav` } };
});
