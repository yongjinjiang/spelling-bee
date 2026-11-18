const paths = {
  book: '<path d="M12 6c-2.8-2.2-6-2.6-9-1.5v14C6 17.4 9.2 17.8 12 20c2.8-2.2 6-2.6 9-1.5v-14c-3-1.1-6.2-.7-9 1.5v14"/>',
  cards: '<rect x="5" y="6" width="14" height="14" rx="2"/><path d="M2.5 15V5a2 2 0 0 1 2-2h10M9 12h6m-6 4h4"/>',
  play: '<path d="m9 5 12 7-12 7z"/>',
  circlePlay: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  trophy: '<path d="M8 21h8m-4-4v4M7 4h10v7a5 5 0 0 1-10 0V4Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4"/>',
  chart: '<path d="M4 4v16h16M9 15v-4m5 4V7m5 8V4"/>',
  person: '<circle cx="12" cy="8" r="3.2"/><path d="M5 20v-1.5a5.5 5.5 0 0 1 5.5-5.5h3a5.5 5.5 0 0 1 5.5 5.5V20"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  left: '<path d="m14 6-6 6 6 6"/>',
  right: '<path d="m10 6 6 6-6 6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  audio: '<path d="M4 9v6h4l5 4V5L8 9H4Zm12 .5a4 4 0 0 1 0 5m2.5-8a8 8 0 0 1 0 11"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5"/>',
  sprout: '<path d="M12 21v-9m0 4C5 16 3 13 3 8c5 0 9 2 9 8Zm0-4c0-6 3-8 9-9 0 5-2 9-9 9Z"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  filter: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
  sort: '<path d="M4 7h8m-8 5h6m-6 5h4m8-10v11m-3-3 3 3 3-3"/>',
  sparkles: '<path d="M12 3c.7 5.4 2.6 7.3 8 8-5.4.7-7.3 2.6-8 8-.7-5.4-2.6-7.3-8-8 5.4-.7 7.3-2.6 8-8Zm6 13v5m-2.5-2.5h5M6 3v4M4 5h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  mark: '<path d="M6 4h12v16l-6-4-6 4z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  roots: '<path d="M12 3v18M5 7v2c0 3 3 4 7 4s7-1 7-4V7M7 20v-2c0-2 2-3 5-3s5 1 5 3v2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/>',
  note: '<path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 5h6m-6 4h6m-6 4h3"/>',
  rewind: '<path d="M4 10a8 8 0 1 1 .6 6M4 4v6h6"/>',
  shuffle: '<path d="M3 6h3c5 0 5 12 10 12h5m-4-4 4 4-4 4M3 18h3c1.5 0 2.6-1 3.5-2.5M14 8c.6-1.2 1.3-2 2.5-2H21m-4-4 4 4-4 4"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
  expand: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>',
  flame: '<path d="M12 22a7 7 0 0 0 7-7c0-4-2.5-6.8-4-8-.5 3-2 4-2 4 .5-4-1.5-7-4-9 .5 4-1 6-2.5 8C5.6 11.2 5 13 5 15a7 7 0 0 0 7 7Z"/><path d="M12 22a3 3 0 0 0 3-3c0-1.7-1-2.8-3-4-2 1.2-3 2.3-3 4a3 3 0 0 0 3 3Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3"/>',
  bulb: '<path d="M9 18h6m-5 3h4m2-6c1.4-1.2 2-2.5 2-4a6 6 0 0 0-12 0c0 1.5.6 2.8 2 4l1 3h6l1-3Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  flag: '<path d="M5 21V4m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  trash: '<path d="M3 6h18M8 6V3h8v3m-11 0 1 15h12l1-15M10 10v7m4-7v7"/>',
};

export function icon(name, size = 20) {
  return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + paths[name] + '</svg>';
}

export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export const button = (label, action, options = {}) =>
  `<button type="button" class="btn ${options.kind ?? 'secondary'}" data-action="${action}"
    ${options.value !== undefined ? 'data-value="' + escape(options.value) + '"' : ''}
    ${options.pressed !== undefined ? 'aria-pressed="' + options.pressed + '"' : ''}
    ${options.disabled ? 'disabled' : ''}>${options.icon ? icon(options.icon, 18) : ''}${label}</button>`;

export const iconButton = (label, action, symbol, value, options = {}) =>
  `<button type="button" class="icon-btn ${options.kind ?? ''}" title="${escape(label)}" aria-label="${escape(label)}" data-action="${action}"
    ${value !== undefined ? 'data-value="' + escape(value) + '"' : ''} ${options.disabled ? 'disabled' : ''}
    ${options.pressed !== undefined ? 'aria-pressed="' + options.pressed + '"' : ''}>${icon(symbol, 20)}</button>`;

export const option = (value, label, selected) =>
  `<option value="${escape(value)}"${value === selected ? ' selected' : ''}>${escape(label)}</option>`;

export function meter(value, max, label) {
  return `<div class="meter" role="progressbar" aria-label="${escape(label)}" aria-valuemin="0" aria-valuemax="${Math.max(1, max)}" aria-valuenow="${value}"><span style="--fill:${max ? 100 * value / max : 0}%"></span></div>`;
}
