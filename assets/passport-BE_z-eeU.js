import{C as e,N as t,_ as n,a as r,b as i,f as a,h as o,n as s,o as c,p as l,r as u,s as d,u as f,v as p,x as m}from"./index-BuKBe61a.js";import{Chart as h,thresholdPlugin as g}from"./charts-DH5BV0eM.js";var _=([n])=>{let r=m(n);return r?{title:`Passeport végétal · ${r.id}`,sub:`${e(r).name} — ${t(r.siteId).name}`}:{title:`Plante introuvable`}},v={ok:`L'humidité du sol couvre les besoins de l'espèce. Prochain contrôle automatique dans 1 h.`,watch:`Le sol s’assèche. Surveiller l’évolution ; un arrosage sera probablement nécessaire sous 24 à 48 h.`,water:`La plante est en stress hydrique. Déclencher un arrosage dès que possible, de préférence tôt le matin ou en fin de journée.`};function y(_,[y]){let b=m(y);if(!b){_.innerHTML=`<div class="card empty">Aucune plante avec le code « ${s(y)} ». <a href="#/plantations">Retour au registre</a></div>`;return}let x=()=>e(b),S=t(b.siteId);_.innerHTML=`
    <a href="#/plantations" class="btn btn-sm" style="margin-bottom:14px">${c(`back`)} Registre</a>
    <section class="card passport-head" id="head"></section>
    <div class="grid g-main mt">
      <div class="stack" style="display:flex;flex-direction:column;gap:16px">
        <div class="grid g-2">
          <section class="card card-pad" id="thirst"></section>
          <section class="card card-pad">
            <h3 style="font-size:14.5px">Besoins en eau de l’espèce</h3>
            <div class="small muted">Humidité du sol mesurée face aux seuils du ${s(x().name.toLowerCase())}</div>
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
          <p style="margin:0;color:var(--ink-2)">${s(x().maintenance)}</p>
        </section>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <section class="card card-pad"><h3 style="font-size:14.5px">Identité</h3><div class="facts" id="facts"></div></section>
        <section class="card card-pad"><h3 style="font-size:14.5px">Capteur IoT</h3><div class="facts" id="sensor"></div></section>
        <section class="card card-pad"><h3 style="font-size:14.5px;margin-bottom:14px">Historique d’entretien</h3><ul class="timeline" id="log"></ul></section>
      </div>
    </div>`;let C=e=>_.querySelector(e),w=x(),T=new h(C(`#c-hist`),{type:`line`,plugins:[g],data:{labels:b.history.map((e,t)=>t===b.history.length-1?`maint.`:`−${b.history.length-1-t} h`),datasets:[{data:[...b.history],borderColor:`#1f6a52`,backgroundColor:`rgba(47,158,68,.12)`,fill:!0,pointRadius:0,borderWidth:2.2,tension:.35}]},options:{plugins:{legend:{display:!1},tooltip:{callbacks:{label:e=>` Humidité : ${e.raw} %`}},thresholds:{lines:[{value:w.optimal,color:`#2f9e44`,label:`Optimum ${w.optimal} %`},{value:w.stress,color:`#d98e1f`,label:`Stress ${w.stress} %`},{value:w.wilting,color:`#d64545`,label:`Flétrissement ${w.wilting} %`}]}},scales:{x:{grid:{display:!1},ticks:{maxTicksLimit:9}},y:{suggestedMin:Math.max(0,w.wilting-4),suggestedMax:w.optimal+8,ticks:{callback:e=>`${e} %`}}}}}),E=e=>{e.target.closest(`#btn-water`)&&(o(b.id),l(`Arrosage déclenché pour ${b.id}`,`drop`),D()),e.target.closest(`#btn-resolve`)&&(b.log.unshift({date:new Date().toISOString().slice(0,10),type:`entretien`,text:`Intervention réalisée : ${b.issue}`}),b.issue=null,p(`watering`,{plantId:b.id}),l(`Intervention enregistrée`),D())};_.addEventListener(`click`,E);function D(){let e=x(),t=n(b);C(`#head`).innerHTML=`
      ${f(e)}
      <div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><h2>${s(e.name)} <span class="mono muted" style="font-size:15px">${b.id}</span></h2>${d(t.level)}${b.issue?`<span class="badge watch">Intervention requise</span>`:``}</div>
        <div class="sci">${s(e.scientific)} · ${s(e.family)}</div>
        <div class="small muted" style="margin-top:2px">${c(`pin`).replace(`<svg`,`<svg width="13" height="13" style="display:inline;vertical-align:-2px" fill="none" stroke="currentColor" stroke-width="2"`)} ${s(S.name)}, ${s(S.city)}</div>
      </div>
      <div class="passport-actions">
        ${b.issue?`<button class="btn" id="btn-resolve">${c(`wrench`)} Intervention faite</button>`:``}
        <a class="btn" href="#/carte/${b.siteId}/${b.id}">${c(`map`)} Carte</a>
        ${b.pos3d?`<a class="btn" href="#/maquette-3d/${b.id}">${c(`cube`)} Voir en 3D</a>`:``}
        <button class="btn btn-water" id="btn-water" ${b.sensor.online?``:`disabled title="Capteur hors ligne"`}>${c(`drop`)} Déclencher l’arrosage</button>
      </div>`,C(`#thirst`).innerHTML=`
      <div class="spread"><h3 style="font-size:14.5px">Indice de soif</h3><span class="small muted">mis à jour ${a(b.reading.ts)}</span></div>
      <div style="margin:10px 0 6px">${r(t.index,t.level)}</div>
      <div class="reco ${t.level.key}">
        ${c(t.level.key===`ok`?`check`:t.level.key===`watch`?`eye`:`drop`)}
        <div><strong>${t.level.label}${t.liters?` · ~${t.liters} L`:``}</strong><p>${v[t.level.key]}</p><p class="small" style="margin-top:6px;opacity:.85">${s(t.explanation)}</p></div>
      </div>`;let i=e.optimal+12,o=e=>`${Math.min(100,Math.max(0,e/i*100))}%`;C(`#scale`).innerHTML=`
      <div class="bar"></div>
      <div class="tick below" style="left:${o(e.wilting)}"><span>Flétr. ${e.wilting} %</span></div>
      <div class="tick" style="left:${o(e.stress)}"><span>Stress ${e.stress} %</span></div>
      <div class="tick" style="left:${o(e.optimal)}"><span>Optimum ${e.optimal} %</span></div>
      <div class="cursor" style="left:${o(b.reading.moisture)}" title="Mesure actuelle"></div>`,C(`#needs`).innerHTML=`
      <div><small>Humidité mesurée</small><b>${b.reading.moisture.toFixed(1)} %</b></div>
      <div><small>Température</small><b>${b.reading.tempC.toFixed(1)} °C</b></div>
      <div><small>Besoin adulte (saison sèche)</small><b>${e.dailyLiters} L / jour</b></div>
      <div><small>Tolérance à la sécheresse</small><b>${s(e.drought)}</b></div>`,C(`#facts`).innerHTML=`
      <div><small>Code</small><b class="mono">${b.id}</b></div>
      <div><small>Espèce</small><b>${s(e.name)}</b></div>
      <div><small>Âge</small><b>${b.age} an${b.age>1?`s`:``}</b></div>
      <div><small>Plantée en</small><b>${b.plantedYear}</b></div>
      <div><small>Hauteur estimée</small><b>${u(b.height,1)} m</b></div>
      <div><small>Croissance</small><b>${s(e.growth)}</b></div>
      <div style="grid-column:span 2"><small>Coordonnées GPS</small><b class="mono">${b.lat.toFixed(5)}, ${b.lng.toFixed(5)}</b></div>`,C(`#sensor`).innerHTML=`
      <div style="grid-column:span 2"><small>Identifiant</small><b class="mono">${b.sensor.id}</b></div>
      <div><small>État</small><b>${b.sensor.online?`<span class="badge ok">En ligne</span>`:`<span class="badge water">Hors ligne</span>`}</b></div>
      <div><small>Batterie</small><b style="color:${b.sensor.battery<20?`var(--water)`:`inherit`}">${b.sensor.battery} %</b></div>
      <div><small>Signal Wi-Fi</small><b>${b.sensor.rssi} dBm</b></div>
      <div><small>Firmware</small><b>v${b.sensor.firmware}</b></div>`,C(`#log`).innerHTML=b.log.map(e=>`<li class="${e.type}"><time>${s(e.date)}</time>${s(e.text)}</li>`).join(``),T.data.datasets[0].data=[...b.history],T.update(`none`)}D();let O=i(e=>e!==`settings`&&D());return()=>{O(),_.removeEventListener(`click`,E),T.destroy()}}export{_ as meta,y as render};