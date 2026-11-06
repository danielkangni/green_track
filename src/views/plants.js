import { store, on, diag, speciesOf } from '../core/store.js';
import { LEVELS } from '../core/thirst.js';
import { SITES } from '../data/sites.js';
import { icon, esc, siteName, thirstBar, levelBadge, sparkline, speciesAvatar } from '../ui.js';

export const meta = () => ({ title: 'Passeports végétaux', sub: 'Registre de chaque plantation suivie, avec son indice de soif en temps réel' });

export function render(el) {
  const f = { q: '', site: '', species: '', level: '' };
  el.innerHTML = `
    <div class="card card-pad" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <div class="search">${icon('search')}<input class="input" id="q" placeholder="Rechercher un code, une espèce…" /></div>
      <select class="select" id="site"><option value="">Tous les espaces verts</option>${SITES.map((s) => `<option value="${s.id}">${esc(s.name.replace('Parc pilote — ', ''))}</option>`).join('')}</select>
      <select class="select" id="species"><option value="">Toutes les espèces</option>${store.species.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
      <div class="row" id="levels" style="gap:6px">
        <button class="chip active" data-level="">Tous</button>
        ${Object.values(LEVELS).map((l) => `<button class="chip" data-level="${l.key}"><span class="dot" style="background:${l.color}"></span>${l.short}</button>`).join('')}
      </div>
      <span class="muted small" id="count" style="margin-left:auto"></span>
    </div>
    <div class="card mt"><div class="table-wrap"><table class="table" id="tbl"></table></div></div>`;

  const q = (s) => el.querySelector(s);
  q('#q').addEventListener('input', (e) => ((f.q = e.target.value.toLowerCase()), draw()));
  q('#site').addEventListener('change', (e) => ((f.site = e.target.value), draw()));
  q('#species').addEventListener('change', (e) => ((f.species = e.target.value), draw()));
  q('#levels').addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (!b) return;
    f.level = b.dataset.level;
    q('#levels').querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
    draw();
  });
  q('#tbl').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) location.hash = `#/plante/${tr.dataset.id}`;
  });

  function draw() {
    const rows = store.plants
      .map((p) => ({ p, sp: speciesOf(p), d: diag(p) }))
      .filter(({ p, sp, d }) => (!f.site || p.siteId === f.site) && (!f.species || p.speciesId === f.species) && (!f.level || d.level.key === f.level) && (!f.q || `${p.id} ${sp.name} ${sp.scientific} ${siteName(p.siteId)}`.toLowerCase().includes(f.q)))
      .sort((a, b) => b.d.index - a.d.index);
    q('#count').textContent = `${rows.length} plantation${rows.length > 1 ? 's' : ''}`;
    q('#tbl').innerHTML = `
      <thead><tr><th>Plante</th><th>Espace vert</th><th>Âge</th><th>Humidité sol</th><th>Tendance 48 h</th><th>Indice de soif</th><th>Recommandation</th><th>Capteur</th></tr></thead>
      <tbody>${
        rows
          .map(
            ({ p, sp, d }) => `<tr data-id="${p.id}">
          <td><div class="row">${speciesAvatar(sp).replace('species-avatar"', 'species-avatar" style="width:34px;height:34px;border-radius:9px;background:' + sp.color + '1f;color:' + sp.color + '"')}<div><strong class="mono">${p.id}</strong><div class="small muted">${esc(sp.name)}</div></div></div></td>
          <td>${esc(siteName(p.siteId).replace('Parc pilote — ', ''))}</td>
          <td>${p.age} an${p.age > 1 ? 's' : ''}</td>
          <td><b>${p.reading.moisture.toFixed(1)} %</b><div class="small muted">optimum ${sp.optimal} %</div></td>
          <td>${sparkline(p.history, d.level.color)}</td>
          <td>${thirstBar(d.index, d.level)}</td>
          <td>${levelBadge(d.level)}</td>
          <td>${p.sensor.online ? `<span class="small">${icon('battery').replace('<svg', '<svg width="14" height="14" style="display:inline;vertical-align:-2px" fill="none" stroke="currentColor" stroke-width="2"')} ${p.sensor.battery} %</span>` : '<span class="badge water">Hors ligne</span>'}</td>
        </tr>`
          )
          .join('') || '<tr><td colspan="8" class="empty">Aucune plantation ne correspond aux filtres.</td></tr>'
      }</tbody>`;
  }
  draw();
  return on((t) => t !== 'settings' && document.activeElement?.id !== 'q' && draw());
}
