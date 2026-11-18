import { words, wordById, wordKey, relatedById } from './words.js';
import { backup, createProfile, editProgress, getProgress, loadProfiles, mix, parseBackup, recordDay, saveProfiles } from './progress.js';
import { speak, stopSpeech, speechAvailable } from './speech.js';
import { button, icon, iconButton, escape } from './ui.js';
import { achievements, autoView, bankView, challengeView, counts, filterPills, nav, progressView, resultsView, studyView } from './views.js';

const $ = (selector) => document.querySelector(selector);
const main = $('#main');
const dialog = $('#dialog');
const all = words.map((word) => word.id);
const profiles = loadProfiles();
const profile = () => profiles.profiles.find((item) => item.id === profiles.active);
const newBank = () => ({ query: '', source: 'all', status: 'all', sort: 'az', selected: new Set(), limit: 24 });
const newPlayer = () => ({ ids: [], index: 0, pool: 'all', playing: false, hasPlayed: false, finished: false,
  timer: 0, run: 0, elapsed: 0, started: 0, audioNote: '', needsAudio: true });
const newGame = () => ({ stage: 'setup', pool: 'all', length: '10', strict: false, ids: [], index: 0, answers: [],
  hint: false, audioNote: '' });
let bank = newBank();
let player = newPlayer();
let game = newGame();
let view;
let studyId = 'hemisphere';
let studyQueue = all;
let toastTimer;
let storageWarning = false;

function toast(message) {
  const node = $('#toast');
  clearTimeout(toastTimer);
  node.textContent = message;
  node.classList.add('visible');
  toastTimer = setTimeout(() => node.classList.remove('visible'), 3700);
}

function save() {
  if (!saveProfiles(profiles) && !storageWarning) {
    storageWarning = true;
    toast('Browser storage is unavailable. Export a backup to keep your progress.');
  }
}

function pool(group) {
  if (group === 'all') return all;
  if (group === 'selected') return [...bank.selected];
  if (group.startsWith('set:')) return profile().sets.find((s) => s.id === group.slice(4))?.words.filter((id) => wordById.has(id)) ?? [];
  return words.filter((w) => {
    const p = getProgress(profile(), w.id);
    if (group === 'highlighted') return w.highlighted;
    return group === 'difficult' ? p.difficult : p.status === group;
  }).map((w) => w.id);
}

function filtered() {
  const query = wordKey(bank.query);
  const allowed = new Set(pool(bank.status));
  const ids = words.filter((w) => allowed.has(w.id) &&
    (bank.source === 'all' || bank.source === w.source) &&
    (!query || w.id.includes(query) || w.variants.some((variant) => wordKey(variant).includes(query)))).map((w) => w.id);
  return bank.sort === 'za' ? ids.reverse() : ids;
}

function drawSelection(ids = filtered()) {
  const node = $('#selection-bar');
  node.hidden = !bank.selected.size;
  node.innerHTML = bank.selected.size ? `<strong>${bank.selected.size} selected</strong><div class="buttons">
    ${button('Select all results', 'select-results', { kind: 'quiet', disabled: ids.every((id) => bank.selected.has(id)) })}
    ${button('Review selection', 'review-selection', { icon: 'play' })}
    ${button('Save as study set', 'save-set', { icon: 'plus', kind: 'primary' })}
    ${iconButton('Clear selection', 'clear-selection', 'close')}</div>` : '';
}

function drawResults() {
  const ids = filtered();
  $('#word-results').innerHTML = resultsView(ids, bank, profile());
  $('#bank-count').textContent = ids.length + (ids.length === 1 ? ' word' : ' words');
  $('#bank-filters').innerHTML = filterPills(bank.status);
  document.querySelectorAll('.stat[data-value]').forEach((item) =>
    item.setAttribute('aria-pressed', String(item.dataset.value === bank.status)));
  drawSelection(ids);
}

function drawShell() {
  document.title = 'Spelling Bee · ' + nav.find(([id]) => id === view)[1];
  $('#navigation').innerHTML = nav.map(([id, label, symbol]) =>
    `<a href="#${id}"${id === view ? ' aria-current="page"' : ''}>${icon(symbol, 18)}<span>${label}</span></a>`).join('');
  const name = profile().name;
  $('#profile-button').innerHTML = `<span class="avatar">${escape(Array.from(name)[0].toUpperCase())}</span>
    <span class="profile-name">${escape(name)}</span>${icon('chevron', 15)}`;
  $('#profile-button').setAttribute('aria-label', 'Profiles · ' + name);
}

function render() {
  const p = profile();
  if (view === 'bank') {
    main.innerHTML = bankView(bank, p);
    drawResults();
  } else if (view === 'study') main.innerHTML = studyView(wordById.get(studyId), studyQueue, p);
  else if (view === 'auto') main.innerHTML = autoView(player, p, bank.selected.size);
  else if (view === 'challenge') main.innerHTML = challengeView(game, p, bank.selected.size, pool(game.pool).length);
  else main.innerHTML = progressView(p);
}

function focusAction(action) {
  $('[data-action="' + action + '"]:not(:disabled)')?.focus({ preventScroll: true });
}

function go(route) {
  if (location.hash === '#' + route) onRoute(false);
  else location.hash = route;
}

function onRoute(focus = true) {
  if (location.hash === '#main' && view) {
    history.replaceState(null, '', '#' + (view === 'study' ? 'study/' + studyId : view));
    main.focus();
    return;
  }
  const previous = view;
  const previousWord = studyId;
  const [route, id] = location.hash.slice(1).split('/');
  view = nav.some(([key]) => key === route) ? route : 'bank';
  if (previous !== view) {
    pause();
    if (dialog.open) dialog.close();
  }
  if (view === 'study') {
    if (wordById.has(id)) studyId = id;
    if (!studyQueue.includes(studyId)) studyQueue = all;
    if (previous !== view || studyId !== previousWord || !getProgress(profile(), studyId).studied) {
      stopSpeech();
      markStudied(studyId);
      if (profile().prefs.autoSpeak) say(studyId);
    }
  }
  if (view === 'auto' && previous !== view) buildReview();
  drawShell();
  render();
  if (focus) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

function markStudied(id) {
  editProgress(profile(), id, { studied: true });
  recordDay(profile());
  save();
}

function switchProfile(id) {
  pause();
  profiles.active = id;
  bank = newBank();
  player = newPlayer();
  game = newGame();
  studyId = 'hemisphere';
  studyQueue = all;
  if (dialog.open) dialog.close();
  save();
  if (view === 'study') {
    history.replaceState(null, '', '#study');
    markStudied(studyId);
  }
  if (view === 'auto') buildReview();
  drawShell();
  render();
  $('#profile-button').focus({ preventScroll: true });
}

function openDialog(title, content) {
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${title}</h2>${iconButton('Close dialog', 'close', 'close')}</div>${content}`;
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('[autofocus]')?.focus();
}

function showProfiles() {
  openDialog('Profiles', `<p>Pick a speller. Each profile keeps its own progress and study sets.</p>
    <div class="profile-list">${profiles.profiles.map((p) => `<button class="profile-choice" type="button" data-action="switch-profile" data-value="${escape(p.id)}">
      <span class="avatar">${escape(Array.from(p.name)[0].toUpperCase())}</span><span>${escape(p.name)}</span>${p.id === profiles.active ? icon('check', 18) : ''}</button>`).join('')}</div>
    <form id="profile-form" class="dialog-form"><label for="profile-name">New profile name</label>
      <div class="buttons"><input id="profile-name" maxlength="28" placeholder="First name or nickname" required>
        <button class="btn primary" type="submit">${icon('plus', 18)} Add profile</button></div></form>
    <div class="dialog-footer buttons">${button('Export backup', 'export', { icon: 'download' })}${button('Import backup', 'import', { icon: 'upload' })}</div>`);
}

function showSets() {
  const sets = profile().sets;
  openDialog('My study sets', sets.length ? `<ul class="plain-list set-list">${sets.map((set) => `<li>
    <span><strong>${escape(set.name)}</strong><small>${pool('set:' + set.id).length} words</small></span>
    ${button('Study', 'set-study', { value: set.id, icon: 'book' })}
    ${iconButton('Review ' + set.name, 'set-auto', 'play', set.id)}
    ${iconButton('Delete ' + set.name, 'ask-delete', 'trash', set.id)}</li>`).join('')}</ul>`
    : '<p>Select words in the Word Bank, then choose “Save as study set.”</p>');
}

function showSaveSet() {
  openDialog('Save a study set', `<p>Give these ${bank.selected.size} selected words a name.</p>
    <form id="set-form" class="dialog-form"><label for="set-name">Set name</label>
      <input id="set-name" maxlength="40" placeholder="Friday practice" required autofocus>
      <button class="btn primary" type="submit">${icon('check', 18)} Save set</button></form>`);
}

function related(id) {
  if (wordById.has(id)) return go('study/' + id);
  const word = relatedById.get(id);
  if (word) openDialog(escape(word.word), `<p>/${escape(word.ipa)}/ · ${escape(word.part)}</p>
    <p>${escape(word.definition)}</p>${button('Hear pronunciation', 'speak-word', { value: id, icon: 'audio', disabled: !speechAvailable })}`);
}

function celebrate(message) {
  toast(message);
  const burst = document.createElement('div');
  burst.className = 'celebration';
  burst.setAttribute('aria-hidden', 'true');
  burst.innerHTML = Array.from({ length: 14 }, (_, i) =>
    `<i style="--i:${i};--angle:${i * 360 / 14}deg">${icon('star', 18)}</i>`).join('');
  document.body.append(burst);
  setTimeout(() => burst.remove(), 1050);
}

function changeStudy(action, changes, message) {
  const p = profile();
  const before = counts(p);
  editProgress(p, studyId, changes);
  markStudied(studyId);
  const after = counts(p);
  render();
  focusAction(action);
  const earned = achievements.find((a) => a.value(before, p) < a.goal && a.value(after, p) >= a.goal);
  if (earned) celebrate('Badge earned · ' + earned.title);
  else if (after.mastered > before.mastered) celebrate(message);
  else toast(message);
}

const noAudio = 'No voice could play. Check your device’s speech settings and try again.';
const pronounce = (word) => speak(word.word, profile().prefs.rate, word.id === 'romerillo' ? 'es' : 'en-US');

async function say(id) {
  const word = wordById.get(id) ?? relatedById.get(id);
  if (word && await pronounce(word) === 'unavailable') toast(noAudio);
}

function audioStatus(mode, session, result) {
  if (result === 'canceled') return;
  session.audioNote = result === 'unavailable' ? noAudio : '';
  const node = $('#' + mode + '-audio-status');
  if (node) node.textContent = session.audioNote;
}

function buildReview() {
  const ids = pool(player.pool);
  Object.assign(player, { ids: profile().prefs.shuffle ? mix(ids) : [...ids], index: 0, elapsed: 0,
    needsAudio: true, finished: false, hasPlayed: false, audioNote: '' });
}

function duration() {
  const prefs = profile().prefs;
  return 1000 * (prefs.interval === 'custom' ? prefs.custom : Number(prefs.interval));
}

function drawPlayer() {
  const stage = $('#player');
  const fragment = document.createElement('template');
  fragment.innerHTML = autoView(player, profile(), bank.selected.size);
  stage.innerHTML = fragment.content.querySelector('#player').innerHTML;
  const bar = stage.querySelector('.player-progress span');
  const ms = duration();
  const elapsed = Math.min(ms, player.elapsed);
  bar.style.width = 100 * elapsed / ms + '%';
  if (player.playing && elapsed < ms) requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!bar.isConnected || !player.playing) return;
    bar.style.transitionDuration = (ms - elapsed) + 'ms';
    bar.style.width = '100%';
  }));
}

function pause() {
  if (player.playing) player.elapsed = Math.min(duration(), player.elapsed + performance.now() - player.started);
  player.playing = false;
  player.run++;
  clearTimeout(player.timer);
  stopSpeech();
}

async function tick() {
  const session = player;
  const word = wordById.get(session.ids[session.index]);
  if (!word) return;
  const run = ++session.run;
  const stillPlaying = () => player === session && session.run === run && session.playing && view === 'auto';
  const focused = document.activeElement?.dataset.action;
  session.playing = true;
  session.hasPlayed = true;
  session.started = performance.now();
  drawPlayer();
  if (focused) focusAction(focused);
  markStudied(word.id);
  if (session.needsAudio) {
    const result = await pronounce(word);
    if (!stillPlaying()) return;
    session.needsAudio = false;
    audioStatus('player', session, result);
  }
  session.timer = setTimeout(() => {
    if (!stillPlaying()) return;
    if (session.index + 1 === session.ids.length && !profile().prefs.repeat) {
      pause();
      session.finished = true;
      session.elapsed = duration();
      const note = $('#player-audio-status');
      if (!session.audioNote) note.textContent = 'Review complete!';
      drawPlayer();
      focusAction('auto-toggle');
      return;
    }
    session.index = (session.index + 1) % session.ids.length;
    session.elapsed = 0;
    session.needsAudio = true;
    tick();
  }, Math.max(0, duration() - session.elapsed - (performance.now() - session.started)));
}

function movePlayback(index) {
  if (!player.ids.length) return;
  const playing = player.playing;
  pause();
  player.index = (index + player.ids.length) % player.ids.length;
  Object.assign(player, { elapsed: 0, needsAudio: true, finished: false });
  if (playing) tick();
  else drawPlayer();
}

function refreshPlayback(rebuild = false) {
  const playing = player.playing;
  pause();
  if (rebuild) buildReview();
  player.elapsed = 0;
  player.needsAudio = true;
  save();
  render();
  if (playing) tick();
}

async function challengeAudio(kind) {
  const session = game;
  const index = game.index;
  const word = wordById.get(game.ids[index]);
  if (!word) return;
  const result = kind === 'word' ? await pronounce(word) : await speak(word[kind], profile().prefs.rate);
  if (session === game && index === game.index && view === 'challenge' && session.stage === 'play') audioStatus('challenge', session, result);
}

function startChallenge() {
  const ids = mix(pool(game.pool));
  if (!ids.length || !speechAvailable) return;
  Object.assign(game, { stage: 'play', ids: game.length === 'all' ? ids : ids.slice(0, Number(game.length)),
    index: 0, answers: [], hint: false, audioNote: '' });
  render();
  $('#answer')?.focus({ preventScroll: true });
  challengeAudio('word');
}

function submitAnswer(typed) {
  if (game.stage !== 'play' || game.answers[game.index]) return;
  const word = wordById.get(game.ids[game.index]);
  const correct = [word.word, ...word.variants].some((candidate) => wordKey(candidate) === wordKey(typed));
  const p = profile();
  const entry = getProgress(p, word.id);
  const wins = counts(p).wins;
  editProgress(p, word.id, { studied: true, attempts: entry.attempts + 1, correct: entry.correct + Number(correct),
    trickyWin: entry.trickyWin || (entry.difficult && correct), status: entry.status === 'new' ? 'learning' : entry.status });
  recordDay(p);
  p.attempts++;
  p.correct += Number(correct);
  save();
  game.answers.push({ id: word.id, correct, typed });
  render();
  focusAction('challenge-next');
  if (wins < 5 && counts(p).wins >= 5) celebrate('Badge earned · Difficult Word Champion');
}

function finishChallenge() {
  stopSpeech();
  game.completed = game.answers.length === game.ids.length;
  if (game.completed && game.answers.every((a) => a.correct)) {
    const first = !profile().perfect;
    profile().perfect = true;
    save();
    celebrate(first ? 'Badge earned · Perfect Spelling Round' : 'Perfect round!');
  }
  game.stage = game.answers.length ? 'results' : 'setup';
  render();
  main.focus({ preventScroll: true });
}

function markMisses(ids) {
  ids.forEach((id) => editProgress(profile(), id, { difficult: true }));
  save();
  render();
  focusAction('challenge-next');
  toast(ids.length === 1 ? 'Added to your Difficult words.' : 'Missed words added to your Difficult collection.');
}

function exportBackup() {
  const url = URL.createObjectURL(new Blob([backup(profiles)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'spelling-bee-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Progress backup downloaded.');
}

const actions = {
  'status-filter': (value) => {
    bank.status = value;
    bank.limit = 24;
    drawResults();
    $('#bank-filters [data-value="' + value + '"]').focus({ preventScroll: true });
    $('#word-bank').scrollIntoView({ block: 'nearest' });
  },
  'clear-filters': () => {
    Object.assign(bank, { query: '', source: 'all', sort: 'az', status: 'all', limit: 24 });
    render();
    $('#word-search').focus();
  },
  'show-more': () => {
    const first = bank.limit;
    bank.limit += 24;
    drawResults();
    document.querySelectorAll('.word-link')[first]?.focus();
  },
  'select-results': () => { filtered().forEach((id) => bank.selected.add(id)); drawResults(); focusAction('save-set'); },
  'clear-selection': () => { bank.selected.clear(); drawResults(); $('#word-search').focus({ preventScroll: true }); },
  'review-selection': () => { player.pool = 'selected'; go('auto'); },
  'sets': showSets,
  'save-set': showSaveSet,
  'set-study': (id) => {
    const ids = pool('set:' + id);
    if (!ids.length) return toast('This set has no words in the Word Bank.');
    dialog.close();
    studyQueue = ids;
    go('study/' + ids[0]);
  },
  'set-auto': (id) => { dialog.close(); player.pool = 'set:' + id; go('auto'); },
  'ask-delete': (id) => {
    const set = profile().sets.find((s) => s.id === id);
    if (set) openDialog('Delete study set?', `<p>Remove “${escape(set.name)}” from your study sets?</p>
      <div class="buttons">${button('Cancel', 'sets')}${button('Delete set', 'set-delete', { value: id, kind: 'peach-btn' })}</div>`);
  },
  'set-delete': (id) => {
    profile().sets = profile().sets.filter((set) => set.id !== id);
    if (player.pool === 'set:' + id) player.pool = 'all';
    if (game.pool === 'set:' + id) game.pool = 'all';
    save();
    showSets();
  },
  'speak-word': say,
  'related': related,
  'learn': () => changeStudy('learn', { status: 'learning' }, 'Saved as Learning. Keep going!'),
  'master': () => changeStudy('master', { status: 'mastered' }, 'Word mastered. Nicely done!'),
  'tricky': () => {
    const difficult = !getProgress(profile(), studyId).difficult;
    changeStudy('tricky', { difficult }, difficult ? 'Added to your Difficult words.' : 'Removed from Difficult words.');
  },
  'study-prev': () => go('study/' + studyQueue[studyQueue.indexOf(studyId) - 1]),
  'study-next': () => go('study/' + studyQueue[studyQueue.indexOf(studyId) + 1]),
  'auto-toggle': () => {
    if (player.playing) { pause(); drawPlayer(); }
    else {
      if (player.finished) movePlayback(0);
      tick();
    }
    focusAction('auto-toggle');
  },
  'auto-restart': () => { movePlayback(0); focusAction('auto-restart'); },
  'auto-prev': () => { movePlayback(player.index - 1); focusAction('auto-prev'); },
  'auto-next': () => { movePlayback(player.index + 1); focusAction('auto-next'); },
  'auto-hear': async () => {
    if (player.playing) { movePlayback(player.index); focusAction('auto-hear'); return; }
    const session = player;
    const word = wordById.get(session.ids[session.index]);
    if (word) {
      const result = await pronounce(word);
      if (view === 'auto' && session === player) audioStatus('player', session, result);
    }
  },
  'auto-shuffle': () => { profile().prefs.shuffle = !profile().prefs.shuffle; refreshPlayback(true); focusAction('auto-shuffle'); },
  'auto-repeat': (_, el) => {
    profile().prefs.repeat = !profile().prefs.repeat;
    el.setAttribute('aria-pressed', String(profile().prefs.repeat));
    save();
  },
  'fullscreen': async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('#player').requestFullscreen();
    } catch { toast('Fullscreen is unavailable.'); }
  },
  'challenge-start': startChallenge,
  'challenge-audio': challengeAudio,
  'challenge-next': () => {
    if (game.index + 1 >= game.ids.length) return finishChallenge();
    game.index++;
    game.hint = false;
    game.audioNote = '';
    render();
    $('#answer')?.focus({ preventScroll: true });
    challengeAudio('word');
  },
  'challenge-reset': () => { game.stage = 'setup'; render(); focusAction('challenge-start'); },
  'challenge-end': finishChallenge,
  'hint': (_, element) => {
    if (game.strict) return;
    game.hint = !game.hint;
    const w = wordById.get(game.ids[game.index]).word;
    const length = Array.from(w).filter((c) => /\p{L}/u.test(c)).length;
    $('#challenge-hint').textContent = game.hint ? 'Starts with ' + Array.from(w)[0].toUpperCase() + ' and has ' + length + ' letters.' : '';
    element.setAttribute('aria-pressed', String(game.hint));
  },
  'missed-one': (id) => markMisses([id]),
  'missed-all': () => markMisses(game.answers.filter((a) => !a.correct).map((a) => a.id)),
  'switch-profile': switchProfile,
  'close': () => dialog.close(),
  'export': exportBackup,
  'import': () => $('#backup-file').click(),
};

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (control && !control.disabled) actions[control.dataset.action]?.(control.dataset.value, control);
  const link = event.target.closest('[data-bank-word]');
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    studyQueue = filtered();
    go('study/' + link.dataset.bankWord);
  }
});

$('#profile-button').addEventListener('click', showProfiles);

$('#main').addEventListener('input', (event) => {
  if (event.target.id === 'word-search') {
    bank.query = event.target.value;
    bank.limit = 24;
    drawResults();
  }
});

const playbackFields = { 'auto-pool': 'pool', 'auto-interval': 'interval', 'auto-custom': 'custom', 'speech-rate': 'rate' };
main.addEventListener('change', ({ target: el }) => {
  const word = el.dataset.selectWord;
  if (word) {
    if (el.checked) bank.selected.add(word);
    else bank.selected.delete(word);
    el.closest('.word-card').classList.toggle('selected', el.checked);
    drawSelection();
    return;
  }
  if (el.id === 'word-source' || el.id === 'word-sort') {
    bank[el.id === 'word-source' ? 'source' : 'sort'] = el.value;
    bank.limit = 24;
    drawResults();
  } else if (el.id === 'auto-speak') {
    profile().prefs.autoSpeak = el.checked;
    save();
    if (el.checked) say(studyId);
    else stopSpeech();
  } else if (el.id in playbackFields) {
    const property = playbackFields[el.id];
    const rebuild = property === 'pool';
    if (rebuild) player.pool = el.value;
    else if (property === 'custom') profile().prefs.custom = Math.min(120, Math.max(1, Math.round(el.valueAsNumber || 5)));
    else profile().prefs[property] = property === 'rate' ? Number(el.value) : el.value;
    refreshPlayback(rebuild);
    $(el.id === 'auto-interval' && el.value === 'custom' ? '#auto-custom' : '#' + el.id)?.focus();
  } else if (el.id === 'challenge-pool' || el.id === 'challenge-length') {
    game[el.id === 'challenge-pool' ? 'pool' : 'length'] = el.value;
    render();
    document.getElementById(el.id)?.focus();
  } else if (el.id === 'competition') game.strict = el.checked;
});

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!['profile-form', 'set-form', 'answer-form'].includes(form.id)) return;
  event.preventDefault();
  const input = form.querySelector('input');
  const name = input.value.trim();
  if (!name) {
    input.value = '';
    input.reportValidity();
    return;
  }
  if (form.id === 'profile-form') {
    const p = createProfile(name);
    profiles.profiles.push(p);
    switchProfile(p.id);
    toast('Welcome, ' + name + '!');
  } else if (form.id === 'set-form') {
    if (!bank.selected.size) return;
    profile().sets.push({ id: crypto.randomUUID(), name, words: [...bank.selected] });
    save();
    dialog.close();
    bank.selected.clear();
    drawResults();
    focusAction('sets');
    toast('Study set saved.');
  } else submitAnswer(name);
});

$('#backup-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Backup too large');
    const imported = parseBackup(await file.text());
    profiles.profiles.push(...imported);
    switchProfile(imported[0].id);
    toast('Backup imported.');
  } catch { toast('This file is not a valid Spelling Bee backup.'); }
});

window.addEventListener('hashchange', () => onRoute());
window.addEventListener('pagehide', pause);
onRoute(false);
