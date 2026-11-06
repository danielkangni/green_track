import './styles.css';
import { store, on, computeAlerts } from './core/store.js';
import { startSource } from './core/sensors.js';
import { icon } from './ui.js';

// Chaque vue est chargée à la demande : la première page reste légère
// (Leaflet et Three.js ne sont téléchargés que si l'on ouvre la carte ou la 3D).
const ROUTES = [
  { path: 'accueil', label: 'Accueil', icon: 'dashboard', section: 'Suivi', load: () => import('./views/dashboard.js') },
  { path: 'alertes', label: 'Alertes', icon: 'bell', section: 'Suivi', load: () => import('./views/alerts.js'), badge: true },
  { path: 'arrosages', label: 'Arrosages', icon: 'drop', section: 'Suivi', load: () => import('./views/waterings.js'), auto: true },
  { path: 'carte', label: 'Carte', icon: 'map', section: 'Explorer', load: () => import('./views/map.js') },
  { path: 'maquette-3d', label: 'Parc en 3D', icon: 'cube', section: 'Explorer', load: () => import('./views/twin.js') },
  { path: 'plantations', label: 'Plantes', icon: 'leaf', section: 'Explorer', load: () => import('./views/plants.js') },
  { path: 'montage', label: 'Montage du capteur', icon: 'wrench', section: 'Matériel', load: () => import('./views/build.js') },
  { path: 'especes', label: 'Espèces', icon: 'sprout', section: 'Réglages', load: () => import('./views/species.js') },
  { path: 'capteurs', label: 'Capteurs & connexion', icon: 'cpu', section: 'Réglages', load: () => import('./views/sensors.js') },
];
const ALIASES = { 'tableau-de-bord': 'accueil' };
const PASSPORT = { path: 'plante', load: () => import('./views/passport.js'), parent: 'plantations' };

const $ = (s) => document.querySelector(s);
let cleanup = null;
let navToken = 0;

function renderNav(active) {
  let html = '';
  let section = '';
  const high = computeAlerts().filter((a) => a.severity === 'high').length;
  for (const r of ROUTES) {
    if (r.section !== section) {
      section = r.section;
      html += `<div class="nav-section">${section}</div>`;
    }
    const extra = r.badge && high ? `<span class="nav-badge">${high}</span>` : r.auto && store.settings.autoIrrigation ? '<span class="nav-auto" title="Mode autonome activé">AUTO</span>' : '';
    html += `<a class="nav-link ${active === r.path ? 'active' : ''}" href="#/${r.path}">${icon(r.icon)}<span>${r.label}</span>${extra}</a>`;
  }
  $('#nav').innerHTML = html;
}

function renderChrome() {
  const c = store.climate;
  const sim = store.settings.source === 'simulation';
  $('#sidebar-foot').innerHTML = `
    <div class="live"><span class="pulse"></span>${sim ? 'Démo : capteurs simulés' : 'Capteurs réels connectés'}</div>
    <div style="margin-top:4px">${String(c.hour).padStart(2, '0')}:00 · ${store.settings.autoIrrigation ? 'arrosage automatique' : 'arrosage manuel'}</div>`;
  $('#topbar-right').innerHTML = `
    <span class="badge neutral plain hide-sm" title="Conditions sur le site pilote">${icon(c.raining ? 'rain' : 'sun').replace('<svg', '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"')} Cotonou · ${c.tempC.toFixed(0)} °C · ${c.humidity} % HR</span>
    ${store.settings.dataSaver ? '<span class="badge info plain">Économie de données</span>' : ''}
    ${navigator.onLine ? '' : '<span class="badge watch">Hors ligne</span>'}
    <button class="icon-btn help-btn" data-help title="Comment ça marche ?" aria-label="Aide">?</button>`;
}

async function route() {
  const token = ++navToken;
  const hash = location.hash.replace(/^#\/?/, '') || 'accueil';
  let [path, ...params] = hash.split('/');
  path = ALIASES[path] || path;
  const r = path === PASSPORT.path ? PASSPORT : ROUTES.find((x) => x.path === path);
  if (!r) {
    location.hash = '#/accueil';
    return;
  }
  renderNav(r.parent || r.path);
  $('#sidebar').classList.remove('open');
  cleanup?.();
  cleanup = null;
  const view = $('#view');
  view.innerHTML = '<div class="empty">Chargement…</div>';
  const mod = await r.load();
  if (token !== navToken) return;
  view.innerHTML = '';
  view.className = 'view-enter';
  const meta = mod.meta?.(params.map(decodeURIComponent)) ?? {};
  $('#page-title').textContent = meta.title ?? r.label;
  $('#page-sub').textContent = meta.sub ?? '';
  document.title = `${meta.title ?? r.label} · GreenTrack`;
  cleanup = mod.render(view, params.map(decodeURIComponent)) || null;
  view.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function banner() {
  document.querySelector('.offline-banner')?.remove();
  if (!navigator.onLine) {
    const b = document.createElement('div');
    b.className = 'offline-banner';
    b.textContent = 'Connexion perdue — GreenTrack continue de fonctionner avec les dernières données en cache.';
    $('.topbar').after(b);
  }
  renderChrome();
}

$('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
window.addEventListener('hashchange', route);
window.addEventListener('online', banner);
window.addEventListener('offline', banner);

let lastNav = 0;
on((type) => {
  renderChrome();
  if (type !== 'tick' || Date.now() - lastNav > 5000) {
    lastNav = Date.now();
    const active = document.querySelector('.nav-link.active')?.getAttribute('href')?.slice(2);
    renderNav(active);
  }
  if (type === 'settings') startSource();
});

// ── Guide de prise en main (3 étapes, affiché à la première visite) ──
const GUIDE = [
  { ic: 'cpu', t: 'Un capteur au pied de chaque plante', d: 'Il mesure l’humidité de la terre toutes les 15 minutes et l’envoie à GreenTrack.' },
  { ic: 'drop', t: 'Une note de soif de 0 à 100', d: 'GreenTrack compare cette humidité aux besoins de l’espèce (un baobab boit moins qu’un cocotier). <b style="color:#2f9e44">Vert</b> = tout va bien, <b style="color:#d98e1f">orange</b> = à surveiller, <b style="color:#d64545">rouge</b> = a soif.' },
  { ic: 'zap', t: 'L’arrosage se fait tout seul', d: 'En <b>mode autonome</b>, la vanne s’ouvre automatiquement, juste ce qu’il faut, et attend s’il pleut. Tout est noté dans <b>Arrosages</b>.' },
];
function openGuide() {
  document.querySelector('.modal-back')?.remove();
  const m = document.createElement('div');
  m.className = 'modal-back';
  m.innerHTML = `<div class="modal" role="dialog" aria-label="Comment ça marche">
    <h2>Comment fonctionne GreenTrack ?</h2>
    <p class="muted" style="margin:4px 0 18px">En 3 idées simples.</p>
    ${GUIDE.map((g, i) => `<div class="guide-step"><span class="guide-num">${i + 1}</span><div><strong>${g.t}</strong><p>${g.d}</p></div></div>`).join('')}
    <div class="row" style="justify-content:flex-end;margin-top:18px;gap:8px">
      <a class="btn" href="#/maquette-3d" data-close>Voir le parc en 3D</a>
      <button class="btn btn-primary" data-close>C’est compris</button>
    </div></div>`;
  document.body.appendChild(m);
  m.addEventListener('click', (e) => {
    if (e.target === m || e.target.closest('[data-close]')) {
      m.remove();
      try {
        localStorage.setItem('greentrack.guide', '1');
      } catch {}
    }
  });
}
document.addEventListener('click', (e) => e.target.closest('[data-help]') && openGuide());

renderChrome();
startSource();
route();
try {
  if (!localStorage.getItem('greentrack.guide')) setTimeout(openGuide, 600);
} catch {}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

