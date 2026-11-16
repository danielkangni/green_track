import{C as e,E as t,T as n,b as r,c as i,f as a,n as o,o as s}from"./index-BuKBe61a.js";var c=()=>({title:`Capteurs & IoT`,sub:`Parc de capteurs, architecture matérielle et paramètres de connexion`});function l(c){c.innerHTML=`
    <section class="card card-pad">
      <div class="spread" style="flex-wrap:wrap;margin-bottom:14px">
        <div><h3 style="font-size:14.5px">Architecture GreenTrack</h3><div class="small muted">Du capteur au tableau de bord — prête pour Arduino / ESP32</div></div>
        <div class="seg" id="source">
          <button data-src="simulation">Simulation</button>
          <button data-src="passerelle">Passerelle ESP32</button>
        </div>
      </div>
      <div class="arch">
        <div class="arch-node">${s(`drop`)}<strong>Sonde capacitive</strong><small>Humidité du sol à 20 cm<br/>+ DS18B20 (température)</small></div>
        <div class="arch-arrow"><span>→</span>analogique</div>
        <div class="arch-node">${s(`cpu`)}<strong>ESP32</strong><small>Mesure toutes les 15 min<br/>veille profonde · batterie + solaire</small></div>
        <div class="arch-arrow"><span>→</span>Wi-Fi / LoRa<br/>JSON</div>
        <div class="arch-node">${s(`server`)}<strong>Passerelle</strong><small>server/gateway.js<br/>agrège & met en cache</small></div>
        <div class="arch-arrow"><span>→</span>HTTP · REST</div>
        <div class="arch-node">${s(`dashboard`)}<strong>GreenTrack</strong><small>Indice de soif<br/>alertes · commande vanne</small></div>
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
    </section>`;let l=e=>c.querySelector(e);l(`#source`).addEventListener(`click`,e=>{let n=e.target.closest(`[data-src]`);n&&t({source:n.dataset.src})}),l(`#settings`).addEventListener(`change`,e=>{let n=e.target;n.name===`gatewayUrl`?t({gatewayUrl:n.value}):n.type===`checkbox`&&t({[n.name]:n.checked})}),l(`#fleet`).addEventListener(`click`,e=>{let t=e.target.closest(`tr[data-id]`);t&&(location.hash=`#/plante/${t.dataset.id}`)});function u(){let e=n.settings;l(`#source`).querySelectorAll(`button`).forEach(t=>t.classList.toggle(`active`,t.dataset.src===e.source)),l(`#settings`).innerHTML=`
      <label class="switch"><div><strong>Mode autonome</strong><p>GreenTrack arrose seul chaque plante dont l’indice de soif atteint 65, et attend s’il pleut. Historique dans « Arrosages ».</p></div><span class="toggle"><input type="checkbox" name="autoIrrigation" ${e.autoIrrigation?`checked`:``}><span></span></span></label>
      <label class="switch"><div><strong>Mode économie de données</strong><p>Pour connexions limitées : fonds de carte désactivés, 3D allégée, rafraîchissement ralenti.</p></div><span class="toggle"><input type="checkbox" name="dataSaver" ${e.dataSaver?`checked`:``}><span></span></span></label>
      <div class="switch" style="display:block"><strong>Adresse de la passerelle</strong><p>Utilisée en mode « Passerelle ESP32 ».</p><input class="input mono" name="gatewayUrl" value="${o(e.gatewayUrl)}" style="width:100%;margin-top:6px"></div>`}function d(){let t=n.plants,r=t.filter(e=>e.sensor.online).length;l(`#fleet-sub`).textContent=`${t.length} capteurs · ${r} en ligne · source : ${n.settings.source===`simulation`?`données simulées`:n.settings.gatewayUrl}`,l(`#fleet`).innerHTML=`
      <thead><tr><th>Capteur</th><th>Plante</th><th>Espace vert</th><th>État</th><th>Batterie</th><th>Signal</th><th>Dernière mesure</th></tr></thead>
      <tbody>${[...t].sort((e,t)=>e.sensor.online-t.sensor.online||e.sensor.battery-t.sensor.battery).map(t=>`<tr data-id="${t.id}">
        <td class="mono">${t.sensor.id}</td>
        <td>${o(e(t).name)} <span class="mono muted">${t.id}</span></td>
        <td>${o(i(t.siteId).replace(`Parc pilote — `,``))}</td>
        <td>${t.sensor.online?`<span class="badge ok">En ligne</span>`:`<span class="badge water">Hors ligne</span>`}</td>
        <td><div class="thirst-bar" style="min-width:100px"><div class="track"><div class="fill" style="width:${t.sensor.battery}%;background:${t.sensor.battery<20?`var(--water)`:t.sensor.battery<45?`var(--watch)`:`var(--ok)`}"></div></div><b style="width:36px">${t.sensor.battery}%</b></div></td>
        <td>${t.sensor.rssi} dBm</td>
        <td class="small muted">${t.sensor.online?a(t.reading.ts):`> 6 h`}</td>
      </tr>`).join(``)}</tbody>`}return u(),d(),r(e=>e===`settings`?u():e===`tick`&&d())}export{c as meta,l as render};