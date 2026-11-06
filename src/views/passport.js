import { on, diag, speciesOf, plantById, emit } from '../core/store.js';
import { waterPlant } from '../core/sensors.js';
import { siteById } from '../data/sites.js';
import { Chart, thresholdPlugin } from '../charts.js';
import { icon, esc, fmt, gauge, levelBadge, speciesAvatar, toast, timeAgo } from '../ui.js';

export const meta = ([id]) => {
  const p = plantById(id);
  return p ? { title: `Passeport végétal · ${p.id}`, sub: `${speciesOf(p).name} — ${siteById(p.siteId).name}` } : { title: 'Plante introuvable' };
};

const RECO_TEXT = {
  ok: "L'humidité du sol couvre les besoins de l'espèce. Prochain contrôle automatique dans 1 h.",
  watch: 'Le sol s’assèche. Surveiller l’évolution ; un arrosage sera probablement nécessaire sous 24 à 48 h.',
  water: 'La plante est en stress hydrique. Déclencher un arrosage dès que possible, de préférence tôt le matin ou en fin de journée.',
};

export function render(el, [id]) {
  const p = plantById(id);
  if (!p) {
    el.innerHTML = `<div class="card empty">Aucune plante avec le code « ${esc(id)} ». <a href="#/plantations">Retour au registre</a></div>`;
    return;
  }
  const sp = () => speciesOf(p);
  const site = siteById(p.siteId);

  el.innerHTML = `
    <a href="#/plantations" class="btn btn-sm" style="margin-bottom:14px">${icon('back')} Registre</a>
    <section class="card passport-head" id="head"></section>
    <div class="grid g-main mt">
      <div class="stack" style="display:flex;flex-direction:column;gap:16px">
        <div class="grid g-2">
          <section class="card card-pad" id="thirst"></section>
          <section class="card card-pad">
            <h3 style="font-size:14.5px">Besoins en eau de l’espèce</h3>
            <div class="small muted">Humidité du sol mesurée face aux seuils du ${esc(sp().name.toLowerCase())}</div>
            <div class="scale" id="scale"></div>
            <div class="facts" id="needs" style="margin-top:14px"></div>
          </section>
        </div>
        <section class="card">
          <div class="card-head"><div><h3>Historique d’humidité du sol</h3><div class="sub">48 dernières heures · relevé horaire du capteur</div></div></div>
          <div class="card-body"><div class="chart-box"><canvas id="c-hist"></canvas></div></div>
        </section>
        <section class="card card-pad">
          <h3 style="font-size:14.5px;margin-bottom:12px">Entretien recommandé</h3>
          <p style="margin:0;color:var(--ink-2)">${esc(sp().maintenance)}</p>
        </section>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <section class="card card-pad"><h3 style="font-size:14.5px">Identité</h3><div class="facts" id="facts"></div></section>
        <section class="card card-pad"><h3 style="font-size:14.5px">Capteur IoT</h3><div class="facts" id="sensor"></div></section>
        <section class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:14px">Historique d’entretien</h3><ul class="timeline" id="log"></ul></section>
      </div>
    </div>`;

  const q = (s) => el.querySelector(s);
  const s0 = sp();
  const chart = new Chart(q('#c-hist'), {
    type: 'line',
    plugins: [thresholdPlugin],
    data: {
      labels: p.history.map((_, i) => (i === p.history.length - 1 ? 'maint.' : `−${p.history.length - 1 - i} h`)),
      datasets: [{ data: [...p.history], borderColor: '#1f6a52', backgroundColor: 'rgba(47,158,68,.12)', fill: true, pointRadius: 0, borderWidth: 2.2, tension: 0.35 }],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Humidité : ${c.raw} %` } },
        thresholds: {
          lines: [
            { value: s0.optimal, color: '#2f9e44', label: `Optimum ${s0.optimal} %` },
            { value: s0.stress, color: '#d98e1f', label: `Stress ${s0.stress} %` },
            { value: s0.wilting, color: '#d64545', label: `Flétrissement ${s0.wilting} %` },
          ],
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 9 } },
        y: { suggestedMin: Math.max(0, s0.wilting - 4), suggestedMax: s0.optimal + 8, ticks: { callback: (v) => `${v} %` } },
      },
    },
  });

  const onClick = (e) => {
    if (e.target.closest('#btn-water')) {
      waterPlant(p.id);
      toast(`Arrosage déclenché pour ${p.id}`, 'drop');
      draw();
    }
    if (e.target.closest('#btn-resolve')) {
      p.log.unshift({ date: new Date().toISOString().slice(0, 10), type: 'entretien', text: `Intervention réalisée : ${p.issue}` });
      p.issue = null;
      emit('watering', { plantId: p.id });
      toast('Intervention enregistrée');
      draw();
    }
  };
  el.addEventListener('click', onClick);

  function draw() {
    const s = sp();
    const d = diag(p);
    q('#head').innerHTML = `
      ${speciesAvatar(s)}
      <div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><h2>${esc(s.name)} <span class="mono muted" style="font-size:15px">${p.id}</span></h2>${levelBadge(d.level)}${p.issue ? '<span class="badge watch">Intervention requise</span>' : ''}</div>
        <div class="sci">${esc(s.scientific)} · ${esc(s.family)}</div>
        <div class="small muted" style="margin-top:2px">${icon('pin').replace('<svg', '<svg width="13" height="13" style="display:inline;vertical-align:-2px" fill="none" stroke="currentColor" stroke-width="2"')} ${esc(site.name)}, ${esc(site.city)}</div>
      </div>
      <div class="passport-actions">
        ${p.issue ? `<button class="btn" id="btn-resolve">${icon('wrench')} Intervention faite</button>` : ''}
        <a class="btn" href="#/carte/${p.siteId}/${p.id}">${icon('map')} Carte</a>
        ${p.pos3d ? `<a class="btn" href="#/maquette-3d/${p.id}">${icon('cube')} Voir en 3D</a>` : ''}
        <button class="btn btn-water" id="btn-water" ${p.sensor.online ? '' : 'disabled title="Capteur hors ligne"'}>${icon('drop')} Déclencher l’arrosage</button>
      </div>`;

    q('#thirst').innerHTML = `
      <div class="spread"><h3 style="font-size:14.5px">Indice de soif</h3><span class="small muted">mis à jour ${timeAgo(p.reading.ts)}</span></div>
      <div style="margin:10px 0 6px">${gauge(d.index, d.level)}</div>
      <div class="reco ${d.level.key}">
        ${icon(d.level.key === 'ok' ? 'check' : d.level.key === 'watch' ? 'eye' : 'drop')}
        <div><strong>${d.level.label}${d.liters ? ` · ~${d.liters} L` : ''}</strong><p>${RECO_TEXT[d.level.key]}</p><p class="small" style="margin-top:6px;opacity:.85">${esc(d.explanation)}</p></div>
      </div>`;

    const max = s.optimal + 12;
    const pos = (v) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`;
    q('#scale').innerHTML = `
      <div class="bar"></div>
      <div class="tick below" style="left:${pos(s.wilting)}"><span>Flétr. ${s.wilting} %</span></div>
      <div class="tick" style="left:${pos(s.stress)}"><span>Stress ${s.stress} %</span></div>
      <div class="tick" style="left:${pos(s.optimal)}"><span>Optimum ${s.optimal} %</span></div>
      <div class="cursor" style="left:${pos(p.reading.moisture)}" title="Mesure actuelle"></div>`;
    q('#needs').innerHTML = `
      <div><small>Humidité mesurée</small><b>${p.reading.moisture.toFixed(1)} %</b></div>
      <div><small>Température</small><b>${p.reading.tempC.toFixed(1)} °C</b></div>
      <div><small>Besoin adulte (saison sèche)</small><b>${s.dailyLiters} L / jour</b></div>
      <div><small>Tolérance à la sécheresse</small><b>${esc(s.drought)}</b></div>`;

    q('#facts').innerHTML = `
      <div><small>Code</small><b class="mono">${p.id}</b></div>
      <div><small>Espèce</small><b>${esc(s.name)}</b></div>
      <div><small>Âge</small><b>${p.age} an${p.age > 1 ? 's' : ''}</b></div>
      <div><small>Plantée en</small><b>${p.plantedYear}</b></div>
      <div><small>Hauteur estimée</small><b>${fmt(p.height, 1)} m</b></div>
      <div><small>Croissance</small><b>${esc(s.growth)}</b></div>
      <div style="grid-column:span 2"><small>Coordonnées GPS</small><b class="mono">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</b></div>`;

    q('#sensor').innerHTML = `
      <div style="grid-column:span 2"><small>Identifiant</small><b class="mono">${p.sensor.id}</b></div>
      <div><small>État</small><b>${p.sensor.online ? '<span class="badge ok">En ligne</span>' : '<span class="badge water">Hors ligne</span>'}</b></div>
      <div><small>Batterie</small><b style="color:${p.sensor.battery < 20 ? 'var(--water)' : 'inherit'}">${p.sensor.battery} %</b></div>
      <div><small>Signal Wi-Fi</small><b>${p.sensor.rssi} dBm</b></div>
      <div><small>Firmware</small><b>v${p.sensor.firmware}</b></div>`;

    q('#log').innerHTML = p.log.map((l) => `<li class="${l.type}"><time>${esc(l.date)}</time>${esc(l.text)}</li>`).join('');

    chart.data.datasets[0].data = [...p.history];
    chart.update('none');
  }
  draw();
  const off = on((t) => t !== 'settings' && draw());
  return () => {
    off();
    el.removeEventListener('click', onClick);
    chart.destroy();
  };
}

