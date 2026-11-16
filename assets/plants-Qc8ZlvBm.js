import{C as e,M as t,O as n,T as r,_ as i,b as a,c as o,d as s,l as c,n as l,o as u,s as d,u as f}from"./index-BuKBe61a.js";var p=()=>({title:`Passeports végétaux`,sub:`Registre de chaque plantation suivie, avec son indice de soif en temps réel`});function m(p){let m={q:``,site:``,species:``,level:``};p.innerHTML=`
    <div class="card card-pad" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <div class="search">${u(`search`)}<input class="input" id="q" placeholder="Rechercher un code, une espèce…" /></div>
      <select class="select" id="site"><option value="">Tous les espaces verts</option>${t.map(e=>`<option value="${e.id}">${l(e.name.replace(`Parc pilote — `,``))}</option>`).join(``)}</select>
      <select class="select" id="species"><option value="">Toutes les espèces</option>${r.species.map(e=>`<option value="${e.id}">${l(e.name)}</option>`).join(``)}</select>
      <div class="row" id="levels" style="gap:6px">
        <button class="chip active" data-level="">Tous</button>
        ${Object.values(n).map(e=>`<button class="chip" data-level="${e.key}"><span class="dot" style="background:${e.color}"></span>${e.short}</button>`).join(``)}
      </div>
      <span class="muted small" id="count" style="margin-left:auto"></span>
    </div>
    <div class="card mt"><div class="table-wrap"><table class="table" id="tbl"></table></div></div>`;let h=e=>p.querySelector(e);h(`#q`).addEventListener(`input`,e=>(m.q=e.target.value.toLowerCase(),g())),h(`#site`).addEventListener(`change`,e=>(m.site=e.target.value,g())),h(`#species`).addEventListener(`change`,e=>(m.species=e.target.value,g())),h(`#levels`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-level]`);t&&(m.level=t.dataset.level,h(`#levels`).querySelectorAll(`.chip`).forEach(e=>e.classList.toggle(`active`,e===t)),g())}),h(`#tbl`).addEventListener(`click`,e=>{let t=e.target.closest(`tr[data-id]`);t&&(location.hash=`#/plante/${t.dataset.id}`)});function g(){let t=r.plants.map(t=>({p:t,sp:e(t),d:i(t)})).filter(({p:e,sp:t,d:n})=>(!m.site||e.siteId===m.site)&&(!m.species||e.speciesId===m.species)&&(!m.level||n.level.key===m.level)&&(!m.q||`${e.id} ${t.name} ${t.scientific} ${o(e.siteId)}`.toLowerCase().includes(m.q))).sort((e,t)=>t.d.index-e.d.index);h(`#count`).textContent=`${t.length} plantation${t.length>1?`s`:``}`,h(`#tbl`).innerHTML=`
      <thead><tr><th>Plante</th><th>Espace vert</th><th>Âge</th><th>Humidité sol</th><th>Tendance 48 h</th><th>Indice de soif</th><th>Recommandation</th><th>Capteur</th></tr></thead>
      <tbody>${t.map(({p:e,sp:t,d:n})=>`<tr data-id="${e.id}">
          <td><div class="row">${f(t).replace(`species-avatar"`,`species-avatar" style="width:34px;height:34px;border-radius:9px;background:`+t.color+`1f;color:`+t.color+`"`)}<div><strong class="mono">${e.id}</strong><div class="small muted">${l(t.name)}</div></div></div></td>
          <td>${l(o(e.siteId).replace(`Parc pilote — `,``))}</td>
          <td>${e.age} an${e.age>1?`s`:``}</td>
          <td><b>${e.reading.moisture.toFixed(1)} %</b><div class="small muted">optimum ${t.optimal} %</div></td>
          <td>${c(e.history,n.level.color)}</td>
          <td>${s(n.index,n.level)}</td>
          <td>${d(n.level)}</td>
          <td>${e.sensor.online?`<span class="small">${u(`battery`).replace(`<svg`,`<svg width="14" height="14" style="display:inline;vertical-align:-2px" fill="none" stroke="currentColor" stroke-width="2"`)} ${e.sensor.battery} %</span>`:`<span class="badge water">Hors ligne</span>`}</td>
        </tr>`).join(``)||`<tr><td colspan="8" class="empty">Aucune plantation ne correspond aux filtres.</td></tr>`}</tbody>`}return g(),a(e=>e!==`settings`&&document.activeElement?.id!==`q`&&g())}export{p as meta,m as render};