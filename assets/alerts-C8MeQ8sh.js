import{C as e,b as t,c as n,g as r,h as i,n as a,o,p as s,v as c}from"./index-BuKBe61a.js";var l=()=>({title:`Alertes intelligentes`,sub:`Plantes nécessitant un arrosage, une surveillance ou une intervention terrain`}),u=[{k:``,label:`Toutes`},{k:`arrosage`,label:`Arrosage`,ic:`drop`},{k:`surveillance`,label:`Surveillance`,ic:`eye`},{k:`intervention`,label:`Intervention`,ic:`wrench`},{k:`capteur`,label:`Capteurs`,ic:`cpu`}];function d(l){let d=``;l.innerHTML=`
    <div class="grid g-4" id="sum"></div>
    <div class="card mt">
      <div class="card-head" style="flex-wrap:wrap">
        <div class="row" id="types" style="gap:6px;flex-wrap:wrap"></div>
        <button class="btn btn-water" id="water-all">${o(`drop`)} Arroser toutes les plantes assoiffées</button>
      </div>
      <div class="card-body" id="list"></div>
    </div>`;let f=e=>l.querySelector(e);f(`#types`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-t]`);t&&(d=t.dataset.t,p())}),f(`#list`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-water]`);t&&(i(t.dataset.water),s(`Arrosage déclenché pour ${t.dataset.water}`,`drop`),p());let n=e.target.closest(`[data-resolve]`);if(n){let e=r().find(e=>e.id===n.dataset.resolve);e&&(e.plant.log.unshift({date:new Date().toISOString().slice(0,10),type:`entretien`,text:`Intervention réalisée : ${e.plant.issue}`}),e.plant.issue=null,c(`watering`,{plantId:e.plant.id}),s(`Intervention enregistrée`))}}),f(`#water-all`).addEventListener(`click`,()=>{let e=r().filter(e=>e.type===`arrosage`);e.forEach(e=>i(e.plant.id)),s(e.length?`${e.length} arrosages déclenchés`:`Aucune plante assoiffée`,`drop`),p()});function p(){let t=r(),i=e=>t.filter(t=>t.type===e).length;f(`#sum`).innerHTML=[[`drop`,`#fbe5e3`,`#d64545`,`Arrosage nécessaire`,i(`arrosage`)],[`eye`,`#fcf1dc`,`#d98e1f`,`Sous surveillance`,i(`surveillance`)],[`wrench`,`#fcf1dc`,`#b5532f`,`Interventions terrain`,i(`intervention`)],[`cpu`,`#e2eff8`,`#2b7bb9`,`Anomalies capteurs`,i(`capteur`)]].map(([e,t,n,r,i])=>`<div class="card kpi"><div class="kpi-label"><span class="kpi-icon" style="background:${t};color:${n}">${o(e)}</span>${r}</div><div class="kpi-value">${i}</div></div>`).join(``),f(`#types`).innerHTML=u.map(e=>`<button class="chip ${d===e.k?`active`:``}" data-t="${e.k}">${e.label} <span class="muted">${e.k?i(e.k):t.length}</span></button>`).join(``);let s=t.filter(e=>!d||e.type===d);f(`#list`).innerHTML=s.map(t=>{let r=e(t.plant);return`<div class="alert-item">
          <span class="alert-ico ${t.severity}">${o(u.find(e=>e.k===t.type)?.ic||`alert`)}</span>
          <div class="alert-main">
            <strong>${a(t.title)}</strong>
            <span class="small muted"> · ${a(r.name)} <a class="mono" href="#/plante/${t.plant.id}">${t.plant.id}</a> · ${a(n(t.plant.siteId).replace(`Parc pilote — `,``))}</span>
            <p>${a(t.text)}</p>
          </div>
          <div class="alert-actions">
            ${t.type===`arrosage`||t.type===`surveillance`?`<button class="btn btn-sm ${t.type===`arrosage`?`btn-water`:``}" data-water="${t.plant.id}">${o(`drop`)} Arroser</button>`:``}
            ${t.type===`intervention`?`<button class="btn btn-sm" data-resolve="${t.id}">${o(`check`)} Traité</button>`:``}
            <a class="btn btn-sm" href="#/plante/${t.plant.id}">Fiche</a>
          </div>
        </div>`}).join(``)||`<div class="empty">Aucune alerte dans cette catégorie.</div>`}return p(),t(e=>e!==`settings`&&p())}export{l as meta,d as render};