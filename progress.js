const storageKey = 'spelling-bee-v1';
const idPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i;
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const statuses = new Set(['new', 'learning', 'mastered']);
const newId = () => globalThis.crypto?.randomUUID?.() ??
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

export function createProfile(name) {
  return {
    id: newId(), name, progress: Object.create(null), sets: [], days: [],
    correct: 0, attempts: 0, perfect: false,
    prefs: { autoSpeak: false, rate: 1, interval: '5', custom: 5, repeat: false, shuffle: false },
  };
}

const number = (value, min, max, fallback) => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(max, Math.max(min, value)) : fallback;
const safeId = (value) => typeof value === 'string' && value.length <= 100 && idPattern.test(value);
const keys = (value) => Array.isArray(value) ? [...new Set(value.filter(safeId))] : [];

function restoreProfile(data, freshId = false) {
  if (typeof data?.name !== 'string' || !data.name.trim()) throw new Error('Invalid profile');
  const p = createProfile(data.name.trim().slice(0, 28));
  if (!freshId && safeId(data.id)) p.id = data.id;
  if (data.progress && typeof data.progress === 'object' && !Array.isArray(data.progress)) {
    for (const [id, entry] of Object.entries(data.progress)) {
      if (!safeId(id) || !entry || typeof entry !== 'object') continue;
      p.progress[id] = {
        status: statuses.has(entry.status) ? entry.status : 'new',
        studied: entry.studied === true,
        difficult: entry.difficult === true,
        correct: Math.trunc(number(entry.correct, 0, 1e8, 0)),
        attempts: Math.trunc(number(entry.attempts, 0, 1e8, 0)),
        trickyWin: entry.trickyWin === true,
      };
    }
  }
  if (Array.isArray(data.sets)) {
    const used = new Set();
    for (const set of data.sets) {
      if (typeof set?.name !== 'string' || !set.name.trim()) continue;
      const id = safeId(set.id) && !used.has(set.id) ? set.id : newId();
      used.add(id);
      p.sets.push({ id, name: set.name.trim().slice(0, 40), words: keys(set.words) });
    }
  }
  p.days = Array.isArray(data.days)
    ? [...new Set(data.days.filter((day) => typeof day === 'string' && dayPattern.test(day)))].sort() : [];
  p.attempts = Math.trunc(number(data.attempts, 0, 1e8, 0));
  p.correct = Math.trunc(number(data.correct, 0, p.attempts, 0));
  p.perfect = data.perfect === true;
  p.prefs.rate = number(data.prefs?.rate, .6, 1.3, 1);
  p.prefs.interval = ['3', '5', '7', '10', 'custom'].includes(data.prefs?.interval) ? data.prefs.interval : '5';
  p.prefs.custom = number(data.prefs?.custom, 1, 120, 5);
  for (const flag of ['autoSpeak', 'repeat', 'shuffle']) p.prefs[flag] = data.prefs?.[flag] === true;
  return p;
}

export function loadProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.version === 1 && Array.isArray(saved.profiles) && saved.profiles.length) {
      const profiles = saved.profiles.map((profile) => restoreProfile(profile));
      return { profiles, active: profiles.some((p) => p.id === saved.active) ? saved.active : profiles[0].id };
    }
  } catch {
    // A blocked storage API or unreadable save still allows an in-memory session.
  }
  const profile = createProfile('Speller');
  return { profiles: [profile], active: profile.id };
}

export function saveProfiles(data) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...data }));
    return true;
  } catch {
    return false;
  }
}

export const backup = (data) => JSON.stringify({ version: 1, ...data }, null, 2);

export function parseBackup(data) {
  const parsed = JSON.parse(data);
  if (parsed?.version !== 1 || !Array.isArray(parsed.profiles) || !parsed.profiles.length) {
    throw new Error('Invalid backup');
  }
  return parsed.profiles.map((p) => restoreProfile(p, true));
}

export function getProgress(profile, id) {
  return profile.progress[id] ?? { status: 'new', studied: false, difficult: false, correct: 0, attempts: 0, trickyWin: false };
}

export function editProgress(profile, id, changes) {
  const progress = { ...getProgress(profile, id), ...changes };
  profile.progress[id] = progress;
  return progress;
}

function dayKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}

export function recordDay(profile) {
  const today = dayKey(new Date());
  if (!profile.days.includes(today)) profile.days.push(today);
}

export function streak(profile) {
  const date = new Date();
  const days = new Set(profile.days);
  if (!days.has(dayKey(date))) date.setDate(date.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(date))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

export function mix(ids) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
