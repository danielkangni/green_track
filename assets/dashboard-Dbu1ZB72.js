import{C as e,E as t,M as n,O as r,T as i,_ as a,b as o,d as s,g as c,h as l,i as u,k as d,m as f,n as p,o as m,p as h,r as g,t as _,w as v,x as y}from"./index-BuKBe61a.js";var b=()=>({title:`Accueil`,sub:`L’état de vos espaces verts en un coup d’œil`}),x=[`#1f6a52`,`#2b7bb9`,`#d98e1f`,`#b5532f`,`#7a5cc2`,`#2f9e44`];function S(b){b.innerHTML=`
    <section class="card hero" id="hero"></section>

    <div class="grid g-3 mt" id="kpis"></div>

    <div class="color-guide mt">
      <span class="muted">Comment lire les couleurs :</span>
      <span><i style="background:${r.ok.color}"></i><b>Vert</b> a assez d’eau</span>
      <span><i style="background:${r.watch.color}"></i><b>Orange</b> commence à avoir soif</span>
      <span><i style="background:${r.water.color}"></i><b>Rouge</b> a besoin d’eau</span>
    </div>

    <div class="grid g-2 mt">
      <section class="card">
        <div class="card-head"><h3>À faire maintenant</h3><a class="btn btn-sm" href="#/alertes">Tout voir ${m(`arrow`)}</a></div>
        <div class="card-body" id="todo" style="padding-top:4px"></div>
      </section>
      <section class="card">
        <div class="card-head"><h3>Derniers arrosages</h3><a class="btn btn-sm" href="#/arrosages">Historique ${m(`arrow`)}</a></div>
        <div class="card-body" id="last" style="padding-top:4px"></div>
      </section>
    </div>

    <details class="card mt more" id="more">
      <summary>${m(`dashboard`)} Statistiques détaillées <span class="muted small">— humidité par site, consommation d’eau, comparaison des espaces verts</span></summary>
      <div class="more-body">
        <div class="grid g-2">
          <div><h4>Humidité moyenne du sol (48 h)</h4><div class="chart-box"><canvas id="c-moist"></canvas></div></div>
          <div><h4>Eau utilisée sur 30 jours</h4><div class="chart-box"><canvas id="c-water"></canvas></div></div>
        </div>
        <h4 class="mt">Espaces verts</h4>
        <div class="table-wrap"><table class="table" id="sites"></table></div>
      </div>
    </details>`;let S=e=>b.querySelector(e),w=null;S(`#more`).addEventListener(`toggle`,async e=>{if(setTimeout(E,50),!e.target.open||w)return;let{Chart:t}=await _(async()=>{let{Chart:e}=await import(`./charts-DH5BV0eM.js`);return{Chart:e}},[]),r=()=>Array.from({length:48},(e,t)=>`${String(((i.climate.hour-47+t)%24+24)%24).padStart(2,`0`)}h`),a=()=>n.map(e=>{let t=i.plants.filter(t=>t.siteId===e.id);return Array.from({length:48},(e,n)=>+(t.reduce((e,t)=>e+(t.history[n]??t.reading.moisture),0)/t.length).toFixed(1))}),o=new t(S(`#c-moist`),{type:`line`,data:{labels:r(),datasets:a().map((e,t)=>({label:n[t].name.replace(`Parc pilote — `,``),data:e,borderColor:x[t],backgroundColor:x[t],borderWidth:1.8,pointRadius:0,tension:.35}))},options:{interaction:{mode:`index`,intersect:!1},plugins:{legend:{position:`bottom`}},scales:{x:{ticks:{maxTicksLimit:8},grid:{display:!1}},y:{ticks:{callback:e=>`${e} %`}}}}}),s=new t(S(`#c-water`),{type:`bar`,data:{labels:i.water.days.map(e=>e.date.toLocaleDateString(`fr-FR`,{day:`2-digit`,month:`short`})),datasets:[{label:`Sans GreenTrack (arrosage fixe)`,data:i.water.days.map(e=>e.schedule),backgroundColor:`#d9d4c5`,borderRadius:3},{label:`Avec GreenTrack`,data:i.water.days.map(e=>e.smart),backgroundColor:`#2b7bb9`,borderRadius:3}]},options:{plugins:{legend:{position:`bottom`},tooltip:{callbacks:{label:e=>` ${e.dataset.label} : ${u(e.raw)}`}}},scales:{x:{grid:{display:!1},ticks:{maxTicksLimit:8}},y:{ticks:{callback:e=>`${g(e/1e3,1)} m³`}}}}});w={update(){o.data.labels=r(),a().forEach((e,t)=>o.data.datasets[t].data=e),o.update(`none`)},destroy(){o.destroy(),s.destroy()}}});function T(e){let n=e.target.closest(`[data-water]`);n&&(l(n.dataset.water),h(`Arrosage lancé pour ${n.dataset.water}`,`drop`),E()),e.target.closest(`[data-auto-on]`)&&(t({autoIrrigation:!0}),h(`Mode autonome activé : GreenTrack arrose tout seul`,`zap`));let r=e.target.closest(`tr[data-site]`);r&&(location.hash=`#/carte/${r.dataset.site}`)}b.addEventListener(`click`,T);function E(){let t=v(),o=i.settings.autoIrrigation,l=t.counts.water,h=i.plants.filter(e=>f(e.id)).length,_=l?r.water:t.counts.watch>t.total*.25?r.watch:r.ok,b=l?`${l} plante${l>1?`s ont`:` a`} soif`:`Tout va bien`,x=l?o?`Le <b>mode autonome</b> s’en occupe : ${h?`<b>${h} arrosage${h>1?`s`:``} en cours</b>, `:``}GreenTrack arrose sans intervention.`:`Arrosez-les depuis la liste ci-dessous, ou laissez GreenTrack le faire pour vous.`:`Toutes les plantes ont assez d’eau.${o?` Le mode autonome veille en continu.`:``}`;S(`#hero`).innerHTML=`
      <div class="hero-ico" style="background:${_.color}1f;color:${_.color}">${m(l?`drop`:`check`)}</div>
      <div style="flex:1;min-width:220px"><h2>${b}</h2><p>${x}</p></div>
      ${o?`<a class="hero-auto" href="#/arrosages"><span class="pulse"></span><span><b>Mode autonome activé</b><small>Voir l’historique des arrosages</small></span></a>`:`<button class="btn btn-primary" data-auto-on>${m(`zap`)} Activer le mode autonome</button>`}`,S(`#kpis`).innerHTML=[C(`leaf`,`#e3f3e6`,`#237a35`,`Plantes surveillées`,g(t.total),`dans ${n.length} espaces verts`),C(`drop`,`#fbe5e3`,`#d64545`,`Ont soif maintenant`,g(l),`${g(t.counts.watch)} autres à surveiller`),C(`savings`,`#e2eff8`,`#2b7bb9`,`Eau économisée ce mois`,u(t.saved),`soit <b class="up">${t.savedPct} %</b> de moins qu’un arrosage fixe`)].join(``);let T=c().filter(e=>e.severity!==`low`).slice(0,4);S(`#todo`).innerHTML=T.map(t=>{let r=e(t.plant),i=t.type===`arrosage`?`${r.name} a besoin d’environ ${a(t.plant).liters} L d’eau`:t.type===`surveillance`?`${r.name} commence à avoir soif`:t.type===`capteur`?`Le capteur ne répond plus`:t.text;return`<div class="alert-item">
          <span class="alert-ico ${t.severity}">${m(t.type===`arrosage`?`drop`:t.type===`capteur`?`cpu`:t.type===`intervention`?`wrench`:`eye`)}</span>
          <div class="alert-main"><strong>${p(i)}</strong><p><a href="#/plante/${t.plant.id}" class="mono">${t.plant.id}</a> · ${p(n.find(e=>e.id===t.plant.siteId).name.replace(`Parc pilote — `,``))}</p></div>
          ${f(t.plant.id)?`<span class="badge info">Arrosage en cours…</span>`:t.type===`arrosage`&&!o?`<button class="btn btn-sm btn-water" data-water="${t.plant.id}">${m(`drop`)} Arroser</button>`:``}
        </div>`}).join(``)||`<div class="empty">Rien à faire pour le moment.</div>`,S(`#last`).innerHTML=i.waterings.slice(0,5).map(t=>{let n=y(t.plantId);return`<div class="alert-item">
          <span class="alert-ico low" style="${t.mode===`auto`&&t.status!==`reporté`?`background:var(--ok-bg);color:var(--ok)`:``}">${m(t.status===`reporté`?`rain`:t.mode===`auto`?`zap`:`drop`)}</span>
          <div class="alert-main"><strong>${p(n?e(n).name:t.plantId)} ${t.status===`reporté`?`— reporté (pluie)`:`— ${t.liters} L`}</strong>
          <p>${t.mode===`auto`?`Automatique`:`Par un agent`} · ${new Date(t.ts).toLocaleString(`fr-FR`,{day:`2-digit`,month:`short`,hour:`2-digit`,minute:`2-digit`})}</p></div>
        </div>`}).join(``)||`<div class="empty">Aucun arrosage pour l’instant.</div>`,S(`#more`).open&&(w?.update(),S(`#sites`).innerHTML=`
        <thead><tr><th>Espace vert</th><th>Plantes</th><th>Soif moyenne</th><th>Répartition</th></tr></thead>
        <tbody>${n.map(e=>{let t=i.plants.filter(t=>t.siteId===e.id),n=t.map(a),o=Math.round(n.reduce((e,t)=>e+t.index,0)/t.length),c={ok:0,watch:0,water:0};return n.forEach(e=>c[e.level.key]++),`<tr data-site="${e.id}"><td><strong>${p(e.name.replace(`Parc pilote — `,``))}</strong><div class="small muted">${e.city}</div></td><td>${t.length}</td><td>${s(o,d(o))}</td>
            <td style="min-width:120px"><div class="split">${[`ok`,`watch`,`water`].map(e=>`<div style="width:${c[e]/t.length*100}%;background:${r[e].color}"></div>`).join(``)}</div></td></tr>`}).join(``)}</tbody>`)}E();let D=o(e=>e!==`species`&&E());return()=>{D(),b.removeEventListener(`click`,T),w?.destroy()}}function C(e,t,n,r,i,a){return`<div class="card kpi">
    <div class="kpi-label"><span class="kpi-icon" style="background:${t};color:${n}">${m(e)}</span>${r}</div>
    <div class="kpi-value">${i}</div>
    <div class="kpi-foot">${a}</div>
  </div>`}export{b as meta,S as render};