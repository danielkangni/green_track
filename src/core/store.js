// État applicatif central + bus d'événements.
// Toutes les vues (tableau de bord, carte, 3D…) lisent cet état et s'abonnent
// aux changements : la maquette 3D et le tableau de bord restent synchronisés.
import { DEFAULT_SPECIES } from '../data/species.js';
import { generatePlants } from '../data/plants.js';
import { diagnose } from './thirst.js';

const LS_SPECIES = 'greentrack.species.v1';
const LS_SETTINGS = 'greentrack.settings.v2';
const LS_WATERINGS = 'greentrack.waterings.v1';

const load = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* stockage indisponible : on continue en mémoire */
  }
};

const listeners = new Set();

export const store = {
  species: load(LS_SPECIES, DEFAULT_SPECIES),
  settings: load(LS_SETTINGS, {
    dataSaver: false,
    autoIrrigation: true, // mode autonome : GreenTrack arrose seul
    source: 'simulation', // 'simulation' | 'passerelle'
    gatewayUrl: 'http://192.168.1.50:8787',
  }),
  plants: [],
  climate: { tempC: 31, humidity: 68, hour: 14, day: 0, raining: false },
  // Consommation d'eau sur 30 jours (simulée) + cumul du jour
  water: { days: [], todaySmart: 0, todaySchedule: 0 },
  events: [], // journal temps réel (arrosages, alertes)
  lastUpdate: Date.now(),
};

store.plants = generatePlants(store.species);

// ── Historique des arrosages (persisté localement) ──
store.waterings = load(LS_WATERINGS, null) || seedWaterings();

function seedWaterings() {
  // 7 jours d'historique plausible pour que l'écran ne soit pas vide au premier lancement
  const list = [];
  const now = Date.now();
  let seed = 11;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const p = store.plants[Math.floor(r() * store.plants.length)];
    const sp = store.species.find((s) => s.id === p.speciesId);
    const ts = now - (1 + r() * 7 * 24) * 3600000;
    const skipped = r() < 0.1;
    const before = +(sp.wilting + r() * (sp.stress - sp.wilting)).toFixed(1);
    list.push({
      id: `W${ts}${i}`,
      ts,
      plantId: p.id,
      liters: skipped ? 0 : Math.round(sp.dailyLiters * (0.6 + r() * 0.8)),
      mode: r() < 0.78 ? 'auto' : 'manuel',
      before,
      after: skipped ? null : +(sp.optimal + r() * 2.5).toFixed(1),
      status: skipped ? 'reporté' : 'terminé',
      index: Math.round(65 + r() * 35),
      note: skipped ? 'Pluie détectée' : undefined,
    });
  }
  return list.sort((a, b) => b.ts - a.ts);
}

export function saveWaterings() {
  save(LS_WATERINGS, store.waterings.slice(0, 400));
}

export function addWatering(entry) {
  const e = { id: `W${Date.now()}${Math.random().toString(36).slice(2, 6)}`, ts: Date.now(), ...entry };
  store.waterings.unshift(e);
  if (store.waterings.length > 400) store.waterings.length = 400;
  saveWaterings();
  return e;
}

// Historique de consommation des 30 derniers jours (arrosage planifié vs GreenTrack)
(function seedWater() {
  const daily = store.plants.reduce((a, p) => a + speciesOf(p).dailyLiters * Math.min(1.2, 0.25 + p.age / 12), 0);
  for (let d = 29; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000);
    const rainy = (d * 7) % 11 === 0;
    const schedule = Math.round(daily * (0.95 + ((d * 13) % 10) / 100));
    const smart = Math.round(schedule * (rainy ? 0.12 : 0.38 + ((d * 17) % 15) / 100));
    store.water.days.push({ date, schedule, smart });
  }
})();

export function speciesOf(plant) {
  return store.species.find((s) => s.id === plant.speciesId) || store.species[0];
}

export function diag(plant) {
  return diagnose(plant, speciesOf(plant));
}

export function on(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(type, payload) {
  store.lastUpdate = Date.now();
  listeners.forEach((fn) => fn(type, payload));
}

export function logEvent(kind, text, plantId) {
  store.events.unshift({ ts: Date.now(), kind, text, plantId });
  store.events.length = Math.min(store.events.length, 60);
}

export function updateSpecies(sp) {
  const i = store.species.findIndex((s) => s.id === sp.id);
  if (i >= 0) store.species[i] = sp;
  else store.species.push(sp);
  save(LS_SPECIES, store.species);
  emit('species', sp);
}

export function resetSpecies() {
  store.species = structuredClone(DEFAULT_SPECIES);
  save(LS_SPECIES, store.species);
  emit('species');
}

export function updateSettings(patch) {
  Object.assign(store.settings, patch);
  save(LS_SETTINGS, store.settings);
  emit('settings', patch);
}

export function plantById(id) {
  return store.plants.find((p) => p.id === id);
}

// Alertes dérivées de l'état courant
export function computeAlerts() {
  const alerts = [];
  for (const p of store.plants) {
    const d = diag(p);
    const sp = speciesOf(p);
    if (!p.sensor.online) {
      alerts.push({ id: `${p.id}-off`, plant: p, severity: 'high', type: 'capteur', title: 'Capteur hors ligne', text: `${p.sensor.id} n'émet plus depuis plus de 6 h. Vérifier l'alimentation et la connexion.` });
      continue;
    }
    if (d.level.key === 'water') {
      alerts.push({ id: `${p.id}-water`, plant: p, severity: 'high', type: 'arrosage', title: 'Arrosage nécessaire', text: `${sp.name} — indice de soif ${d.index}/100. Apporter environ ${d.liters} L.` });
    } else if (d.level.key === 'watch') {
      alerts.push({ id: `${p.id}-watch`, plant: p, severity: 'medium', type: 'surveillance', title: 'Stress hydrique naissant', text: `${sp.name} — indice de soif ${d.index}/100. Contrôler dans les 24 h.` });
    }
    if (p.issue) {
      alerts.push({ id: `${p.id}-issue`, plant: p, severity: 'medium', type: 'intervention', title: 'Intervention terrain', text: p.issue });
    }
    if (p.sensor.battery < 20) {
      alerts.push({ id: `${p.id}-bat`, plant: p, severity: 'low', type: 'capteur', title: 'Batterie faible', text: `${p.sensor.id} : ${p.sensor.battery} % restants.` });
    }
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function stats() {
  const counts = { ok: 0, watch: 0, water: 0 };
  let thirstSum = 0;
  let litersNeeded = 0;
  let online = 0;
  for (const p of store.plants) {
    const d = diag(p);
    counts[d.level.key]++;
    thirstSum += d.index;
    litersNeeded += d.liters;
    if (p.sensor.online) online++;
  }
  const w = store.water.days;
  const totalSchedule = w.reduce((a, d) => a + d.schedule, 0);
  const totalSmart = w.reduce((a, d) => a + d.smart, 0);
  return {
    total: store.plants.length,
    counts,
    avgThirst: Math.round(thirstSum / store.plants.length),
    litersNeeded,
    online,
    saved: totalSchedule - totalSmart,
    savedPct: Math.round((1 - totalSmart / totalSchedule) * 100),
    totalSchedule,
    totalSmart,
  };
}
