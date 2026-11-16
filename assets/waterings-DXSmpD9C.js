import{C as e,E as t,T as n,b as r,c as i,i as a,n as o,o as s,x as c}from"./index-BuKBe61a.js";var l=()=>({title:`Arrosages`,sub:`Mode autonome et historique de tous les arrosages`}),u=[{k:``,label:`Tous`},{k:`auto`,label:`Automatiques`},{k:`manuel`,label:`Manuels`},{k:`reporté`,label:`Reportés (pluie)`}],d=e=>new Date(e).toLocaleString(`fr-FR`,{day:`2-digit`,month:`2-digit`,hour:`2-digit`,minute:`2-digit`});function f(l){let f=``;l.innerHTML=`
    <section class="card autonomy" id="auto"></section>
    <div class="grid g-4 mt" id="stats"></div>
    <section class="card mt">
      <div class="card-head" style="flex-wrap:wrap">
        <div class="row" id="filters" style="gap:6px;flex-wrap:wrap"></div>
        <button class="btn btn-sm" id="csv">${s(`arrow`)} Exporter (CSV)</button>
      </div>
      <div class="table-wrap" style="margin-top:10px"><table class="table" id="tbl"></table></div>
    </section>`;let p=e=>l.querySelector(e);p(`#auto`).addEventListener(`change`,e=>e.target.name===`auto`&&t({autoIrrigation:e.target.checked})),p(`#filters`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-f]`);t&&(f=t.dataset.f,h())}),p(`#tbl`).addEventListener(`click`,e=>{let t=e.target.closest(`tr[data-id]`);t&&(location.hash=`#/plante/${t.dataset.id}`)}),p(`#csv`).addEventListener(`click`,()=>{let t=[[`date`,`plante`,`espece`,`site`,`declenchement`,`litres`,`humidite_avant`,`humidite_apres`,`statut`]];for(let r of n.waterings){let n=c(r.plantId);t.push([new Date(r.ts).toISOString(),r.plantId,n?e(n).name:``,n?i(n.siteId):``,r.mode,r.liters,r.before??``,r.after??``,r.status])}let r=new Blob([`﻿`+t.map(e=>e.map(e=>`"${String(e).replace(/"/g,`""`)}"`).join(`;`)).join(`
`)],{type:`text/csv`}),a=Object.assign(document.createElement(`a`),{href:URL.createObjectURL(r),download:`greentrack-arrosages.csv`});a.click(),URL.revokeObjectURL(a.href)});function m(){let e=n.settings.autoIrrigation;p(`#auto`).innerHTML=`
      <div class="autonomy-ico ${e?`on`:``}">${s(`zap`)}</div>
      <div style="flex:1;min-width:220px">
        <h2>Mode autonome ${e?`<span class="badge ok">Activé</span>`:`<span class="badge neutral">Désactivé</span>`}</h2>
        <p>${e?`GreenTrack arrose <b>tout seul</b> chaque plante qui a soif, avec la juste quantité d’eau. S’il pleut, il attend. Chaque arrosage est noté ci-dessous.`:`GreenTrack vous <b>prévient</b> quand une plante a soif, et vous décidez d’arroser. Activez le mode autonome pour qu’il le fasse à votre place.`}</p>
      </div>
      <label class="toggle toggle-lg"><input type="checkbox" name="auto" ${e?`checked`:``}><span></span></label>`}function h(){let t=n.waterings.filter(e=>Date.now()-e.ts<6048e5),r=t.filter(e=>e.status!==`reporté`),i=r.length?Math.round(r.filter(e=>e.mode===`auto`).length/r.length*100):0;p(`#stats`).innerHTML=[[`drop`,`#e2eff8`,`#2b7bb9`,`Arrosages (7 jours)`,r.length],[`savings`,`#e2eff8`,`#2b7bb9`,`Eau utilisée (7 jours)`,a(r.reduce((e,t)=>e+t.liters,0))],[`zap`,`#e3f3e6`,`#237a35`,`Faits automatiquement`,`${i} %`],[`rain`,`#efece4`,`#4a5a53`,`Reportés grâce à la pluie`,t.filter(e=>e.status===`reporté`).length]].map(([e,t,n,r,i])=>`<div class="card kpi"><div class="kpi-label"><span class="kpi-icon" style="background:${t};color:${n}">${s(e)}</span>${r}</div><div class="kpi-value">${i}</div></div>`).join(``),p(`#filters`).innerHTML=u.map(e=>`<button class="chip ${f===e.k?`active`:``}" data-f="${e.k}">${e.label}</button>`).join(``);let l=n.waterings.filter(e=>!f||(f===`reporté`?e.status===`reporté`:e.mode===f&&e.status!==`reporté`)).slice(0,150);p(`#tbl`).innerHTML=`
      <thead><tr><th>Quand</th><th>Plante</th><th>Déclenché par</th><th>Eau</th><th>Humidité du sol</th><th>Statut</th></tr></thead>
      <tbody>${l.map(t=>{let n=c(t.plantId),r=n?e(n):null,i=t.status===`terminé`?`<span class="badge ok">Terminé</span>`:t.status===`reporté`?`<span class="badge neutral">Reporté · ${o(t.note||``)}</span>`:t.status===`envoyé`?`<span class="badge info">Commande envoyée</span>`:`<span class="badge info">En cours…</span>`;return`<tr data-id="${t.plantId}">
            <td class="small">${d(t.ts)}</td>
            <td><strong>${o(r?.name??`?`)}</strong> <span class="mono muted">${t.plantId}</span></td>
            <td>${t.mode===`auto`?`<span class="badge ok plain">${s(`zap`).replace(`<svg`,`<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"`)} Automatique</span>`:`<span class="badge neutral plain">Agent (manuel)</span>`}</td>
            <td>${t.liters?`${t.liters} L`:`—`}</td>
            <td>${t.before==null?``:`${t.before} %`}${t.after==null?``:` <span class="muted">→</span> <b style="color:var(--ok)">${t.after} %</b>`}</td>
            <td>${i}</td>
          </tr>`}).join(``)||`<tr><td colspan="6" class="empty">Aucun arrosage pour ce filtre.</td></tr>`}</tbody>`}return m(),h(),r(e=>e===`settings`?m():h())}export{l as meta,f as render};