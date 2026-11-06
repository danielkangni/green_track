import { store, updateSpecies, resetSpecies } from '../core/store.js';
import { thirstIndex, levelFor } from '../core/thirst.js';
import { icon, esc, speciesAvatar, levelBadge, toast } from '../ui.js';

export const meta = () => ({ title: 'Gestion des espèces', sub: 'Profils de besoins hydriques configurables, utilisés par l’intelligence végétale' });

const FIELDS = [
  { k: 'optimal', label: 'Humidité optimale', min: 5, max: 45, unit: '%' },
  { k: 'stress', label: 'Seuil de stress', min: 3, max: 40, unit: '%' },
  { k: 'wilting', label: 'Point de flétrissement', min: 1, max: 30, unit: '%' },
  { k: 'dailyLiters', label: 'Besoin adulte (L/j)', min: 5, max: 120, unit: 'L' },
  { k: 'kc', label: 'Coef. cultural Kc', min: 0.3, max: 1.2, step: 0.05, unit: '' },
];

export function render(el) {
  el.innerHTML = `
    <div class="card card-pad spread" style="flex-wrap:wrap">
      <div style="max-width:720px">
        <strong>Comment fonctionne l’intelligence végétale ?</strong>
        <p class="muted" style="margin:4px 0 0">Chaque capteur mesure l’humidité du sol au pied de la plante. GreenTrack la compare aux seuils de <b>son espèce</b>, puis ajuste le résultat selon la température et l’âge du sujet. On obtient un <b>indice de soif de 0 à 100</b> et une recommandation : aucune intervention (&lt; 35), surveillance (35–64) ou arrosage nécessaire (≥ 65).</p>
      </div>
      <div class="row">
        <button class="btn" id="reset">${icon('reset')} Valeurs par défaut</button>
        <button class="btn btn-primary" id="add">${icon('plus')} Nouvelle espèce</button>
      </div>
    </div>
    <div class="grid g-3 mt" id="cards"></div>`;

  const cards = el.querySelector('#cards');

  function card(sp) {
    const count = store.plants.filter((p) => p.speciesId === sp.id).length;
    return `<article class="card species-card" data-id="${sp.id}">
      <header>${speciesAvatar(sp)}<div style="flex:1;min-width:0"><h3>${esc(sp.name)}</h3><div class="small muted"><i>${esc(sp.scientific)}</i> · ${count} sujet${count > 1 ? 's' : ''}</div></div></header>
      <div class="body">
        ${FIELDS.map((f) => `<label class="range-row"><span>${f.label}</span><input type="range" name="${f.k}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${sp[f.k]}"><output>${sp[f.k]}${f.unit && ` ${f.unit}`}</output></label>`).join('')}
        <div class="row small muted" style="gap:14px;margin-top:6px"><span>Sécheresse : <b style="color:var(--ink)">${esc(sp.drought)}</b></span><span>Croissance : <b style="color:var(--ink)">${esc(sp.growth)}</b></span></div>
        <div class="sim-box" data-sim></div>
      </div>
    </article>`;
  }

  function sim(cardEl, sp) {
    // Simulation pédagogique : que dirait GreenTrack pour un sujet adulte à 31 °C ?
    const levels = [sp.optimal + 2, (sp.optimal + sp.stress) / 2, sp.stress - 1, sp.wilting].map((m) => {
      const i = thirstIndex({ moisture: m, tempC: 31 }, sp, 10);
      return `<div class="spread" style="padding:3px 0"><span>Sol à ${m.toFixed(1)} %</span><span class="row" style="gap:8px"><b>${i}</b>${levelBadge(levelFor(i), levelFor(i).short)}</span></div>`;
    });
    cardEl.querySelector('[data-sim]').innerHTML = `<div class="small muted" style="margin-bottom:4px">Simulation · sujet adulte, 31 °C</div>${levels.join('')}`;
  }

  function draw() {
    cards.innerHTML = store.species.map(card).join('');
    cards.querySelectorAll('.species-card').forEach((c) => sim(c, store.species.find((s) => s.id === c.dataset.id)));
  }

  let saveTimer;
  cards.addEventListener('input', (e) => {
    const input = e.target.closest('input[type=range]');
    if (!input) return;
    const c = input.closest('.species-card');
    const sp = { ...store.species.find((s) => s.id === c.dataset.id) };
    sp[input.name] = +input.value;
    // Cohérence des seuils : flétrissement < stress < optimum
    if (sp.stress >= sp.optimal) sp.stress = sp.optimal - 1;
    if (sp.wilting >= sp.stress) sp.wilting = sp.stress - 1;
    c.querySelectorAll('input[type=range]').forEach((r) => {
      r.value = sp[r.name];
      const f = FIELDS.find((x) => x.k === r.name);
      r.nextElementSibling.textContent = `${sp[r.name]}${f.unit && ` ${f.unit}`}`;
    });
    sim(c, sp);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => updateSpecies(sp), 250);
  });

  el.querySelector('#reset').addEventListener('click', () => {
    resetSpecies();
    draw();
    toast('Profils réinitialisés');
  });
  el.querySelector('#add').addEventListener('click', () => {
    const name = prompt('Nom courant de la nouvelle espèce (ex. Teck) :');
    if (!name) return;
    const sci = prompt('Nom scientifique (ex. Tectona grandis) :') || '';
    const id = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
    if (store.species.some((s) => s.id === id)) return toast('Cette espèce existe déjà', 'alert');
    updateSpecies({ id, name, scientific: sci, family: '—', optimal: 22, stress: 14, wilting: 8, dailyLiters: 25, kc: 0.75, drought: 'moyenne', growth: 'moyenne', maintenance: 'À compléter par les agents de l’ANAP.', color: '#4f8a3a' });
    draw();
    toast(`Espèce « ${name} » ajoutée`);
  });

  draw();
}
