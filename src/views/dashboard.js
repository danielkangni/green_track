import { store, on, stats, computeAlerts, diag, speciesOf, plantById, updateSettings } from '../core/store.js';
import { levelFor, LEVELS } from '../core/thirst.js';
import { SITES } from '../data/sites.js';
import { waterPlant, isWatering } from '../core/sensors.js';
import { icon, esc, fmt, fmtL, thirstBar, toast } from '../ui.js';

export const meta = () => ({ title: 'Accueil', sub: 'L’état de vos espaces verts en un coup d’œil' });

const SITE_COLORS = ['#1f6a52', '#2b7bb9', '#d98e1f', '#b5532f', '#7a5cc2', '#2f9e44'];

export function render(el) {
  el.innerHTML = `
    <section class="card hero" id="hero"></section>

    <div class="grid g-3 mt" id="kpis"></div>

    <div class="color-guide mt">
      <span class="muted">Comment lire les couleurs :</span>
      <span><i style="background:${LEVELS.ok.color}"></i><b>Vert</b> a assez d’eau</span>
      <span><i style="background:${LEVELS.watch.color}"></i><b>Orange</b> commence à avoir soif</span>
      <span><i style="background:${LEVELS.water.color}"></i><b>Rouge</b> a besoin d’eau</span>
    </div>

    <div class="grid g-2 mt">
      <section class="card">
        <div class="card-head"><h3>À faire maintenant</h3><a class="btn btn-sm" href="#/alertes">Tout voir ${icon('arrow')}</a></div>
        <div class="card-body" id="todo" style="padding-top:4px"></div>
      </section>
      <section class="card">
        <div class="card-head"><h3>Derniers arrosages</h3><a class="btn btn-sm" href="#/arrosages">Historique ${icon('arrow')}</a></div>
        <div class="card-body" id="last" style="padding-top:4px"></div>
      </section>
    </div>

    <details class="card mt more" id="more">
      <summary>${icon('dashboard')} Statistiques détaillées <span class="muted small">— humidité par site, consommation d’eau, comparaison des espaces verts</span></summary>
      <div class="more-body">
        <div class="grid g-2">
          <div><h4>Humidité moyenne du sol (48 h)</h4><div class="chart-box"><canvas id="c-moist"></canvas></div></div>
          <div><h4>Eau utilisée sur 30 jours</h4><div class="chart-box"><canvas id="c-water"></canvas></div></div>
        </div>
        <h4 class="mt">Espaces verts</h4>
        <div class="table-wrap"><table class="table" id="sites"></table></div>
      </div>
    </details>`;
  const q = (s) => el.querySelector(s);

  // Les graphiques ne sont chargés que si l'on ouvre « Statistiques détaillées »
  let charts = null;
  q('#more').addEventListener('toggle', async (e) => {
    setTimeout(refresh, 50);
    if (!e.target.open || charts) return;
    const { Chart } = await import('../charts.js');
    const hours = () => Array.from({ length: 48 }, (_, i) => `${String((((store.climate.hour - 47 + i) % 24) + 24) % 24).padStart(2, '0')}h`);
    const series = () =>
      SITES.map((s) => {
        const ps = store.plants.filter((p) => p.siteId === s.id);
        return Array.from({ length: 48 }, (_, i) => +(ps.reduce((a, p) => a + (p.history[i] ?? p.reading.moisture), 0) / ps.length).toFixed(1));
      });
    const moist = new Chart(q('#c-moist'), {
      type: 'line',
      data: { labels: hours(), datasets: series().map((data, i) => ({ label: SITES[i].name.replace('Parc pilote — ', ''), data, borderColor: SITE_COLORS[i], backgroundColor: SITE_COLORS[i], borderWidth: 1.8, pointRadius: 0, tension: 0.35 })) },
      options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } }, y: { ticks: { callback: (v) => `${v} %` } } } },
    });
    const water = new Chart(q('#c-water'), {
      type: 'bar',
      data: {
        labels: store.water.days.map((d) => d.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
        datasets: [
          { label: 'Sans GreenTrack (arrosage fixe)', data: store.water.days.map((d) => d.schedule), backgroundColor: '#d9d4c5', borderRadius: 3 },
          { label: 'Avec GreenTrack', data: store.water.days.map((d) => d.smart), backgroundColor: '#2b7bb9', borderRadius: 3 },
        ],
      },
      options: { plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label} : ${fmtL(c.raw)}` } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: { ticks: { callback: (v) => `${fmt(v / 1000, 1)} m³` } } } },
    });
    charts = {
      update() {
        moist.data.labels = hours();
        series().forEach((d, i) => (moist.data.datasets[i].data = d));
        moist.update('none');
      },
      destroy() {
        moist.destroy();
        water.destroy();
      },
    };
  });

  function onClick(e) {
    const w = e.target.closest('[data-water]');
    if (w) {
      waterPlant(w.dataset.water);
      toast(`Arrosage lancé pour ${w.dataset.water}`, 'drop');
      refresh();
    }
    if (e.target.closest('[data-auto-on]')) {
      updateSettings({ autoIrrigation: true });
      toast('Mode autonome activé : GreenTrack arrose tout seul', 'zap');
    }
    const tr = e.target.closest('tr[data-site]');
    if (tr) location.hash = `#/carte/${tr.dataset.site}`;
  }
  el.addEventListener('click', onClick);

  function refresh() {
    const s = stats();
    const auto = store.settings.autoIrrigation;
    const thirsty = s.counts.water;
    const inProgress = store.plants.filter((p) => isWatering(p.id)).length;
    const level = thirsty ? LEVELS.water : s.counts.watch > s.total * 0.25 ? LEVELS.watch : LEVELS.ok;
    const title = thirsty ? `${thirsty} plante${thirsty > 1 ? 's ont' : ' a'} soif` : 'Tout va bien';
    const text = thirsty
      ? auto
        ? `Le <b>mode autonome</b> s’en occupe : ${inProgress ? `<b>${inProgress} arrosage${inProgress > 1 ? 's' : ''} en cours</b>, ` : ''}GreenTrack arrose sans intervention.`
        : 'Arrosez-les depuis la liste ci-dessous, ou laissez GreenTrack le faire pour vous.'
      : `Toutes les plantes ont assez d’eau.${auto ? ' Le mode autonome veille en continu.' : ''}`;
    q('#hero').innerHTML = `
      <div class="hero-ico" style="background:${level.color}1f;color:${level.color}">${icon(thirsty ? 'drop' : 'check')}</div>
      <div style="flex:1;min-width:220px"><h2>${title}</h2><p>${text}</p></div>
      ${
        auto
          ? `<a class="hero-auto" href="#/arrosages"><span class="pulse"></span><span><b>Mode autonome activé</b><small>Voir l’historique des arrosages</small></span></a>`
          : `<button class="btn btn-primary" data-auto-on>${icon('zap')} Activer le mode autonome</button>`
      }`;

    q('#kpis').innerHTML = [
      kpi('leaf', '#e3f3e6', '#237a35', 'Plantes surveillées', fmt(s.total), `dans ${SITES.length} espaces verts`),
      kpi('drop', '#fbe5e3', '#d64545', 'Ont soif maintenant', fmt(thirsty), `${fmt(s.counts.watch)} autres à surveiller`),
      kpi('savings', '#e2eff8', '#2b7bb9', 'Eau économisée ce mois', fmtL(s.saved), `soit <b class="up">${s.savedPct} %</b> de moins qu’un arrosage fixe`),
    ].join('');

    const todo = computeAlerts().filter((a) => a.severity !== 'low').slice(0, 4);
    q('#todo').innerHTML =
      todo
        .map((a) => {
          const sp = speciesOf(a.plant);
          const plain =
            a.type === 'arrosage' ? `${sp.name} a besoin d’environ ${diag(a.plant).liters} L d’eau`
            : a.type === 'surveillance' ? `${sp.name} commence à avoir soif`
            : a.type === 'capteur' ? 'Le capteur ne répond plus'
            : a.text;
          return `<div class="alert-item">
          <span class="alert-ico ${a.severity}">${icon(a.type === 'arrosage' ? 'drop' : a.type === 'capteur' ? 'cpu' : a.type === 'intervention' ? 'wrench' : 'eye')}</span>
          <div class="alert-main"><strong>${esc(plain)}</strong><p><a href="#/plante/${a.plant.id}" class="mono">${a.plant.id}</a> · ${esc(SITES.find((x) => x.id === a.plant.siteId).name.replace('Parc pilote — ', ''))}</p></div>
          ${isWatering(a.plant.id) ? '<span class="badge info">Arrosage en cours…</span>' : a.type === 'arrosage' && !auto ? `<button class="btn btn-sm btn-water" data-water="${a.plant.id}">${icon('drop')} Arroser</button>` : ''}
        </div>`;
        })
        .join('') || '<div class="empty">Rien à faire pour le moment.</div>';

    q('#last').innerHTML =
      store.waterings
        .slice(0, 5)
        .map((w) => {
          const p = plantById(w.plantId);
          return `<div class="alert-item">
          <span class="alert-ico low" style="${w.mode === 'auto' && w.status !== 'reporté' ? 'background:var(--ok-bg);color:var(--ok)' : ''}">${icon(w.status === 'reporté' ? 'rain' : w.mode === 'auto' ? 'zap' : 'drop')}</span>
          <div class="alert-main"><strong>${esc(p ? speciesOf(p).name : w.plantId)} ${w.status === 'reporté' ? '— reporté (pluie)' : `— ${w.liters} L`}</strong>
          <p>${w.mode === 'auto' ? 'Automatique' : 'Par un agent'} · ${new Date(w.ts).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div>
        </div>`;
        })
        .join('') || '<div class="empty">Aucun arrosage pour l’instant.</div>';

    if (q('#more').open) {
      charts?.update();
      q('#sites').innerHTML = `
        <thead><tr><th>Espace vert</th><th>Plantes</th><th>Soif moyenne</th><th>Répartition</th></tr></thead>
        <tbody>${SITES.map((site) => {
          const ps = store.plants.filter((p) => p.siteId === site.id);
          const ds = ps.map(diag);
          const avg = Math.round(ds.reduce((a, d) => a + d.index, 0) / ps.length);
          const c = { ok: 0, watch: 0, water: 0 };
          ds.forEach((d) => c[d.level.key]++);
          return `<tr data-site="${site.id}"><td><strong>${esc(site.name.replace('Parc pilote — ', ''))}</strong><div class="small muted">${site.city}</div></td><td>${ps.length}</td><td>${thirstBar(avg, levelFor(avg))}</td>
            <td style="min-width:120px"><div class="split">${['ok', 'watch', 'water'].map((k) => `<div style="width:${(c[k] / ps.length) * 100}%;background:${LEVELS[k].color}"></div>`).join('')}</div></td></tr>`;
        }).join('')}</tbody>`;
    }
  }

  refresh();
  const off = on((t) => t !== 'species' && refresh());
  return () => {
    off();
    el.removeEventListener('click', onClick);
    charts?.destroy();
  };
}

function kpi(ic, bg, fg, label, value, foot) {
  return `<div class="card kpi">
    <div class="kpi-label"><span class="kpi-icon" style="background:${bg};color:${fg}">${icon(ic)}</span>${label}</div>
    <div class="kpi-value">${value}</div>
    <div class="kpi-foot">${foot}</div>
  </div>`;
}
