import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { store, on, diag, speciesOf, plantById } from '../core/store.js';
import { waterPlant } from '../core/sensors.js';
import { LEVELS } from '../core/thirst.js';
import { SITES, siteById } from '../data/sites.js';
import { icon, esc, toast } from '../ui.js';

export const meta = () => ({ title: 'Carte interactive', sub: 'Localisation des espaces verts et de chaque plantation suivie' });

export function render(el, [siteId, plantId]) {
  const f = { levels: new Set(['ok', 'watch', 'water']), species: '' };
  el.innerHTML = `
    <div class="map-layout">
      <aside class="card map-panel">
        <div class="card-body">
          <h3 style="font-size:14px;margin-bottom:10px">Filtrer par état</h3>
          <div class="row" id="lv" style="gap:6px;flex-wrap:wrap">${Object.values(LEVELS).map((l) => `<button class="chip active" data-lv="${l.key}"><span class="dot" style="background:${l.color}"></span>${l.short}</button>`).join('')}</div>
          <h3 style="font-size:14px;margin:16px 0 8px">Espèce</h3>
          <select class="select" id="sp" style="width:100%"><option value="">Toutes les espèces</option>${store.species.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
          <h3 style="font-size:14px;margin:18px 0 6px">Espaces verts</h3>
          <div class="site-list" id="sites"></div>
          <p class="small muted" id="note" style="margin-top:14px"></p>
        </div>
      </aside>
      <div id="map"></div>
    </div>`;
  const q = (s) => el.querySelector(s);

  const map = L.map(q('#map'), { zoomControl: true, preferCanvas: true }).setView([6.40, 2.38], 11);
  if (!store.settings.dataSaver) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© contributeurs OpenStreetMap',
    }).addTo(map);
    q('#note').textContent = 'Les fonds de carte consultés sont mis en cache pour un usage hors connexion.';
  } else {
    q('#note').innerHTML = 'Mode économie de données : fond de carte désactivé. Les positions restent exactes. <a href="#/capteurs">Modifier</a>';
  }

  // Emprise des sites
  for (const s of SITES) {
    L.circle([s.lat, s.lng], { radius: Math.sqrt(s.area * 10000) * 0.75, color: '#1f6a52', weight: 1.2, fillColor: '#2f9e44', fillOpacity: 0.07, dashArray: '4 4' })
      .addTo(map)
      .bindTooltip(s.name, { direction: 'top' });
  }

  const layer = L.layerGroup().addTo(map);
  const markers = new Map();

  function popup(p) {
    const sp = speciesOf(p);
    const d = diag(p);
    return `<div class="popup">
      <h4>${esc(sp.name)} <span class="mono muted">${p.id}</span></h4>
      <div class="small muted">${esc(siteById(p.siteId).name)}</div>
      <div class="row"><span class="badge ${d.level.key}">${d.level.label}</span></div>
      <div class="row small"><span>Indice de soif <b>${d.index}</b>/100</span><span>Sol <b>${p.reading.moisture.toFixed(1)} %</b></span></div>
      <div class="row">
        <a class="btn btn-sm" href="#/plante/${p.id}">Passeport</a>
        ${d.level.key !== 'ok' && p.sensor.online ? `<button class="btn btn-sm btn-water" data-water="${p.id}">${icon('drop')} Arroser</button>` : ''}
      </div>
    </div>`;
  }

  function draw() {
    for (const p of store.plants) {
      const d = diag(p);
      const visible = f.levels.has(d.level.key) && (!f.species || p.speciesId === f.species);
      let m = markers.get(p.id);
      if (!visible) {
        if (m) layer.removeLayer(m);
        continue;
      }
      const style = { radius: p.siteId === 'amazones' ? 6 : 5, color: '#fff', weight: 1.5, fillColor: p.sensor.online ? d.level.color : '#8a948f', fillOpacity: 0.95 };
      if (!m) {
        m = L.circleMarker([p.lat, p.lng], style).bindPopup(() => popup(p));
        markers.set(p.id, m);
      } else m.setStyle(style);
      if (!layer.hasLayer(m)) layer.addLayer(m);
    }
    q('#sites').innerHTML = SITES.map((s) => {
      const ps = store.plants.filter((p) => p.siteId === s.id);
      const c = { ok: 0, watch: 0, water: 0 };
      ps.forEach((p) => c[diag(p).level.key]++);
      return `<button data-site="${s.id}"><strong>${esc(s.name.replace('Parc pilote — ', ''))}</strong>
        <span class="small muted">${s.city} · ${ps.length} plantes</span>
        <div class="split" style="margin-top:6px;height:6px">${['ok', 'watch', 'water'].map((k) => `<div style="width:${(c[k] / ps.length) * 100}%;background:${LEVELS[k].color}"></div>`).join('')}</div>
      </button>`;
    }).join('');
  }

  const focusSite = (id) => {
    const s = siteById(id);
    if (s) map.flyTo([s.lat, s.lng], 17, { duration: store.settings.dataSaver ? 0 : 1 });
  };

  q('#lv').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lv]');
    if (!b) return;
    f.levels.has(b.dataset.lv) ? f.levels.delete(b.dataset.lv) : f.levels.add(b.dataset.lv);
    b.classList.toggle('active');
    draw();
  });
  q('#sp').addEventListener('change', (e) => ((f.species = e.target.value), draw()));
  q('#sites').addEventListener('click', (e) => {
    const b = e.target.closest('[data-site]');
    if (b) focusSite(b.dataset.site);
  });
  map.getContainer().addEventListener('click', (e) => {
    const b = e.target.closest('[data-water]');
    if (!b) return;
    waterPlant(b.dataset.water);
    toast(`Arrosage déclenché pour ${b.dataset.water}`, 'drop');
    map.closePopup();
  });

  draw();
  if (siteId) focusSite(siteId);
  if (plantId && plantById(plantId)) {
    const p = plantById(plantId);
    map.setView([p.lat, p.lng], 18);
    setTimeout(() => markers.get(p.id)?.openPopup(), 300);
  }
  setTimeout(() => map.invalidateSize(), 50);

  const off = on((t) => t !== 'settings' && draw());
  return () => {
    off();
    map.remove();
  };
}
