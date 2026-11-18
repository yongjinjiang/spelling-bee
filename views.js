import { sources, words, wordById, wordKey, relatedById } from './words.js';
import { getProgress, streak } from './progress.js';
import { speechAvailable } from './speech.js';
import { icon, escape, button, iconButton, option, meter } from './ui.js';

export const nav = [
  ['bank', 'Word Bank', 'book'], ['study', 'Study', 'cards'], ['auto', 'Auto Play', 'circlePlay'],
  ['challenge', 'Spelling Challenge', 'trophy'], ['progress', 'My Progress', 'chart'],
];

const statusNames = { new: 'New', learning: 'Learning', mastered: 'Mastered' };
const wordCount = (count) => count + (count === 1 ? ' word' : ' words');
export const badge = (status) => `<span class="status ${status}"><i></i>${statusNames[status]}</span>`;
const tag = (label, symbol, style) => `<span class="tag ${style}">${icon(symbol, 13)}${label}</span>`;
const heading = (title, subtitle, symbol, color = 'gold') => `<div class="page-heading">
  <span class="feature-icon ${color}">${icon(symbol, 25)}</span><div><h1>${title}</h1><p>${subtitle}</p></div>
</div>`;

export function counts(profile) {
  const totals = { new: 0, learning: 0, mastered: 0, difficult: 0, studied: 0, wins: 0 };
  for (const word of words) {
    const progress = getProgress(profile, word.id);
    totals[progress.status]++;
    if (progress.difficult) totals.difficult++;
    if (progress.studied) totals.studied++;
    if (progress.trickyWin) totals.wins++;
  }
  return totals;
}

function stat(label, value, symbol, color, action, selected = false) {
  const content = `<span class="stat-icon ${color}">${icon(symbol, 23)}</span>
    <span><strong>${value}</strong><small>${label}</small></span>`;
  return action
    ? `<button type="button" class="stat" data-action="status-filter" data-value="${action}" aria-pressed="${selected}">${content}</button>`
    : `<div class="stat">${content}</div>`;
}

export function bankView(bank, profile) {
  const total = counts(profile);
  return `<section class="hero" aria-labelledby="welcome">
    <img class="hero-art" src="./assets/bee-reading.jpg" alt="">
    <div class="hero-content">
      <span class="season-label">${icon('sparkles', 15)} 2026–2027 STUDY LIST</span>
      <h1 id="welcome">Ready, set, <em>spell!</em></h1>
      <p>Find new words, practice at your own pace, and get ready for your next spelling bee.</p>
      <div class="hero-actions">
        <a href="#study" class="btn primary">${icon('play', 17)} Start studying</a>
        <a href="#challenge" class="btn hero-secondary">Take a challenge ${icon('arrow', 17)}</a>
      </div>
    </div>
  </section>
  <section class="stats" aria-label="Word Bank overview">
    ${stat('Total words', words.length, 'layers', 'gold', 'all', bank.status === 'all')}
    ${stat('Learning', total.learning, 'sprout', 'lilac', 'learning', bank.status === 'learning')}
    ${stat('Mastered', total.mastered, 'checkCircle', 'mint', 'mastered', bank.status === 'mastered')}
    ${stat('Difficult', total.difficult, 'star', 'peach', 'difficult', bank.status === 'difficult')}
  </section>
  <section id="word-bank" class="bank-section" aria-labelledby="bank-title">
    <div class="section-heading">
      <div><h2 id="bank-title">Word Bank</h2><p>Explore your spelling list and build a set to practice.</p></div>
      ${button('My study sets', 'sets', { icon: 'mark' })}
    </div>
    <div class="bank-toolbar">
      <label class="search">${icon('search', 20)}<input id="word-search" type="search" placeholder="Search for a word..." aria-label="Search for a word" value="${escape(bank.query)}"></label>
      <label class="select-wrap">${icon('filter', 18)}<select id="word-source" aria-label="Source list">
        ${option('all', 'All lists', bank.source)}
        ${Object.entries(sources).map(([id, source]) => option(id, source.name, bank.source)).join('')}
      </select>${icon('chevron', 15)}</label>
      <label class="select-wrap">${icon('sort', 18)}<select id="word-sort" aria-label="Sort words">
        ${option('az', 'A to Z', bank.sort)}${option('za', 'Z to A', bank.sort)}
      </select>${icon('chevron', 15)}</label>
    </div>
    <div class="bank-filter-row">
      <div id="bank-filters" class="pills" aria-label="Learning status filters">${filterPills(bank.status)}</div>
      <span id="bank-count" class="muted bank-count" role="status"></span>
    </div>
    <div id="selection-bar" class="selection-bar" hidden></div>
    <div id="word-results"></div>
  </section>`;
}

export function filterPills(active) {
  return [['all', 'All words'], ['new', 'New'], ['learning', 'Learning'], ['mastered', 'Mastered'], ['difficult', 'Difficult'], ['highlighted', 'Highlighted']]
    .map(([id, title]) => `<button class="pill" type="button" data-action="status-filter" data-value="${id}" aria-pressed="${active === id}">
      ${id === 'highlighted' ? icon('flag', 14) : ''}${title}</button>`).join('');
}

export function resultsView(ids, bank, profile) {
  if (!ids.length) return `<div class="empty"><span class="feature-icon gold">${icon('search', 26)}</span><h3>No words found</h3>
      <p>Try a different search or clear your filters.</p>${button('Clear filters', 'clear-filters')}</div>`;
  const cards = ids.slice(0, bank.limit).map((id) => {
    const w = wordById.get(id);
    const p = getProgress(profile, id);
    return `<article class="word-card${bank.selected.has(id) ? ' selected' : ''}">
      <div class="word-card-top">
        <label class="word-select">
          <input type="checkbox" data-select-word="${id}" ${bank.selected.has(id) ? 'checked' : ''} aria-label="Select ${escape(w.word)}">
        </label>
        <div class="card-tags">${badge(p.status)}${w.highlighted ? `<span class="mini-flag" title="Highlighted on the printed list" aria-label="Highlighted on the printed list">${icon('flag', 13)}</span>` : ''}
          ${p.difficult ? `<span class="mini-star" title="Difficult" aria-label="Difficult">${icon('star', 15)}</span>` : ''}</div>
        ${iconButton('Hear ' + w.word, 'speak-word', 'audio', id, { kind: 'audio-button', disabled: !speechAvailable })}
      </div>
      <a class="word-link" href="#study/${id}" data-bank-word="${id}">${escape(w.word)}</a>
      <p>${escape(w.definition)}</p>
      <div class="word-card-bottom"><span>${sources[w.source].name}</span>
        <a href="#study/${id}" data-bank-word="${id}" aria-label="Study ${escape(w.word)}">Study ${icon('arrow', 16)}</a>
      </div>
    </article>`;
  }).join('');
  return `<div class="word-grid">${cards}</div>${ids.length > bank.limit ? '<div class="more">' + button('Show more words', 'show-more', { icon: 'plus' }) + '</div>' : ''}`;
}

function listLinks(list) {
  return list.map((item) => {
    const id = wordKey(item);
    if (wordById.has(id) || relatedById.has(id)) {
      return `<button type="button" class="family-chip" data-action="related" data-value="${escape(id)}">${escape(item)} ${icon('right', 13)}</button>`;
    }
    return `<span class="family-chip static">${escape(item)}</span>`;
  }).join('');
}

export function studyView(word, queue, profile) {
  const progress = getProgress(profile, word.id);
  const ix = queue.indexOf(word.id);
  const family = word.family.filter((item) => !word.derived.includes(item));
  const hasDetails = word.origin || word.roots.length || family.length || word.derived.length;
  return `<div class="study-layout">
    <div class="study-top">
      <a href="#bank" class="back-link">${icon('back', 18)} Word Bank</a>
      <div class="study-tally"><span>Word ${ix + 1} of ${queue.length}</span>${meter(ix + 1, queue.length, 'Study position')}</div>
      <label class="toggle-label"><input type="checkbox" id="auto-speak" ${profile.prefs.autoSpeak ? 'checked' : ''} ${speechAvailable ? '' : 'disabled'}> Auto pronounce</label>
    </div>
    <section class="study-card panel">
      <div class="study-main">
        <div class="study-badges">${badge(progress.status)}${word.highlighted ? tag('Highlighted', 'flag', 'lilac') : ''}${progress.difficult ? tag('Difficult', 'star', 'peach') : ''}</div>
        <p class="study-source">${escape(sources[word.source].detail)}</p>
        <h1>${escape(word.word)}</h1>
        <div class="pronunciation">${word.ipa ? '<span>/' + escape(word.ipa) + '/</span>' : ''}<span class="part">${escape(word.part)}</span></div>
        ${button('Hear pronunciation', 'speak-word', { kind: 'primary', value: word.id, icon: 'audio', disabled: !speechAvailable })}
        ${speechAvailable ? '' : '<p class="muted">This browser has no speech synthesis. Use the phonetic spelling or dictionary link.</p>'}
        <p class="study-definition">${escape(word.definition)}</p>
        ${word.variants.length ? `<p class="variant">Also accepted in British English <strong>${escape(word.variants.join(', '))}</strong></p>` : ''}
      </div>
      <div class="study-actions">
        ${button('Still Learning', 'learn', { icon: 'sprout', kind: 'lilac-btn', pressed: progress.status === 'learning' })}
        ${button('I Know It!', 'master', { icon: 'checkCircle', kind: 'mint-btn', pressed: progress.status === 'mastered' })}
        ${button('Tricky Word!', 'tricky', { icon: 'star', kind: 'peach-btn', pressed: progress.difficult })}
      </div>
      <div class="study-extra">
        <div class="example"><span>${icon('note', 17)} IN A SENTENCE</span><p>“${escape(word.example)}”</p></div>
        ${hasDetails ? `<div class="etymology">
          ${word.roots.length ? `<h2>${icon('roots', 19)} Word roots</h2><div class="root-grid">${word.roots.map(([root, language, meaning]) =>
            `<div class="root"><strong>${escape(root)}</strong><span>${escape(language)}</span><p>${escape(meaning)}</p></div>`).join('')}</div>` : ''}
          ${word.origin ? `<p class="origin">${escape(word.origin)}</p>` : ''}
          ${family.length ? `<h3>Word family</h3><div class="pills">${listLinks(family)}</div>` : ''}
          ${word.derived.length ? `<h3>Derived words</h3><div class="pills">${listLinks(word.derived)}</div>` : ''}
        </div>` : ''}
        ${word.synonyms.length || word.antonyms.length ? `<div class="meanings">
          ${word.synonyms.length ? '<p><strong>Synonyms</strong> ' + escape(word.synonyms.join(' · ')) + '</p>' : ''}
          ${word.antonyms.length ? '<p><strong>Antonyms</strong> ' + escape(word.antonyms.join(' · ')) + '</p>' : ''}
        </div>` : ''}
        <a class="dictionary-link" href="${word.dictionary}" target="_blank" rel="noreferrer">Dictionary reference ${icon('arrow', 14)}</a>
      </div>
    </section>
    <div class="study-nav">${button('Previous', 'study-prev', { icon: 'left', disabled: ix <= 0 })}
      ${button('Next word', 'study-next', { kind: 'primary', disabled: ix >= queue.length - 1 })}</div>
  </div>`;
}

export function poolOptions(profile, active, kind, selectionCount) {
  const base = [['all', 'All words']];
  if (kind === 'auto') base.push(['new', 'New words'], ['learning', 'Learning words'], ['highlighted', 'Highlighted words']);
  base.push(['difficult', 'Difficult words']);
  if (selectionCount || active === 'selected') base.push(['selected', 'Current selection (' + selectionCount + ')']);
  for (const set of profile.sets) base.push(['set:' + set.id, set.name]);
  return base.map(([id, label]) => option(id, label, active)).join('');
}

export function autoView(auto, profile, selectionCount) {
  const prefs = profile.prefs;
  const word = wordById.get(auto.ids[auto.index]);
  return `<div class="feature-layout">${heading('Auto Play', 'Listen and review one word at a time.', 'circlePlay', 'lilac')}
    <div id="player" class="player">
      <div class="player-top"><span class="player-counter">${word ? 'Word ' + (auto.index + 1) + ' of ' + auto.ids.length : '0 words'}</span>
        ${document.fullscreenEnabled && typeof HTMLElement.prototype.requestFullscreen === 'function' ? iconButton('Fullscreen', 'fullscreen', 'expand') : ''}
      </div>
      <div id="player-word" class="player-word" aria-live="polite">
        ${word ? '<h2>' + escape(word.word) + '</h2>' : '<p>No words in this group yet.</p>'}
      </div>
      <div class="player-tools">
        ${iconButton('Restart', 'auto-restart', 'rewind', undefined, { disabled: !word })}
        ${iconButton('Previous word', 'auto-prev', 'left', undefined, { disabled: !word })}
        ${button(auto.playing ? 'Pause' : auto.hasPlayed && !auto.finished ? 'Resume' : 'Play', 'auto-toggle',
          { icon: auto.playing ? 'pause' : 'play', kind: 'primary', disabled: !word })}
        ${iconButton('Next word', 'auto-next', 'right', undefined, { disabled: !word })}
        ${word ? iconButton('Hear word', 'auto-hear', 'audio', undefined, { disabled: !speechAvailable }) : ''}
      </div>
      <div class="player-progress"><span></span></div>
    </div>
    <section class="panel playback-settings">
      <h2>Playback settings</h2>
      <div class="field-grid">
        <label>Words to review<select id="auto-pool">${poolOptions(profile, auto.pool, 'auto', selectionCount)}</select></label>
        <label>Time per word<select id="auto-interval">${[['3','3 seconds'],['5','5 seconds'],['7','7 seconds'],['10','10 seconds'],['custom','Custom interval']]
          .map(([id,label]) => option(id,label,prefs.interval)).join('')}</select></label>
        ${prefs.interval === 'custom' ? `<label>Custom seconds<input id="auto-custom" type="number" min="1" max="120" step="1" value="${prefs.custom}"></label>` : ''}
        <label>Pronunciation speed<select id="speech-rate">${[[.7,'Slow'],[.85,'Steady'],[1,'Normal'],[1.2,'Fast']]
          .map(([id,label]) => option(String(id),label,String(prefs.rate))).join('')}</select></label>
      </div>
      <div class="buttons playback-options">
        ${button('Shuffle', 'auto-shuffle', { icon: 'shuffle', pressed: prefs.shuffle })}
        ${button('Repeat', 'auto-repeat', { icon: 'repeat', pressed: prefs.repeat })}
        ${auto.finished ? '<span class="muted" role="status">Review complete!</span>' : ''}
      </div>
      <p id="player-audio-status" class="muted" role="status">${speechAvailable ? auto.audioNote : 'Audio is unavailable in this browser. You can still review the words.'}</p>
    </section>
  </div>`;
}

export function challengeView(game, profile, selectionCount, poolLength) {
  if (game.stage === 'setup') return `<div class="feature-layout">
    ${heading('Spelling Challenge', 'Listen closely, type what you hear, and see how you did.', 'trophy')}
    <section class="panel challenge-setup">
      <div class="setup-art"><img src="./assets/bee.svg" width="64" height="64" alt=""><span class="setup-spark">${icon('sparkles', 38)}</span></div>
      <h2>Start a round</h2>
      <div class="field-grid">
        <label>Word group<select id="challenge-pool">${poolOptions(profile, game.pool, 'challenge', selectionCount)}</select></label>
        <label>Round length<select id="challenge-length">${[['5','5 words'],['10','10 words'],['15','15 words'],['20','20 words'],['all','Entire group']]
          .map(([id,label]) => option(id,label,game.length)).join('')}</select></label>
      </div>
      <label class="competition-setting"><input type="checkbox" id="competition" ${game.strict ? 'checked' : ''}>
        <span><strong>Competition practice</strong><small>Ask to hear the word, definition, or sentence. Spelling hints are off.</small></span>${icon('trophy', 22)}</label>
      <div class="buttons challenge-actions">${button('Start challenge', 'challenge-start', { icon: 'play', kind: 'primary', disabled: poolLength === 0 || !speechAvailable })}
        <span class="muted">${poolLength ? wordCount(game.length === 'all' ? poolLength : Math.min(Number(game.length), poolLength)) + ' in this round' : 'This group is empty.'}</span></div>
      ${speechAvailable ? '<p id="challenge-audio-status" class="muted" role="status"></p>' : '<p class="muted">Spelling Challenge needs a browser with speech synthesis.</p>'}
    </section></div>`;
  if (game.stage === 'results') {
    const correct = game.answers.filter((answer) => answer.correct).length;
    const missed = game.answers.filter((answer) => !answer.correct);
    return `<div class="feature-layout">
      ${heading('Spelling Challenge', 'Your round results', 'trophy')}
      <section class="panel round-end">
        <span class="feature-icon gold result-icon">${icon(game.completed && correct === game.answers.length ? 'trophy' : 'sparkles', 35)}</span>
        <h2>${game.completed && correct === game.answers.length ? 'Perfect round!' : 'Nice work, speller!'}</h2>
        <p class="score">${correct}<span> / ${game.answers.length}</span></p>
        <p>${missed.length ? 'Review the words you missed, then try another round.' : game.completed ? 'You spelled every word correctly.' : 'Start a new round whenever you’re ready.'}</p>
        <div class="buttons centered">${button('Play another round', 'challenge-reset', { kind: 'primary', icon: 'rewind' })}
          <a href="#progress" class="btn secondary">${icon('chart', 18)} My Progress</a></div>
      </section>
      ${missed.length ? `<section class="panel missed-panel"><div class="section-heading">
        <h2>Words to revisit</h2>${button('Add all to Difficult', 'missed-all', { icon: 'star', disabled: missed.every((answer) => getProgress(profile, answer.id).difficult) })}</div>
        <ul class="plain-list">${missed.map((answer) => `<li><a href="#study/${answer.id}">${escape(wordById.get(answer.id).word)}</a>
          ${button(getProgress(profile, answer.id).difficult ? 'Added' : 'Mark difficult', 'missed-one', { value: answer.id, icon: 'star', disabled: getProgress(profile, answer.id).difficult })}</li>`).join('')}</ul></section>` : ''}
    </div>`;
  }

  const word = wordById.get(game.ids[game.index]);
  const answer = game.answers[game.index];
  const firstLetter = Array.from(word.word)[0];
  const length = Array.from(word.word).filter((letter) => /\p{L}/u.test(letter)).length;
  return `<div class="feature-layout">
    ${heading('Spelling Challenge', game.strict ? 'Competition practice' : 'Listen, then spell the word.', 'trophy')}
    <section class="panel challenge-active">
      <div class="challenge-meta"><span>Word ${game.index + 1} of ${game.ids.length}</span>
        ${button('End round', 'challenge-end', { kind: 'quiet' })}</div>
      ${meter(game.index + (answer ? 1 : 0), game.ids.length, 'Challenge progress')}
      <div class="listen">
        <button type="button" class="listen-button" data-action="challenge-audio" data-value="word" aria-label="Hear the word again">${icon('audio', 34)}</button>
        <h2>Spell what you hear</h2>
        <div class="buttons centered">
          ${button('Hear again', 'challenge-audio', { icon: 'audio', value: 'word', kind: 'secondary' })}
          ${button('Hear definition', 'challenge-audio', { icon: 'book', value: 'definition', kind: 'secondary' })}
          ${button('Hear example', 'challenge-audio', { icon: 'note', value: 'example', kind: 'secondary' })}
          ${game.strict || answer ? '' : button('Hint', 'hint', { icon: 'bulb', kind: 'secondary', pressed: game.hint })}
        </div>
      </div>
      <p id="challenge-hint" class="hint" aria-live="polite">${game.hint ? 'Starts with ' + escape(firstLetter.toUpperCase()) + ' and has ' + length + ' letters.' : ''}</p>
      <p id="challenge-audio-status" class="muted audio-status" role="status">${escape(game.audioNote)}</p>
      ${answer ? `<div class="answer-feedback ${answer.correct ? 'correct' : 'try-again'}" role="status">
          ${icon(answer.correct ? 'checkCircle' : 'bulb', 23)}
          <div><strong>${answer.correct ? 'You got it!' : 'Keep going. Every try helps.'}</strong>
            <p>Correct spelling <b>${escape(word.word)}</b>${word.variants.length ? ' or <b>' + escape(word.variants.join(' or ')) + '</b>' : ''}</p>
            ${answer.correct ? '' : '<p>You typed <b>' + escape(answer.typed) + '</b></p>'}</div>
        </div><div class="buttons centered answer-actions">
          ${answer.correct ? '' : button(getProgress(profile, word.id).difficult ? 'Added to Difficult' : 'Mark difficult',
            'missed-one', { value: word.id, icon: 'star', disabled: getProgress(profile, word.id).difficult })}
          ${button(game.index + 1 === game.ids.length ? 'See results' : 'Next word', 'challenge-next', { kind: 'primary', icon: 'arrow' })}
        </div>` : `<form id="answer-form" class="answer-form">
          <label for="answer">Your spelling</label>
          <input id="answer" name="answer" maxlength="100" required autocomplete="off" autocapitalize="off" spellcheck="false" autocorrect="off" placeholder="Type the word">
          <button class="btn primary" type="submit">${icon('check', 18)} Submit answer</button>
        </form>`}
    </section>
  </div>`;
}

export const achievements = [
  { title: 'First 10 Words Mastered', description: 'Master 10 words.', icon: 'star', color: 'gold', goal: 10, value: (total) => total.mastered },
  { title: '25 Words Mastered', description: 'Master 25 words.', icon: 'sparkles', color: 'lilac', goal: 25, value: (total) => total.mastered },
  { title: '50 Words Mastered', description: 'Master 50 words.', icon: 'trophy', color: 'gold', goal: 50, value: (total) => total.mastered },
  { title: 'Perfect Spelling Round', description: 'Get every answer right in a finished round.', icon: 'target', color: 'mint', goal: 1, value: (_, profile) => Number(profile.perfect) },
  { title: 'Difficult Word Champion', description: 'Spell 5 different words from your Difficult collection.', icon: 'flag', color: 'peach', goal: 5, value: (total) => total.wins },
];

export function progressView(profile) {
  const total = counts(profile);
  const accuracy = profile.attempts ? Math.round(100 * profile.correct / profile.attempts) + '%' : '—';
  const days = streak(profile);
  return `<div class="feature-layout">
    ${heading('My Progress', 'See how far you’ve come, one word at a time.', 'chart', 'mint')}
    <div class="stats progress-stats">
      ${stat('Words studied', total.studied, 'book', 'gold')}${stat('Mastered', total.mastered, 'checkCircle', 'mint')}
      ${stat('Learning', total.learning, 'sprout', 'lilac')}${stat('Difficult', total.difficult, 'star', 'peach')}
      ${stat('Challenge accuracy', accuracy, 'target', 'mint')}${stat(days === 1 ? 'Day streak' : 'Days in a row', days, 'flame', 'peach')}
    </div>
    <section class="panel progress-summary"><div class="section-heading"><div><h2>Study list progress</h2>
      <p>${total.mastered} of ${words.length} words mastered</p></div><strong>${Math.round(total.mastered * 100 / words.length)}%</strong></div>
      ${meter(total.mastered, words.length, 'Words mastered')}
      <div class="buttons"><a href="#study" class="btn primary">Keep studying ${icon('arrow', 18)}</a></div>
    </section>
    <section class="achievement-section"><div class="section-heading"><div><h2>Achievements</h2>
      <p>${achievements.filter((a) => a.value(total, profile) >= a.goal).length} of ${achievements.length} earned</p></div></div>
      <div class="achievement-grid">${achievements.map((a) => {
        const value = Math.min(a.goal, a.value(total, profile));
        return `<article class="panel achievement ${value === a.goal ? 'earned' : ''}">
          <span class="feature-icon ${a.color}">${icon(a.icon, 25)}</span><div><h3>${a.title}</h3><p>${a.description}</p>
          ${value === a.goal ? '<span class="earned-label">' + icon('check', 15) + ' Earned</span>' : meter(value, a.goal, a.title) + '<small>' + value + ' / ' + a.goal + '</small>'}</div>
        </article>`;
      }).join('')}</div>
    </section>
    <section class="panel backup-panel"><div><h2>Progress backup</h2><p>Save or restore the profiles on this device.</p></div>
      <div class="buttons">${button('Export', 'export', { icon: 'download' })}${button('Import', 'import', { icon: 'upload' })}</div>
    </section>
  </div>`;
}
