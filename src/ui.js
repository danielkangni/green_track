// Petits composants d'interface partagés (HTML en chaînes, sans framework).
import { siteById } from './data/sites.js';
import { LEVELS } from './core/thirst.js';

const P = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  map: '<path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z"/><path d="M9 4v13m6-10v13"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.2-6.1 2.4-.5 4.9-2 5.8-3.9"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  sprout: '<path d="M7 20h10M12 20v-8"/><path d="M12 12C12 8 9 6 4 6c0 4 3 6 8 6Z"/><path d="M12 10c0-3.5 2.5-6 8-6 0 4-3 6-8 6Z"/>',
  cube: '<path d="m21 16-9 5-9-5V8l9-5 9 5v8Z"/><path d="m3.3 7.5 8.7 5 8.7-5M12 22V12.5"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>',
  drop: '<path d="M12 2.7s7 7.2 7 12.3a7 7 0 0 1-14 0c0-5.1 7-12.3 7-12.3Z"/>',
  thermo: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0Z"/>',
  battery: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2"/>',
  wifi: '<path d="M5 12.6a10 10 0 0 1 14 0M8.5 16.1a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0"/><circle cx="12" cy="20" r=".8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  savings: '<path d="M12 2.7s7 7.2 7 12.3a7 7 0 0 1-14 0c0-5.1 7-12.3 7-12.3Z"/><path d="m9 14 2 2 4-4"/>',
  signal: '<path d="M2 20h.01M7 20v-4m5 4v-8m5 8V8m5 12V4"/>',
  cloud: '<path d="M17.5 19H8a6 6 0 1 1 5.6-8.1A4.5 4.5 0 1 1 17.5 19Z"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  rain: '<path d="M17.5 15H8a6 6 0 1 1 5.6-8.1A4.5 4.5 0 1 1 17.5 15Z"/><path d="M8 19v2m4-3v3m4-2v2"/>',
};

export const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const fmt = (n, d = 0) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });
export const fmtL = (l) => (l >= 10000 ? `${fmt(l / 1000, 1)} m³` : `${fmt(l)} L`);
export const siteName = (id) => siteById(id)?.name ?? id;
export const timeAgo = (ts) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `il y a ${s} s`;
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  return `il y a ${Math.round(s / 3600)} h`;
};
export const hhmm = (ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const levelBadge = (level, text) => `<span class="badge ${level.key}">${esc(text ?? level.label)}</span>`;

export function thirstBar(index, level) {
  return `<div class="thirst-bar"><div class="track"><div class="fill" style="width:${index}%;background:${level.color}"></div></div><b>${index}</b></div>`;
}

// Jauge semi-circulaire de l'indice de soif
export function gauge(index, level) {
  const r = 80;
  const c = Math.PI * r;
  const zones = [
    [0, 35, LEVELS.ok.color],
    [35, 65, LEVELS.watch.color],
    [65, 100, LEVELS.water.color],
  ];
  const arc = (from, to, color, w, op = 1) =>
    `<path d="M15 95 A${r} ${r} 0 0 1 175 95" fill="none" stroke="${color}" stroke-width="${w}" stroke-opacity="${op}"
      stroke-dasharray="${((to - from) / 100) * c} ${c}" stroke-dashoffset="${-(from / 100) * c}" />`;
  const a = Math.PI * (1 - index / 100);
  const nx = 95 + Math.cos(a) * 58;
  const ny = 95 - Math.sin(a) * 58;
  return `<div class="gauge">
    <svg viewBox="0 0 190 108">
      ${zones.map(([f, t, col]) => arc(f, t, col, 14, 0.18)).join('')}
      ${arc(0, index, level.color, 14)}
      <line x1="95" y1="95" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#17231e" stroke-width="3" stroke-linecap="round"/>
      <circle cx="95" cy="95" r="6" fill="#17231e"/>
    </svg>
    <div class="gauge-val"><b style="color:${level.color}">${index}</b><small>indice de soif / 100</small></div>
  </div>`;
}

export function sparkline(values, color = '#2f9e44', w = 110, h = 30) {
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

// Silhouettes d'espèces (avatars)
const SIL = {
  neem: '<rect x="18" y="26" width="4" height="12" rx="1" fill="#6b4a2f"/><circle cx="20" cy="17" r="11" fill="currentColor"/><circle cx="13" cy="21" r="6" fill="currentColor"/><circle cx="27" cy="21" r="6" fill="currentColor"/>',
  baobab: '<path d="M14 38c0-6 1-12-1-16h14c-2 4-1 10-1 16Z" fill="#8a6a4a"/><path d="M13 22 7 14m20 8 6-8M20 22v-9" stroke="#8a6a4a" stroke-width="2.4" stroke-linecap="round"/><circle cx="7" cy="12" r="4" fill="currentColor"/><circle cx="33" cy="12" r="4" fill="currentColor"/><circle cx="20" cy="10" r="5" fill="currentColor"/>',
  flamboyant: '<rect x="18.5" y="20" width="3" height="18" rx="1" fill="#6b4a2f"/><ellipse cx="20" cy="17" rx="17" ry="7" fill="currentColor"/><circle cx="12" cy="15" r="2" fill="#ffb347"/><circle cx="25" cy="13" r="2" fill="#ffb347"/><circle cx="20" cy="19" r="1.6" fill="#ffb347"/>',
  cocotier: '<path d="M21 38c-1-10 0-20 3-27" stroke="#8a6a4a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M24 11c-6-4-13-2-16 3 5-2 10-2 16-3Zm0 0c6-4 13-2 16 3-5-2-10-2-16-3Zm0 0c-2-5-6-8-11-8 3 2 7 5 11 8Zm0 0c3-5 7-8 12-7-4 1-8 4-12 7Zm0 0c-4 2-6 7-6 11 2-4 4-7 6-11Z" fill="currentColor"/>',
  manguier: '<rect x="18" y="25" width="4" height="13" rx="1" fill="#6b4a2f"/><ellipse cx="20" cy="17" rx="14" ry="12" fill="currentColor"/><circle cx="15" cy="20" r="1.8" fill="#f2b33d"/><circle cx="25" cy="15" r="1.8" fill="#f2b33d"/>',
  karite: '<rect x="18" y="22" width="4" height="16" rx="1" fill="#6b4a2f"/><circle cx="20" cy="15" r="9" fill="currentColor"/><circle cx="12" cy="19" r="5" fill="currentColor"/><circle cx="28" cy="18" r="5.5" fill="currentColor"/>',
  acacia: '<path d="M20 38V22m0 6-6-6m6 2 6-5" stroke="#6b4a2f" stroke-width="2.6" stroke-linecap="round" fill="none"/><ellipse cx="20" cy="15" rx="15" ry="6" fill="currentColor"/><ellipse cx="20" cy="11" rx="9" ry="4" fill="currentColor"/>',
};
export function speciesAvatar(sp) {
  const svg = SIL[sp.id] || SIL.neem;
  return `<span class="species-avatar" style="background:${sp.color}1f;color:${sp.color}"><svg viewBox="0 0 40 40">${svg}</svg></span>`;
}

export function toast(msg, ico = 'check') {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon(ico).replace('<svg', '<svg width="18" height="18" stroke="#7bd389" fill="none" stroke-width="2"')}<span>${esc(msg)}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
