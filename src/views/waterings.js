import { store, on, speciesOf, plantById, updateSettings } from '../core/store.js';
import { icon, esc, fmtL, siteName } from '../ui.js';

export const meta = () => ({ title: 'Arrosages', sub: 'Mode autonome et historique de tous les arrosages' });

const FILTERS = [
  { k: '', label: 'Tous' },
  { k: 'auto', label: 'Automatiques' },
  { k: 'manuel', label: 'Manuels' },
  { k: 'reporté', label: 'Reportés (pluie)' },
];

const when = (ts) => new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function render(el) {
  let filter = '';
  el.innerHTML = `
    <section class="card autonomy" id="auto"></section>
    <div class="grid g-4 mt" id="stats"></div>
    <section class="card mt">
      <div class="card-head" style="flex-wrap:wrap">
        <div class="row" id="filters" style="gap:6px;flex-wrap:wrap"></div>
        <button class="btn btn-sm" id="csv">${icon('arrow')} Exporter (CSV)</button>
      </div>
      <div class="table-wrap" style="margin-top:10px"><table class="table" id="tbl"></table></div>
    </section>`;
  const q = (s) => el.querySelector(s);

  q('#auto').addEventListener('change', (e) => e.target.name === 'auto' && updateSettings({ autoIrrigation: e.target.checked }));
  q('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (b) ((filter = b.dataset.f), draw());
  });
  q('#tbl').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) location.hash = `#/plante/${tr.dataset.id}`;
  });
  q('#csv').addEventListener('click', () => {
    const rows = [['date', 'plante', 'espece', 'site', 'declenchement', 'litres', 'humidite_avant', 'humidite_apres', 'statut']];
    for (const w of store.waterings) {
      const p = plantById(w.plantId);
      rows.push([new Date(w.ts).toISOString(), w.plantId, p ? speciesOf(p).name : '', p ? siteName(p.siteId) : '', w.mode, w.liters, w.before ?? '', w.after ?? '', w.status]);
    }
    const blob = new Blob(['﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'greentrack-arrosages.csv' });
    a.click();
    URL.revokeObjectURL(a.href);
  });

  function drawAuto() {
    const on_ = store.settings.autoIrrigation;
    q('#auto').innerHTML = `
      <div class="autonomy-ico ${on_ ? 'on' : ''}">${icon('zap')}</div>
      <div style="flex:1;min-width:220px">
        <h2>Mode autonome ${on_ ? '<span class="badge ok">Activé</span>' : '<span class="badge neutral">Désactivé</span>'}</h2>
        <p>${
          on_
            ? 'GreenTrack arrose <b>tout seul</b> chaque plante qui a soif, avec la juste quantité d’eau. S’il pleut, il attend. Chaque arrosage est noté ci-dessous.'
            : 'GreenTrack vous <b>prévient</b> quand une plante a soif, et vous décidez d’arroser. Activez le mode autonome pour qu’il le fasse à votre place.'
        }</p>
      </div>
      <label class="toggle toggle-lg"><input type="checkbox" name="auto" ${on_ ? 'checked' : ''}><span></span></label>`;
  }

  function draw() {
    const week = store.waterings.filter((w) => Date.now() - w.ts < 7 * 86400000);
    const done = week.filter((w) => w.status !== 'reporté');
    const autoPct = done.length ? Math.round((done.filter((w) => w.mode === 'auto').length / done.length) * 100) : 0;
    q('#stats').innerHTML = [
      ['drop', '#e2eff8', '#2b7bb9', 'Arrosages (7 jours)', done.length],
      ['savings', '#e2eff8', '#2b7bb9', 'Eau utilisée (7 jours)', fmtL(done.reduce((a, w) => a + w.liters, 0))],
      ['zap', '#e3f3e6', '#237a35', 'Faits automatiquement', `${autoPct} %`],
      ['rain', '#efece4', '#4a5a53', 'Reportés grâce à la pluie', week.filter((w) => w.status === 'reporté').length],
    ]
      .map(([ic, bg, fg, l, v]) => `<div class="card kpi"><div class="kpi-label"><span class="kpi-icon" style="background:${bg};color:${fg}">${icon(ic)}</span>${l}</div><div class="kpi-value">${v}</div></div>`)
      .join('');

    q('#filters').innerHTML = FILTERS.map((f) => `<button class="chip ${filter === f.k ? 'active' : ''}" data-f="${f.k}">${f.label}</button>`).join('');
    const list = store.waterings.filter((w) => !filter || (filter === 'reporté' ? w.status === 'reporté' : w.mode === filter && w.status !== 'reporté')).slice(0, 150);
    q('#tbl').innerHTML = `
      <thead><tr><th>Quand</th><th>Plante</th><th>Déclenché par</th><th>Eau</th><th>Humidité du sol</th><th>Statut</th></tr></thead>
      <tbody>${
        list
          .map((w) => {
            const p = plantById(w.plantId);
            const sp = p ? speciesOf(p) : null;
            const status =
              w.status === 'terminé' ? '<span class="badge ok">Terminé</span>'
              : w.status === 'reporté' ? `<span class="badge neutral">Reporté · ${esc(w.note || '')}</span>`
              : w.status === 'envoyé' ? '<span class="badge info">Commande envoyée</span>'
              : '<span class="badge info">En cours…</span>';
            return `<tr data-id="${w.plantId}">
            <td class="small">${when(w.ts)}</td>
            <td><strong>${esc(sp?.name ?? '?')}</strong> <span class="mono muted">${w.plantId}</span></td>
            <td>${w.mode === 'auto' ? `<span class="badge ok plain">${icon('zap').replace('<svg', '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"')} Automatique</span>` : `<span class="badge neutral plain">Agent (manuel)</span>`}</td>
            <td>${w.liters ? `${w.liters} L` : '—'}</td>
            <td>${w.before != null ? `${w.before} %` : ''}${w.after != null ? ` <span class="muted">→</span> <b style="color:var(--ok)">${w.after} %</b>` : ''}</td>
            <td>${status}</td>
          </tr>`;
          })
          .join('') || '<tr><td colspan="6" class="empty">Aucun arrosage pour ce filtre.</td></tr>'
      }</tbody>`;
  }
  drawAuto();
  draw();
  return on((t) => (t === 'settings' ? drawAuto() : draw()));
}
