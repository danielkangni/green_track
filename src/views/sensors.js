import { store, on, updateSettings, speciesOf } from '../core/store.js';
import { icon, esc, siteName, timeAgo } from '../ui.js';

export const meta = () => ({ title: 'Capteurs & IoT', sub: 'Parc de capteurs, architecture matérielle et paramètres de connexion' });

export function render(el) {
  el.innerHTML = `
    <section class="card card-pad">
      <div class="spread" style="flex-wrap:wrap;margin-bottom:14px">
        <div><h3 style="font-size:14.5px">Architecture GreenTrack</h3><div class="small muted">Du capteur au tableau de bord — prête pour Arduino / ESP32</div></div>
        <div class="seg" id="source">
          <button data-src="simulation">Simulation</button>
          <button data-src="passerelle">Passerelle ESP32</button>
        </div>
      </div>
      <div class="arch">
        <div class="arch-node">${icon('drop')}<strong>Sonde capacitive</strong><small>Humidité du sol à 20 cm<br/>+ DS18B20 (température)</small></div>
        <div class="arch-arrow"><span>→</span>analogique</div>
        <div class="arch-node">${icon('cpu')}<strong>ESP32</strong><small>Mesure toutes les 15 min<br/>veille profonde · batterie + solaire</small></div>
        <div class="arch-arrow"><span>→</span>Wi-Fi / LoRa<br/>JSON</div>
        <div class="arch-node">${icon('server')}<strong>Passerelle</strong><small>server/gateway.js<br/>agrège & met en cache</small></div>
        <div class="arch-arrow"><span>→</span>HTTP · REST</div>
        <div class="arch-node">${icon('dashboard')}<strong>GreenTrack</strong><small>Indice de soif<br/>alertes · commande vanne</small></div>
      </div>
      <div class="grid g-2 mt">
        <div>
          <div class="small muted" style="margin-bottom:6px">Trame envoyée par chaque ESP32 — <span class="mono">POST /api/readings</span></div>
<pre class="code">{
  "sensorId": "ESP32-AMZ-001",
  "moisture": 18.4,
  "tempC": 31.2,
  "battery": 87,
  "rssi": -67
}</pre>
        </div>
        <div id="settings"></div>
      </div>
    </section>
    <section class="card mt">
      <div class="card-head"><div><h3>Parc de capteurs</h3><div class="sub" id="fleet-sub"></div></div></div>
      <div class="table-wrap" style="margin-top:10px"><table class="table" id="fleet"></table></div>
    </section>`;
  const q = (s) => el.querySelector(s);

  q('#source').addEventListener('click', (e) => {
    const b = e.target.closest('[data-src]');
    if (b) updateSettings({ source: b.dataset.src });
  });
  q('#settings').addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'gatewayUrl') updateSettings({ gatewayUrl: t.value });
    else if (t.type === 'checkbox') updateSettings({ [t.name]: t.checked });
  });
  q('#fleet').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) location.hash = `#/plante/${tr.dataset.id}`;
  });

  function drawSettings() {
    const s = store.settings;
    q('#source').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.src === s.source));
    q('#settings').innerHTML = `
      <label class="switch"><div><strong>Mode autonome</strong><p>GreenTrack arrose seul chaque plante dont l’indice de soif atteint 65, et attend s’il pleut. Historique dans « Arrosages ».</p></div><span class="toggle"><input type="checkbox" name="autoIrrigation" ${s.autoIrrigation ? 'checked' : ''}><span></span></span></label>
      <label class="switch"><div><strong>Mode économie de données</strong><p>Pour connexions limitées : fonds de carte désactivés, 3D allégée, rafraîchissement ralenti.</p></div><span class="toggle"><input type="checkbox" name="dataSaver" ${s.dataSaver ? 'checked' : ''}><span></span></span></label>
      <div class="switch" style="display:block"><strong>Adresse de la passerelle</strong><p>Utilisée en mode « Passerelle ESP32 ».</p><input class="input mono" name="gatewayUrl" value="${esc(s.gatewayUrl)}" style="width:100%;margin-top:6px"></div>`;
  }

  function drawFleet() {
    const ps = store.plants;
    const online = ps.filter((p) => p.sensor.online).length;
    q('#fleet-sub').textContent = `${ps.length} capteurs · ${online} en ligne · source : ${store.settings.source === 'simulation' ? 'données simulées' : store.settings.gatewayUrl}`;
    q('#fleet').innerHTML = `
      <thead><tr><th>Capteur</th><th>Plante</th><th>Espace vert</th><th>État</th><th>Batterie</th><th>Signal</th><th>Dernière mesure</th></tr></thead>
      <tbody>${[...ps]
        .sort((a, b) => a.sensor.online - b.sensor.online || a.sensor.battery - b.sensor.battery)
        .map(
          (p) => `<tr data-id="${p.id}">
        <td class="mono">${p.sensor.id}</td>
        <td>${esc(speciesOf(p).name)} <span class="mono muted">${p.id}</span></td>
        <td>${esc(siteName(p.siteId).replace('Parc pilote — ', ''))}</td>
        <td>${p.sensor.online ? '<span class="badge ok">En ligne</span>' : '<span class="badge water">Hors ligne</span>'}</td>
        <td><div class="thirst-bar" style="min-width:100px"><div class="track"><div class="fill" style="width:${p.sensor.battery}%;background:${p.sensor.battery < 20 ? 'var(--water)' : p.sensor.battery < 45 ? 'var(--watch)' : 'var(--ok)'}"></div></div><b style="width:36px">${p.sensor.battery}%</b></div></td>
        <td>${p.sensor.rssi} dBm</td>
        <td class="small muted">${p.sensor.online ? timeAgo(p.reading.ts) : '> 6 h'}</td>
      </tr>`
        )
        .join('')}</tbody>`;
  }
  drawSettings();
  drawFleet();
  return on((t) => (t === 'settings' ? drawSettings() : t === 'tick' && drawFleet()));
}
