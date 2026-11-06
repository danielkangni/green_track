import { on, computeAlerts, speciesOf, emit } from '../core/store.js';
import { waterPlant } from '../core/sensors.js';
import { icon, esc, siteName, toast } from '../ui.js';

export const meta = () => ({ title: 'Alertes intelligentes', sub: 'Plantes nécessitant un arrosage, une surveillance ou une intervention terrain' });

const TYPES = [
  { k: '', label: 'Toutes' },
  { k: 'arrosage', label: 'Arrosage', ic: 'drop' },
  { k: 'surveillance', label: 'Surveillance', ic: 'eye' },
  { k: 'intervention', label: 'Intervention', ic: 'wrench' },
  { k: 'capteur', label: 'Capteurs', ic: 'cpu' },
];

export function render(el) {
  let type = '';
  el.innerHTML = `
    <div class="grid g-4" id="sum"></div>
    <div class="card mt">
      <div class="card-head" style="flex-wrap:wrap">
        <div class="row" id="types" style="gap:6px;flex-wrap:wrap"></div>
        <button class="btn btn-water" id="water-all">${icon('drop')} Arroser toutes les plantes assoiffées</button>
      </div>
      <div class="card-body" id="list"></div>
    </div>`;
  const q = (s) => el.querySelector(s);

  q('#types').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (b) ((type = b.dataset.t), draw());
  });
  q('#list').addEventListener('click', (e) => {
    const w = e.target.closest('[data-water]');
    if (w) {
      waterPlant(w.dataset.water);
      toast(`Arrosage déclenché pour ${w.dataset.water}`, 'drop');
      draw();
    }
    const r = e.target.closest('[data-resolve]');
    if (r) {
      const a = computeAlerts().find((x) => x.id === r.dataset.resolve);
      if (a) {
        a.plant.log.unshift({ date: new Date().toISOString().slice(0, 10), type: 'entretien', text: `Intervention réalisée : ${a.plant.issue}` });
        a.plant.issue = null;
        emit('watering', { plantId: a.plant.id });
        toast('Intervention enregistrée');
      }
    }
  });
  q('#water-all').addEventListener('click', () => {
    const list = computeAlerts().filter((a) => a.type === 'arrosage');
    list.forEach((a) => waterPlant(a.plant.id));
    toast(list.length ? `${list.length} arrosages déclenchés` : 'Aucune plante assoiffée', 'drop');
    draw();
  });

  function draw() {
    const all = computeAlerts();
    const n = (t) => all.filter((a) => a.type === t).length;
    q('#sum').innerHTML = [
      ['drop', '#fbe5e3', '#d64545', 'Arrosage nécessaire', n('arrosage')],
      ['eye', '#fcf1dc', '#d98e1f', 'Sous surveillance', n('surveillance')],
      ['wrench', '#fcf1dc', '#b5532f', 'Interventions terrain', n('intervention')],
      ['cpu', '#e2eff8', '#2b7bb9', 'Anomalies capteurs', n('capteur')],
    ]
      .map(([ic, bg, fg, l, v]) => `<div class="card kpi"><div class="kpi-label"><span class="kpi-icon" style="background:${bg};color:${fg}">${icon(ic)}</span>${l}</div><div class="kpi-value">${v}</div></div>`)
      .join('');
    q('#types').innerHTML = TYPES.map((t) => `<button class="chip ${type === t.k ? 'active' : ''}" data-t="${t.k}">${t.label} <span class="muted">${t.k ? n(t.k) : all.length}</span></button>`).join('');
    const list = all.filter((a) => !type || a.type === type);
    q('#list').innerHTML =
      list
        .map((a) => {
          const sp = speciesOf(a.plant);
          return `<div class="alert-item">
          <span class="alert-ico ${a.severity}">${icon(TYPES.find((t) => t.k === a.type)?.ic || 'alert')}</span>
          <div class="alert-main">
            <strong>${esc(a.title)}</strong>
            <span class="small muted"> · ${esc(sp.name)} <a class="mono" href="#/plante/${a.plant.id}">${a.plant.id}</a> · ${esc(siteName(a.plant.siteId).replace('Parc pilote — ', ''))}</span>
            <p>${esc(a.text)}</p>
          </div>
          <div class="alert-actions">
            ${a.type === 'arrosage' || a.type === 'surveillance' ? `<button class="btn btn-sm ${a.type === 'arrosage' ? 'btn-water' : ''}" data-water="${a.plant.id}">${icon('drop')} Arroser</button>` : ''}
            ${a.type === 'intervention' ? `<button class="btn btn-sm" data-resolve="${a.id}">${icon('check')} Traité</button>` : ''}
            <a class="btn btn-sm" href="#/plante/${a.plant.id}">Fiche</a>
          </div>
        </div>`;
        })
        .join('') || '<div class="empty">Aucune alerte dans cette catégorie.</div>';
  }
  draw();
  return on((t) => t !== 'settings' && draw());
}
