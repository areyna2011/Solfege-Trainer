'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const levels = ['none', 'first', 'all'];
  const storageKey = 'mr-reyna-solfege-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (_) { /* Storage is optional. */ }
  const state = {
    enabled: new Set(Array.isArray(saved.enabled) ? saved.enabled.filter(id => Number.isInteger(id) && id >= 1 && id <= 17) : PATTERNS.map(p => p.id)),
    order: saved.order === 'sequential' ? 'sequential' : 'random',
    support: levels.includes(saved.support) ? saved.support : 'none',
    seconds: Number.isInteger(saved.seconds) && saved.seconds >= 1 && saved.seconds <= 30 ? saved.seconds : 5,
    mode: 'practice', phase: 'idle', current: null, revealed: 'none', loading: false, imageFailed: false
  };
  let timer = null;
  let roundToken = 0;
  let imageToken = 0;
  let audioToken = 0;
  let audio = null;
  let countdown = 0;

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ enabled: [...state.enabled], order: state.order, support: state.support, seconds: state.seconds })); } catch (_) { /* Continue in private/restricted browsers. */ }
  }
  function error(message = '') { $('error').textContent = message; $('error').hidden = !message; }
  function stopAudio() {
    audioToken++;
    if (audio) { audio.pause(); audio.currentTime = 0; audio = null; }
    $('starting').removeAttribute('aria-pressed');
    $('full').removeAttribute('aria-pressed');
  }
  function cancelRound() { clearInterval(timer); timer = null; roundToken++; }
  function chooseNext() {
    const ids = [...state.enabled].sort((a, b) => a - b);
    if (!ids.length) return null;
    if (state.order === 'sequential') return ids.find(id => id > (state.current || 0)) || ids[0];
    const candidates = ids.length > 1 ? ids.filter(id => id !== state.current) : ids;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  function setMessage(heading, copy) {
    $('stage-heading').textContent = heading;
    $('stage-copy').textContent = copy;
  }
  function update() {
    const empty = state.current === null;
    const locked = state.mode === 'audiation' && ['preparing', 'viewing', 'hidden'].includes(state.phase);
    const concealed = state.mode === 'audiation' && state.phase !== 'viewing' && state.phase !== 'revealed';
    $('score').hidden = empty || concealed || state.loading || state.imageFailed;
    $('stage-message').hidden = !$('score').hidden;
    if (empty) setMessage('Choose a pattern', 'Open Teacher settings and select at least one pattern.');
    else if (state.imageFailed) setMessage('Notation unavailable', 'Try the next pattern or check the local image files.');
    else if (state.loading || state.phase === 'preparing') setMessage('Getting the pattern ready…', '');
    else if (state.phase === 'hidden') setMessage('Sing the pattern from memory', 'Hear it in your head, then sing it aloud.');
    else if (concealed) setMessage('Ready to audiate?', `Study the pattern for ${state.seconds} ${state.seconds === 1 ? 'second' : 'seconds'}, then sing from memory.`);
    $('pattern-label').textContent = empty ? 'No patterns selected' : `Pattern ${state.current} / 17`;
    $('score-stage').setAttribute('aria-busy', String(state.loading));
    let status = 'Read the pattern, then sing.';
    if (empty) status = 'Select patterns to begin.';
    else if (state.mode === 'audiation') {
      status = state.phase === 'viewing' ? `Look and listen inside · ${countdown} ${countdown === 1 ? 'second' : 'seconds'} left` : state.phase === 'hidden' ? 'When you are ready, reveal the pattern to check.' : state.phase === 'revealed' ? 'Check your singing against the original pattern.' : 'Press Start audiation when your class is ready.';
    } else if (state.revealed === 'all') status = 'All syllables revealed. Sing the complete pattern.';
    if ($('lesson-status').textContent !== status) $('lesson-status').textContent = status;
    for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
    for (const button of document.querySelectorAll('[data-support]')) {
      button.setAttribute('aria-pressed', String(button.dataset.support === state.support));
      button.disabled = locked;
    }
    for (const id of ['starting', 'full', 'next']) $(id).disabled = empty;
    $('next').disabled = empty || state.enabled.size < 2;
    $('reveal-syllables').hidden = state.mode !== 'practice';
    $('reveal-syllables').disabled = empty || state.loading || state.imageFailed || state.revealed === 'all';
    $('reveal-syllables').textContent = state.revealed === 'all' ? 'All syllables shown' : state.revealed === 'first' ? 'Reveal all syllables' : 'Reveal syllables';
    $('audiation-controls').hidden = state.mode !== 'audiation';
    $('support-hint').hidden = state.mode === 'audiation';
    $('start-round').disabled = empty || state.loading || state.phase === 'preparing';
    $('start-round').textContent = state.phase === 'viewing' || state.phase === 'hidden' ? 'Restart audiation' : 'Start audiation';
    $('reveal-pattern').hidden = !['viewing', 'hidden'].includes(state.phase);
    $('seconds').disabled = locked;
    $('selection-summary').textContent = `${state.enabled.size} ${state.enabled.size === 1 ? 'pattern' : 'patterns'} · ${state.order === 'random' ? 'Random' : 'Sequential'}`;
    $('order').value = state.order;
    for (const input of document.querySelectorAll('[data-pattern]')) input.checked = state.enabled.has(Number(input.dataset.pattern));
  }
  async function loadScore() {
    const token = ++imageToken;
    if (state.current === null) { state.loading = false; update(); return false; }
    state.loading = true;
    state.imageFailed = false;
    update();
    const pattern = PATTERNS[state.current - 1];
    const level = state.revealed;
    const image = new Image();
    const loaded = await new Promise(resolve => {
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = pattern.images[level];
    });
    if (token !== imageToken) return false;
    state.loading = false;
    state.imageFailed = !loaded;
    if (loaded) {
      $('score').src = image.src;
      $('score').alt = `Pattern ${pattern.id} musical notation, ${level === 'none' ? 'no syllables' : level === 'first' ? 'first syllable shown' : 'all syllables shown'}`;
    } else error('The notation image could not be loaded. Check that the assets folder is included with the app.');
    update();
    return loaded;
  }
  function draw() {
    cancelRound(); stopAudio(); error();
    state.current = chooseNext();
    state.phase = 'idle';
    state.revealed = state.support;
    loadScore();
  }
  async function play(role) {
    if (state.current === null) return;
    stopAudio(); error();
    const token = audioToken;
    const player = new Audio(PATTERNS[state.current - 1].audio[role]);
    audio = player;
    $(role).setAttribute('aria-pressed', 'true');
    player.addEventListener('ended', () => { if (token === audioToken) stopAudio(); });
    try { await player.play(); }
    catch (_) { if (token === audioToken) { stopAudio(); error('The recording could not play. Try again and check that the local audio files are available.'); } }
  }
  function readSeconds() {
    const value = Number($('seconds').value);
    state.seconds = Math.max(1, Math.min(30, Number.isFinite(value) && value > 0 ? Math.round(value) : 5));
    $('seconds').value = state.seconds;
    save();
  }
  async function startRound() {
    if (state.current === null) return;
    cancelRound(); stopAudio(); error(); readSeconds();
    const token = roundToken;
    state.phase = 'preparing'; state.revealed = state.support;
    const loaded = await loadScore();
    if (token !== roundToken) return;
    if (!loaded) { state.phase = 'idle'; update(); return; }
    state.phase = 'viewing'; countdown = state.seconds;
    const deadline = performance.now() + state.seconds * 1000;
    update();
    timer = setInterval(() => {
      countdown = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      if (countdown === 0) { cancelRound(); state.phase = 'hidden'; }
      update();
    }, 100);
  }
  function changeSelection() {
    save(); cancelRound(); stopAudio(); error(); state.phase = 'idle'; state.revealed = state.support;
    if (!state.enabled.has(state.current)) state.current = chooseNext();
    loadScore();
  }
  $('pattern-grid').replaceChildren(...PATTERNS.map(pattern => {
    const label = document.createElement('label'); label.className = 'pattern-option';
    const title = document.createElement('span'); title.className = 'option-title';
    const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.pattern = pattern.id;
    input.checked = state.enabled.has(pattern.id);
    input.addEventListener('change', () => { input.checked ? state.enabled.add(pattern.id) : state.enabled.delete(pattern.id); changeSelection(); });
    title.append(input, document.createTextNode(`Pattern ${pattern.id}`));
    const image = document.createElement('img'); image.src = pattern.images.none; image.alt = ''; image.loading = 'lazy';
    label.append(title, image); return label;
  }));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    if (state.mode === button.dataset.mode) return;
    cancelRound(); stopAudio(); error(); state.mode = button.dataset.mode; state.phase = 'idle'; state.revealed = state.support; loadScore();
  }));
  document.querySelectorAll('[data-support]').forEach(button => button.addEventListener('click', () => {
    state.support = button.dataset.support; state.revealed = state.support; save(); error(); loadScore();
  }));
  $('reveal-syllables').addEventListener('click', () => { state.revealed = levels[Math.min(2, levels.indexOf(state.revealed) + 1)]; error(); loadScore(); });
  $('next').addEventListener('click', draw);
  $('starting').addEventListener('click', () => play('starting'));
  $('full').addEventListener('click', () => play('full'));
  $('start-round').addEventListener('click', startRound);
  $('reveal-pattern').addEventListener('click', () => { cancelRound(); state.phase = 'revealed'; update(); });
  $('seconds').value = state.seconds;
  $('seconds').addEventListener('change', () => { readSeconds(); update(); });
  $('order').addEventListener('change', () => { state.order = $('order').value; save(); update(); });
  $('select-all').addEventListener('click', () => { state.enabled = new Set(PATTERNS.map(p => p.id)); changeSelection(); });
  $('clear-all').addEventListener('click', () => { state.enabled.clear(); changeSelection(); });
  $('fullscreen').hidden = !document.fullscreenEnabled;
  $('fullscreen').addEventListener('click', async () => {
    try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); }
    catch (_) { error('Full screen is unavailable in this browser.'); }
  });
  document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAudio();
      if (['viewing', 'preparing'].includes(state.phase)) { cancelRound(); state.phase = 'hidden'; update(); }
    }
  });
  const backgroundMusic = $('background-music');
  backgroundMusic.volume = 0.35;
  $('repeat-music').addEventListener('click', () => {
    backgroundMusic.loop = !backgroundMusic.loop;
    $('repeat-music').setAttribute('aria-pressed', String(backgroundMusic.loop));
  });
  backgroundMusic.addEventListener('error', () => { $('music-error').hidden = false; });
  backgroundMusic.addEventListener('playing', () => { $('music-error').hidden = true; });
  window.addEventListener('pagehide', () => { cancelRound(); stopAudio(); backgroundMusic.pause(); });
  draw();
})();
