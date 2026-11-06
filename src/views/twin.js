// Maquette numérique 3D du parc pilote (Place des Amazones, Cotonou).
// Elle lit exactement le même état que le tableau de bord : un arrosage
// déclenché ici apparaît immédiatement dans les KPI, la carte et les alertes.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { store, on, diag, speciesOf, plantById, emit, logEvent } from '../core/store.js';
import { waterPlant } from '../core/sensors.js';
import { LEVELS } from '../core/thirst.js';
import { buildTree, buildPark, buildGateway, buildSensor } from '../twin/builders.js';
import { icon, esc, gauge, levelBadge, toast } from '../ui.js';

export const meta = () => ({ title: 'Maquette 3D', sub: 'Jumeau numérique du parc pilote — Place des Amazones, Cotonou' });

const MODES = [
  { k: 'nature', label: 'Naturel' },
  { k: 'health', label: 'État de santé' },
  { k: 'soil', label: 'Humidité du sol' },
  { k: 'sensors', label: 'Réseau de capteurs' },
];
const GATEWAY_POS = new THREE.Vector3(38, 0, 25);
const DRY = new THREE.Color('#b9a24c');
const OFF = new THREE.Color('#8a948f');

export function render(el, [initialId]) {
  const lite = store.settings.dataSaver;
  el.innerHTML = `
    <div class="twin-layout">
      <div class="twin-stage" id="stage">
        <div class="twin-loading" id="loading">Construction de la maquette…</div>
        <div class="twin-overlay">
          <div class="glass twin-toolbar" id="modes">${MODES.map((m) => `<button class="chip" data-mode="${m.k}">${m.label}</button>`).join('')}</div>
          <div class="glass twin-legend" id="legend"></div>
        </div>
        <div class="glass twin-hud" id="hud"></div>
        <div class="glass twin-tooltip" id="tip"></div>
        <div class="glass twin-hint">Glisser pour tourner · molette pour zoomer · clic droit pour déplacer · cliquer sur un arbre</div>
      </div>
      <aside class="card twin-side"><div class="card-body" id="side"></div></aside>
    </div>`;
  const q = (s) => el.querySelector(s);
  const stage = q('#stage');

  // ── Moteur ──
  const renderer = new THREE.WebGLRenderer({ antialias: !lite, powerPreference: lite ? 'low-power' : 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1 : 1.75));
  renderer.shadowMap.enabled = !lite;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const DAY_SKY = new THREE.Color('#cfe0e6'); // ciel légèrement voilé (harmattan)
  const DUSK_SKY = new THREE.Color('#e9b98f');
  const NIGHT_SKY = new THREE.Color('#58718a');
  scene.background = DAY_SKY.clone();
  scene.fog = new THREE.Fog(scene.background, 95, 230);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 600);
  camera.position.set(62, 52, 70);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.38;
  controls.minDistance = 12;
  controls.maxDistance = 190;

  const hemi = new THREE.HemisphereLight('#e8f4ff', '#6d7a45', 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.2);
  sun.castShadow = !lite;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 220 });
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  const park = buildPark(scene, { lite });
  const gw = buildGateway();
  gw.group.position.copy(GATEWAY_POS);
  scene.add(gw.group);

  // ── Arbres équipés ──
  const pilot = store.plants.filter((p) => p.pos3d);
  const soilTex = radialTexture();
  const items = new Map();
  const pickables = [];

  pilot.forEach((p, i) => {
    const t = buildTree(p.speciesId, p.height, 100 + i * 7);
    const root = new THREE.Group();
    root.position.set(p.pos3d.x, 0, p.pos3d.z);
    root.add(t.group);
    t.group.traverse((o) => {
      if (o.isMesh) {
        o.userData.plantId = p.id;
        pickables.push(o);
      }
    });
    const ringR = t.ring * Math.max(0.75, t.scale);

    const ring = new THREE.Mesh(new THREE.RingGeometry(ringR, ringR + 0.42, 40), new THREE.MeshBasicMaterial({ color: '#2f9e44', transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.09;
    root.add(ring);

    const soil = new THREE.Mesh(new THREE.CircleGeometry(ringR + 3.4, 32), new THREE.MeshBasicMaterial({ map: soilTex, color: '#2b7bb9', transparent: true, opacity: 0, depthWrite: false }));
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = 0.1;
    root.add(soil);

    const sensor = buildSensor();
    sensor.group.position.set(ringR + 0.7, 0, 0.5);
    sensor.group.traverse((o) => o.isMesh && ((o.userData.plantId = p.id), pickables.push(o)));
    root.add(sensor.group);

    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 6, 1, true), new THREE.MeshBasicMaterial({ color: '#2b7bb9', transparent: true, opacity: 0.5, depthWrite: false }));
    beam.visible = false;
    root.add(beam);

    const marker = makeMarker();
    marker.sprite.position.set(0, t.top * t.scale + 2.2, 0);
    root.add(marker.sprite);

    // Lien radio capteur → passerelle
    const sPos = new THREE.Vector3(p.pos3d.x + ringR + 0.7, 0.9, p.pos3d.z + 0.5);
    const gPos = GATEWAY_POS.clone().setY(7.6);
    const mid = sPos.clone().lerp(gPos, 0.5).setY(Math.max(sPos.y, gPos.y) + 6);
    const linkCurve = new THREE.QuadraticBezierCurve3(sPos, mid, gPos);
    const link = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linkCurve.getPoints(24)), new THREE.LineBasicMaterial({ color: '#2b7bb9', transparent: true, opacity: 0.35 }));
    link.visible = false;
    scene.add(link);
    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: '#7fc3f0' }));
    packet.visible = false;
    scene.add(packet);

    scene.add(root);
    items.set(p.id, { p, t, root, ring, soil, sensor, beam, marker, link, linkCurve, packet, phase: Math.random(), lastIndex: -1, ringR });
  });

  // ── Particules : arrosage & pluie ──
  const droplets = [];
  const dropGeo = new THREE.BufferGeometry();
  const DROP_MAX = lite ? 300 : 900;
  dropGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROP_MAX * 3), 3));
  const dropPts = new THREE.Points(dropGeo, new THREE.PointsMaterial({ color: '#6fb6ea', size: lite ? 0.35 : 0.28, transparent: true, opacity: 0.9, depthWrite: false }));
  dropPts.frustumCulled = false;
  scene.add(dropPts);
  const RAIN_N = lite ? 600 : 2200;
  const rainGeo = new THREE.BufferGeometry();
  const rainArr = new Float32Array(RAIN_N * 3);
  for (let i = 0; i < RAIN_N; i++) rainArr.set([(Math.random() - 0.5) * 120, Math.random() * 50, (Math.random() - 0.5) * 90], i * 3);
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainArr, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: '#9fc4dd', size: 0.18, transparent: true, opacity: 0.7, depthWrite: false }));
  rain.visible = false;
  scene.add(rain);
  let manualRain = 0;

  function spray(item) {
    item.sprayUntil = performance.now() + 4500;
  }

  // ── État de l'interface ──
  let mode = 'nature';
  let selected = null;
  let hovered = null;
  let fly = null;

  function setMode(m) {
    mode = m;
    q('#modes').querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.mode === m));
    const legends = {
      nature: `<b>Couleurs naturelles</b><div class="muted">Le feuillage jaunit avec le stress hydrique.</div>${ringLegend()}`,
      health: `<b>État de santé</b><div class="muted">Couronnes colorées selon l’indice de soif.</div>${ringLegend()}`,
      soil: `<b>Humidité du sol</b><div class="muted">Halo bleu intense = sol humide, pâle = sol sec.</div><div style="margin-top:6px;height:8px;border-radius:6px;background:linear-gradient(90deg,rgba(43,123,185,.1),#2b7bb9)"></div><div class="spread muted"><span>sec</span><span>optimum</span></div>`,
      sensors: `<b>Réseau de capteurs</b><div class="muted">${pilot.length} ESP32 reliés à la passerelle du parc.</div><div class="legend" style="margin-top:6px"><span><i style="background:#2b7bb9"></i>En ligne</span><span><i style="background:#8a948f"></i>Hors ligne</span></div>`,
    };
    q('#legend').innerHTML = legends[m];
    sync();
  }
  const ringLegend = () => `<div class="legend" style="margin-top:6px">${Object.values(LEVELS).map((l) => `<span><i style="background:${l.color}"></i>${l.short}</span>`).join('')}</div>`;

  // Applique l'état des données aux objets 3D
  function sync() {
    for (const it of items.values()) {
      const { p, t } = it;
      const sp = speciesOf(p);
      const d = diag(p);
      const color = new THREE.Color(p.sensor.online ? d.level.color : '#8a948f');
      it.ring.material.color.copy(color);
      it.ring.visible = mode !== 'soil';
      it.sensor.led.material.color.copy(color);
      it.marker.sprite.visible = mode !== 'sensors';
      if (it.lastIndex !== d.index || it.lastOnline !== p.sensor.online) {
        drawMarker(it.marker, p.sensor.online ? d.index : '—', color);
        it.lastIndex = d.index;
        it.lastOnline = p.sensor.online;
      }
      const stress = Math.min(1, d.index / 100);
      t.canopy.forEach((m, i) => {
        const base = t.canopyBase[i];
        if (mode === 'health') m.color.copy(base).lerp(color, 0.75);
        else m.color.copy(base).lerp(DRY, stress * 0.65);
        const ghost = mode === 'soil' || mode === 'sensors';
        m.transparent = ghost;
        m.opacity = ghost ? 0.28 : 1;
        m.depthWrite = !ghost;
      });
      const ratio = Math.max(0, Math.min(1, (p.reading.moisture - sp.wilting) / (sp.optimal - sp.wilting)));
      it.soilTarget = mode === 'soil' ? 0.15 + ratio * 0.8 : 0;
      it.sensor.group.scale.setScalar(mode === 'sensors' ? 2.4 : mode === 'soil' ? 1.6 : 1);
      it.beam.visible = mode === 'sensors';
      it.beam.material.color.copy(p.sensor.online ? new THREE.Color('#2b7bb9') : OFF);
      it.beam.scale.y = 14;
      it.beam.position.set(it.ringR + 0.7, 7, 0.5);
      it.link.visible = mode === 'sensors' && p.sensor.online;
      it.packet.visible = it.link.visible;
    }
    drawHud();
    drawSide();
  }

  function drawHud() {
    const c = store.climate;
    const ds = pilot.map(diag);
    q('#hud').innerHTML = `
      <div><span class="muted">Heure</span><b>${String(c.hour).padStart(2, '0')}:00</b></div>
      <div><span class="muted">Temp.</span><b>${c.tempC.toFixed(0)} °C</b></div>
      <div><span class="muted">Météo</span><b>${c.raining || manualRain > 0 ? 'Pluie' : c.hour >= 7 && c.hour <= 18 ? 'Soleil' : 'Dégagé'}</b></div>
      <div><span class="muted">À arroser</span><b style="color:${LEVELS.water.color}">${ds.filter((d) => d.level.key === 'water').length}</b></div>
      <div><span class="muted">Surveillance</span><b style="color:${LEVELS.watch.color}">${ds.filter((d) => d.level.key === 'watch').length}</b></div>`;
  }

  function drawSide() {
    const side = q('#side');
    if (selected) {
      const p = selected;
      const sp = speciesOf(p);
      const d = diag(p);
      side.innerHTML = `
        <button class="btn btn-sm" data-act="back">${icon('back')} Vue du parc</button>
        <div class="row" style="margin-top:14px;gap:10px">
          <div style="flex:1"><h3 style="font-size:18px">${esc(sp.name)}</h3><div class="small muted"><i>${esc(sp.scientific)}</i></div></div>
          <span class="mono muted">${p.id}</span>
        </div>
        ${p.sensor.online ? `<div style="margin:10px 0 6px">${gauge(d.index, d.level)}</div>` : ''}
        ${
          p.sensor.online
            ? `<div class="reco ${d.level.key}">${icon(d.level.key === 'ok' ? 'check' : d.level.key === 'watch' ? 'eye' : 'drop')}<div><strong>${d.level.label}${d.liters ? ` · ~${d.liters} L` : ''}</strong><p>${esc(d.explanation)}</p></div></div>`
            : `<div class="reco watch">${icon('cpu')}<div><strong>Capteur hors ligne</strong><p>Plus de mesure depuis plus de 6 h : un agent doit vérifier le capteur ${esc(p.sensor.id)}.</p></div></div>`
        }
        <div class="facts" style="margin-top:8px">
          <div><small>Humidité sol</small><b>${p.reading.moisture.toFixed(1)} %</b></div>
          <div><small>Optimum espèce</small><b>${sp.optimal} %</b></div>
          <div><small>Âge</small><b>${p.age} ans</b></div>
          <div><small>Hauteur</small><b>${p.height} m</b></div>
          <div><small>Capteur</small><b class="mono" style="font-size:12px">${p.sensor.id}</b></div>
          <div><small>Batterie</small><b>${p.sensor.online ? `${p.sensor.battery} %` : 'hors ligne'}</b></div>
        </div>
        ${p.issue ? `<div class="reco watch" style="margin-top:10px">${icon('wrench')}<div><strong>Intervention terrain</strong><p>${esc(p.issue)}</p></div></div>` : ''}
        <div class="row" style="margin-top:14px;flex-wrap:wrap">
          <button class="btn btn-water" data-act="water" ${p.sensor.online ? '' : 'disabled'}>${icon('drop')} Simuler l’arrosage</button>
          <a class="btn" href="#/plante/${p.id}">Passeport complet</a>
        </div>`;
      return;
    }
    const rows = pilot.map((p) => ({ p, d: diag(p), sp: speciesOf(p) })).sort((a, b) => b.d.index - a.d.index);
    side.innerHTML = `
      <h3 style="font-size:15px">Parc pilote — Place des Amazones</h3>
      <p class="small muted" style="margin:4px 0 12px">${pilot.length} arbres équipés d’un capteur d’humidité du sol. Cliquez sur un arbre pour ouvrir son passeport.</p>
      <div class="split" style="margin-bottom:6px">${['ok', 'watch', 'water'].map((k) => `<div style="width:${(rows.filter((r) => r.d.level.key === k).length / rows.length) * 100}%;background:${LEVELS[k].color}"></div>`).join('')}</div>
      <div class="legend" style="margin-bottom:12px">${['ok', 'watch', 'water'].map((k) => `<span><i style="background:${LEVELS[k].color}"></i>${rows.filter((r) => r.d.level.key === k).length} ${LEVELS[k].short.toLowerCase()}</span>`).join('')}</div>
      <div style="max-height:300px;overflow:auto;margin:0 -8px">
        ${rows
          .map(
            ({ p, d, sp }) => `<button class="chip" data-pick="${p.id}" style="display:flex;width:100%;border:0;border-radius:9px;justify-content:space-between;padding:8px 8px;background:transparent">
            <span class="row" style="gap:8px"><span class="dot" style="background:${p.sensor.online ? d.level.color : '#8a948f'}"></span>${esc(sp.name)} <span class="mono muted">${p.id}</span></span>
            <b style="color:${d.level.color}">${p.sensor.online ? d.index : '—'}</b></button>`
          )
          .join('')}
      </div>
      <h4 class="small muted" style="margin:16px 0 8px;text-transform:uppercase;letter-spacing:.06em">Scénarios de démonstration</h4>
      <div class="stack">
        <button class="btn" data-act="heat" style="width:100%">${icon('sun')} Simuler une journée de forte chaleur</button>
        <button class="btn" data-act="rain" style="width:100%">${icon('rain')} Faire pleuvoir sur le parc</button>
        <button class="btn btn-water" data-act="water-all" style="width:100%">${icon('drop')} Arroser les arbres assoiffés</button>
      </div>`;
  }

  // ── Interactions ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return hit ? plantById(hit.object.userData.plantId) : null;
  }
  const HOME = { target: new THREE.Vector3(0, 2, 0), cam: new THREE.Vector3(62, 52, 70) };
  function flyTo(target, cam) {
    fly = { from: controls.target.clone(), to: target, camFrom: camera.position.clone(), camTo: cam, t0: performance.now() };
  }
  function select(p) {
    selected = p;
    if (p) {
      const it = items.get(p.id);
      const h = it.t.top * it.t.scale;
      const tgt = it.root.position.clone().setY(h * 0.5);
      // Vue en plongée (~35°) depuis le côté où se trouve déjà la caméra
      const flat = camera.position.clone().sub(it.root.position).setY(0).normalize();
      const dist = h * 1.9 + 14;
      const cam = tgt.clone().addScaledVector(flat, dist * 0.82).setY(tgt.y + dist * 0.57);
      flyTo(tgt, cam);
      history.replaceState(null, '', `#/maquette-3d/${p.id}`);
    } else {
      flyTo(HOME.target.clone(), HOME.cam.clone());
      history.replaceState(null, '', '#/maquette-3d');
    }
    drawSide();
  }

  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5 || e.button !== 0) return;
    const p = pick(e);
    if (p || selected) select(p);
  });
  let lastMove = 0;
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (performance.now() - lastMove < 60) return;
    lastMove = performance.now();
    const p = pick(e);
    const tip = q('#tip');
    hovered = p;
    renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
    if (!p) return (tip.style.display = 'none');
    const r = stage.getBoundingClientRect();
    const d = diag(p);
    tip.innerHTML = `<b>${esc(speciesOf(p).name)}</b> <span class="mono muted">${p.id}</span> · ${levelBadge(d.level, `${d.index}/100`)}`;
    tip.style.left = `${e.clientX - r.left}px`;
    tip.style.top = `${e.clientY - r.top}px`;
    tip.style.display = 'block';
  });
  renderer.domElement.addEventListener('pointerleave', () => (q('#tip').style.display = 'none'));

  q('#modes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b) setMode(b.dataset.mode);
  });
  q('#side').addEventListener('click', (e) => {
    const pk = e.target.closest('[data-pick]');
    if (pk) return select(plantById(pk.dataset.pick));
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'back') select(null);
    if (act === 'water' && selected) {
      waterPlant(selected.id);
      toast(`Arrosage simulé : ${selected.id}`, 'drop');
    }
    if (act === 'water-all') {
      const list = pilot.filter((p) => p.sensor.online && diag(p).level.key === 'water');
      list.forEach((p) => waterPlant(p.id));
      toast(list.length ? `${list.length} arbres arrosés` : 'Aucun arbre assoiffé', 'drop');
    }
    if (act === 'heat') {
      pilot.forEach((p) => p.sensor.online && (p.reading.moisture = Math.max(speciesOf(p).wilting - 2, p.reading.moisture - 4.5 * speciesOf(p).kc)));
      store.climate.tempC = 38;
      logEvent('meteo', 'Scénario : vague de chaleur sur le parc pilote (38 °C)');
      emit('tick');
      toast('Vague de chaleur : le sol s’assèche', 'sun');
    }
    if (act === 'rain') {
      manualRain = 6;
      pilot.forEach((p) => {
        if (!p.sensor.online) return;
        const sp = speciesOf(p);
        p.reading.moisture = Math.min(sp.optimal + 6, p.reading.moisture + 6);
      });
      logEvent('meteo', 'Scénario : averse sur le parc pilote');
      emit('tick');
      toast('Averse : humidité du sol en hausse', 'rain');
    }
  });

  // Arrosage déclenché ailleurs (alertes, passeport, auto) → animation ici aussi
  const off = on((type, payload) => {
    if (type === 'watering' && payload?.plantId && items.has(payload.plantId)) spray(items.get(payload.plantId));
    if (type === 'tick' && manualRain > 0) manualRain--;
    if (type !== 'settings') sync();
  });
  // Les arrosages automatiques ne passent pas par 'watering' : on les détecte via le journal
  let lastEventTs = Date.now();
  const offAuto = on((type) => {
    if (type !== 'tick') return;
    for (const ev of store.events) {
      if (ev.ts <= lastEventTs) break;
      if (ev.kind === 'arrosage' && items.has(ev.plantId)) spray(items.get(ev.plantId));
    }
    lastEventTs = store.events[0]?.ts ?? lastEventTs;
  });

  // ── Boucle de rendu ──
  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  let raf = 0;
  let last = performance.now();
  let lightHour = store.climate.hour;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    if (lite && now - last < 33) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;

    if (fly) {
      const k = Math.min(1, (now - fly.t0) / 900);
      const e = 1 - (1 - k) ** 3;
      controls.target.lerpVectors(fly.from, fly.to, e);
      camera.position.lerpVectors(fly.camFrom, fly.camTo, e);
      if (k >= 1) fly = null;
    }
    controls.update();

    // Cycle jour / nuit doux, piloté par l'heure simulée
    lightHour += ((((store.climate.hour - lightHour) % 24) + 36) % 24 - 12) * Math.min(1, dt * 1.5);
    const h = ((lightHour % 24) + 24) % 24;
    const dayK = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
    const raining = store.climate.raining || manualRain > 0;
    const light = 0.45 + 0.55 * dayK * (raining ? 0.6 : 1);
    sun.intensity = 2.4 * light;
    hemi.intensity = 0.7 + 0.5 * light;
    const sa = ((h - 6) / 12) * Math.PI;
    sun.position.set(Math.cos(sa) * 80, 25 + Math.max(0, Math.sin(sa)) * 70, 40);
    const sky = scene.background;
    if (dayK > 0.35) sky.copy(DAY_SKY);
    else if (dayK > 0.05) sky.copy(DUSK_SKY).lerp(DAY_SKY, (dayK - 0.05) / 0.3);
    else sky.copy(NIGHT_SKY).lerp(DUSK_SKY, dayK / 0.05);
    if (raining) sky.lerp(new THREE.Color('#9aa8b2'), 0.5);
    scene.fog.color.copy(sky);
    park.bulbMat.emissiveIntensity = dayK < 0.15 ? 1.6 : 0;

    for (const it of items.values()) {
      // Balancement du feuillage
      it.t.sway.forEach((s) => (s.rotation.z = Math.sin(time * 0.9 + it.phase * 6) * (it.p.speciesId === 'cocotier' ? 0.05 : 0.015)));
      // Marqueur flottant
      const sel = selected?.id === it.p.id;
      const base = it.t.top * it.t.scale + 2.2;
      it.marker.sprite.position.y = base + Math.sin(time * 2 + it.phase * 5) * 0.25 + (sel ? 0.6 : 0);
      it.marker.sprite.scale.setScalar(sel || hovered?.id === it.p.id ? 0.068 : 0.05);
      // Anneau : pulsation pour les plantes assoiffées / sélection
      const lvl = diag(it.p).level.key;
      it.ring.material.opacity = sel ? 1 : lvl === 'water' ? 0.55 + 0.4 * Math.abs(Math.sin(time * 3)) : 0.85;
      it.ring.scale.setScalar(sel ? 1.15 + Math.sin(time * 4) * 0.04 : 1);
      // LED capteur
      it.sensor.led.visible = it.p.sensor.online ? Math.sin(time * 4 + it.phase * 10) > -0.6 : Math.sin(time * 8) > 0;
      // Halo d'humidité
      it.soil.material.opacity += ((it.soilTarget ?? 0) - it.soil.material.opacity) * Math.min(1, dt * 4);
      // Paquets de données vers la passerelle
      if (it.packet.visible) {
        const k = (time * 0.35 + it.phase) % 1;
        it.packet.position.copy(it.linkCurve.getPoint(k));
      }
    }
    park.update(dt, time);
    gw.tip.material.color.setHSL(0.57, 0.6, 0.45 + 0.2 * Math.sin(time * 5));

    // Gouttes d'arrosage
    for (const it of items.values()) {
      if (it.sprayUntil && now < it.sprayUntil) {
        for (let n = 0; n < (lite ? 3 : 8); n++) {
          if (droplets.length >= DROP_MAX) break;
          const a = Math.random() * Math.PI * 2;
          const r = it.ringR * (0.6 + Math.random() * 0.8);
          droplets.push({
            p: new THREE.Vector3(it.root.position.x + Math.cos(a) * 0.4, 1.2, it.root.position.z + Math.sin(a) * 0.4),
            v: new THREE.Vector3(Math.cos(a) * r * 1.1, 3.2 + Math.random() * 1.5, Math.sin(a) * r * 1.1),
          });
        }
      }
    }
    const pos = dropGeo.attributes.position;
    for (let i = droplets.length - 1; i >= 0; i--) {
      const d = droplets[i];
      d.v.y -= 9.8 * dt;
      d.p.addScaledVector(d.v, dt);
      if (d.p.y < 0.05) droplets.splice(i, 1);
    }
    for (let i = 0; i < DROP_MAX; i++) {
      const d = droplets[i];
      if (d) pos.setXYZ(i, d.p.x, d.p.y, d.p.z);
      else pos.setXYZ(i, 0, -50, 0);
    }
    pos.needsUpdate = true;

    // Pluie
    rain.visible = raining;
    if (raining) {
      const rp = rainGeo.attributes.position;
      for (let i = 0; i < RAIN_N; i++) {
        let y = rp.getY(i) - 40 * dt;
        if (y < 0) y += 50;
        rp.setY(i, y);
      }
      rp.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  setMode('nature');
  q('#loading').remove();
  raf = requestAnimationFrame(frame);
  if (initialId && items.has(initialId)) setTimeout(() => select(plantById(initialId)), 200);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    off();
    offAuto();
    controls.dispose();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => (m.map?.dispose(), m.dispose()));
    });
    renderer.dispose();
  };
}

// Pastille flottante affichant l'indice de soif
function makeMarker() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Taille constante à l'écran : lisible quel que soit le zoom
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
  sprite.renderOrder = 10;
  sprite.scale.setScalar(0.05);
  return { canvas, tex, sprite };
}
function drawMarker(m, value, color) {
  const c = m.canvas.getContext('2d');
  c.clearRect(0, 0, 128, 128);
  c.beginPath();
  c.arc(64, 58, 46, 0, Math.PI * 2);
  c.fillStyle = '#ffffff';
  c.fill();
  c.lineWidth = 10;
  c.strokeStyle = `#${color.getHexString()}`;
  c.stroke();
  c.beginPath();
  c.moveTo(52, 102);
  c.lineTo(64, 122);
  c.lineTo(76, 102);
  c.fillStyle = `#${color.getHexString()}`;
  c.fill();
  c.fillStyle = '#17231e';
  c.font = 'bold 42px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(value), 64, 60);
  m.tex.needsUpdate = true;
}

function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
