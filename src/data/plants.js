// Génération déterministe du registre des plantations (données simulées).
import { SITES } from './sites.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Plan du parc pilote (mètres, origine au centre de la place, z vers le sud).
// Reproduit fidèlement dans la maquette 3D.
export const PILOT_LAYOUT = [
  // Allée des cocotiers (nord)
  { s: 'cocotier', x: -30, z: -24, age: 14 },
  { s: 'cocotier', x: -18, z: -25, age: 12 },
  { s: 'cocotier', x: -6, z: -24, age: 15 },
  { s: 'cocotier', x: 6, z: -25, age: 9 },
  { s: 'cocotier', x: 18, z: -24, age: 11 },
  { s: 'cocotier', x: 30, z: -25, age: 2 },
  // Bosquet de neems (ouest)
  { s: 'neem', x: -32, z: -6, age: 18 },
  { s: 'neem', x: -24, z: 4, age: 10 },
  { s: 'neem', x: -34, z: 12, age: 4 },
  // Baobabs remarquables
  { s: 'baobab', x: -12, z: 8, age: 60 },
  { s: 'baobab', x: 24, z: 16, age: 35 },
  // Flamboyants autour du rond-point central
  { s: 'flamboyant', x: 9, z: -8, age: 16 },
  { s: 'flamboyant', x: -8, z: -10, age: 7 },
  { s: 'flamboyant', x: 12, z: 6, age: 2 },
  // Est : manguiers & karité
  { s: 'manguier', x: 32, z: -6, age: 20 },
  { s: 'manguier', x: 34, z: 4, age: 8 },
  { s: 'karite', x: 4, z: 20, age: 25 },
  { s: 'acacia', x: -26, z: 22, age: 5 },
];

const SITE_MIX = {
  marina: ['cocotier', 'cocotier', 'cocotier', 'flamboyant', 'neem'],
  etoile: ['flamboyant', 'neem', 'acacia', 'manguier'],
  'jardin-pn': ['baobab', 'karite', 'manguier', 'neem', 'flamboyant', 'acacia'],
  kpasse: ['baobab', 'karite', 'neem', 'manguier', 'acacia'],
  uac: ['acacia', 'neem', 'neem', 'manguier', 'flamboyant', 'karite'],
};
const SITE_COUNT = { marina: 22, etoile: 12, 'jardin-pn': 24, kpasse: 14, uac: 26 };

const ISSUES = [
  'Attaque de termites signalée au collet',
  'Branche cassée après un coup de vent',
  'Écorce endommagée (choc de véhicule)',
  'Jaunissement anormal du feuillage',
  'Tuteur à remplacer',
];

const CODES = { amazones: 'AMZ', marina: 'MAR', etoile: 'ETR', 'jardin-pn': 'JPN', kpasse: 'KPS', uac: 'UAC' };

function metersToLatLng(site, x, z) {
  return {
    lat: site.lat - z / 110540,
    lng: site.lng + x / (111320 * Math.cos((site.lat * Math.PI) / 180)),
  };
}

// Humidité initiale répartie pour obtenir un mélange réaliste d'états.
function initialMoisture(sp, r) {
  const roll = r();
  let f;
  if (roll < 0.58) f = 0.75 + r() * 0.45; // bien hydratée
  else if (roll < 0.84) f = 0.45 + r() * 0.25; // à surveiller
  else f = 0.05 + r() * 0.35; // assoiffée
  return +(sp.wilting + (sp.optimal + 3 - sp.wilting) * f).toFixed(1);
}

export function generatePlants(speciesList) {
  const r = rng(2026);
  const sp = Object.fromEntries(speciesList.map((s) => [s.id, s]));
  const year = new Date().getFullYear();
  const plants = [];

  const make = (site, n, speciesId, age, x, z, latlng) => {
    const code = `${CODES[site.id]}-${String(n).padStart(3, '0')}`;
    const s = sp[speciesId];
    const moisture = initialMoisture(s, r);
    const offline = r() < 0.03;
    const battery = Math.round(r() < 0.06 ? 8 + r() * 10 : 45 + r() * 55);
    const plant = {
      id: code,
      speciesId,
      siteId: site.id,
      age,
      plantedYear: year - age,
      lat: latlng.lat,
      lng: latlng.lng,
      pos3d: x !== undefined ? { x, z } : null,
      height: +(Math.min(25, 1.2 + age * (speciesId === 'baobab' ? 0.35 : 0.9)) * (0.85 + r() * 0.3)).toFixed(1),
      issue: r() < 0.06 ? ISSUES[Math.floor(r() * ISSUES.length)] : null,
      sensor: {
        id: `ESP32-${code}`,
        battery,
        online: !offline,
        firmware: '0.3.1',
        rssi: -Math.round(55 + r() * 35),
      },
      reading: { moisture, tempC: 31, ts: Date.now() },
      history: [],
      log: [],
    };
    // Historique d'entretien plausible
    plant.log.push({ date: `${plant.plantedYear}-0${1 + Math.floor(r() * 8)}-1${Math.floor(r() * 9)}`, type: 'plantation', text: 'Plantation et pose du tuteur' });
    if (age > 3) plant.log.push({ date: `${year - 1}-11-0${1 + Math.floor(r() * 8)}`, type: 'entretien', text: 'Élagage et contrôle sanitaire' });
    plant.log.push({ date: `${year}-0${3 + Math.floor(r() * 6)}-1${Math.floor(r() * 9)}`, type: 'capteur', text: `Installation du capteur ${plant.sensor.id}` });
    if (plant.issue) plant.log.push({ date: `${year}-10-2${Math.floor(r() * 9)}`, type: 'signalement', text: plant.issue });
    // Historique d'humidité (48 h) reconstruit à rebours depuis la valeur actuelle :
    // le sol était plus humide avant (séchage), sauf avant une pluie/un arrosage.
    const hist = new Array(48);
    hist[47] = moisture;
    const wetAt = r() < 0.45 ? 8 + Math.floor(r() * 30) : -1;
    for (let i = 46; i >= 0; i--) {
      const hour = (14 - (47 - i) + 48) % 24;
      const day = hour >= 9 && hour <= 17 ? 1 : 0.35;
      let m = hist[i + 1] + (0.05 + 0.13 * day) * s.kc + (r() - 0.5) * 0.06;
      if (i === wetAt) m -= 5 + r() * 3;
      hist[i] = Math.min(s.optimal + 8, Math.max(s.wilting - 2, m));
    }
    plant.history = hist.map((v) => +v.toFixed(1));
    return plant;
  };

  const pilot = SITES.find((s) => s.pilot);
  PILOT_LAYOUT.forEach((t, i) => plants.push(make(pilot, i + 1, t.s, t.age, t.x, t.z, metersToLatLng(pilot, t.x, t.z))));

  for (const site of SITES.filter((s) => !s.pilot)) {
    const mix = SITE_MIX[site.id];
    for (let i = 0; i < SITE_COUNT[site.id]; i++) {
      const speciesId = mix[Math.floor(r() * mix.length)];
      const radius = Math.sqrt(site.area * 10000) / 2;
      const latlng = metersToLatLng(site, (r() - 0.5) * 2 * radius, (r() - 0.5) * 2 * radius);
      plants.push(make(site, i + 1, speciesId, 1 + Math.floor(r() * (speciesId === 'baobab' ? 60 : 25)), undefined, undefined, latlng));
    }
  }
  return plants;
}
