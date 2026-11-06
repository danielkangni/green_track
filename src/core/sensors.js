// Couche capteurs — abstraction prête pour le matériel réel.
//
// Toute source implémente :  start(), stop(), water(plantId, liters)
// et pousse ses mesures via applyReading(sensorId, mesure), quel que soit
// leur origine (simulation, passerelle HTTP alimentée par des ESP32…).
//
// Format d'une mesure (identique à celui envoyé par le firmware ESP32) :
//   { sensorId: "ESP32-AMZ-001", moisture: 18.4, tempC: 31.2,
//     battery: 87, rssi: -67, ts: 1730900000000 }
import { store, emit, logEvent, speciesOf, diag, plantById, addWatering, saveWaterings } from './store.js';
import { climateFactor } from './thirst.js';

const MAX_HISTORY = 48;
const pendingWatering = new Map(); // plantId → humidité cible
const pendingEntry = new Map(); // plantId → entrée d'historique en cours
const lastSkip = new Map(); // plantId → heure simulée du dernier report (pluie)
export const isWatering = (plantId) => pendingWatering.has(plantId) || pendingEntry.get(plantId)?.status === 'en cours';
const simClock = () => store.climate.day * 24 + store.climate.hour;

export function applyReading(sensorId, m) {
  const p = store.plants.find((x) => x.sensor.id === sensorId);
  if (!p) return;
  const before = diag(p).level.key;
  p.reading = { moisture: +(+m.moisture).toFixed(1), tempC: Number.isFinite(m.tempC) ? m.tempC : store.climate.tempC, ts: m.ts || Date.now() };
  if (m.battery !== undefined) p.sensor.battery = Math.round(m.battery);
  if (m.rssi !== undefined) p.sensor.rssi = m.rssi;
  p.sensor.online = true;
  p.history.push(p.reading.moisture);
  if (p.history.length > MAX_HISTORY) p.history.shift();
  const after = diag(p).level.key;
  if (before !== after && after === 'water') logEvent('alerte', `${p.id} (${speciesOf(p).name}) passe en « Arrosage nécessaire »`, p.id);
}

// Chaque arrosage (automatique ou manuel) est inscrit dans l'historique,
// avec l'humidité avant et — une fois terminé — après.
function recordWatering(p, liters, auto, status = 'en cours') {
  store.water.todaySmart += liters;
  const today = new Date().toISOString().slice(0, 10);
  p.log.unshift({ date: today, type: 'arrosage', text: `${auto ? 'Arrosage automatique' : 'Arrosage manuel'} : ${liters} L` });
  logEvent('arrosage', `${auto ? 'Arrosage auto' : 'Arrosage'} ${p.id} (${speciesOf(p).name}) — ${liters} L`, p.id);
  const entry = addWatering({ plantId: p.id, liters, mode: auto ? 'auto' : 'manuel', before: p.reading.moisture, after: null, status, index: diag(p).index });
  pendingEntry.set(p.id, entry);
}

function finishWatering(p) {
  const e = pendingEntry.get(p.id);
  if (!e) return;
  e.after = p.reading.moisture;
  e.status = 'terminé';
  pendingEntry.delete(p.id);
  saveWaterings();
}

// Mode autonome : décide seul d'arroser, sans intervention humaine.
function autonomousCheck(p, raining, water) {
  if (!store.settings.autoIrrigation || pendingWatering.has(p.id) || pendingEntry.has(p.id)) return;
  const d = diag(p);
  if (d.level.key !== 'water') return;
  if (raining) {
    // La pluie va arroser : on reporte (une seule trace toutes les 6 h)
    if (simClock() - (lastSkip.get(p.id) ?? -99) < 6) return;
    lastSkip.set(p.id, simClock());
    addWatering({ plantId: p.id, liters: 0, mode: 'auto', before: p.reading.moisture, after: null, status: 'reporté', index: d.index, note: 'Pluie détectée' });
    return;
  }
  water(p, d.liters);
}

// ───────────────────────── Simulation ─────────────────────────
export class SimulatedSource {
  constructor() {
    this.timer = null;
    this.rainLeft = 0;
  }
  start() {
    this.stop();
    const period = store.settings.dataSaver ? 5000 : 2500; // 1 tick = 1 heure simulée
    this.timer = setInterval(() => this.tick(), period);
  }
  stop() {
    clearInterval(this.timer);
  }
  water(plantId, liters) {
    const p = plantById(plantId);
    if (!p) return;
    const sp = speciesOf(p);
    finishWatering(p);
    pendingWatering.set(plantId, sp.optimal + 2.5);
    recordWatering(p, liters || diag(p).liters || Math.round(sp.dailyLiters * 0.5), false);
    emit('watering', { plantId });
  }
  tick() {
    const c = store.climate;
    c.hour = (c.hour + 1) % 24;
    if (c.hour === 0) {
      c.day++;
      rollDay();
    }
    c.tempC = +(28 + 5 * Math.sin(((c.hour - 9) / 24) * 2 * Math.PI) + (Math.random() - 0.5)).toFixed(1);
    c.humidity = Math.round(70 - 12 * Math.sin(((c.hour - 9) / 24) * 2 * Math.PI));
    if (this.rainLeft > 0) this.rainLeft--;
    else if (Math.random() < 0.012) {
      this.rainLeft = 3;
      logEvent('meteo', 'Averse détectée — arrosages automatiques suspendus');
    }
    c.raining = this.rainLeft > 0;

    const day = c.hour >= 9 && c.hour <= 17 ? 1 : 0.35;
    let scheduleHour = 0;
    for (const p of store.plants) {
      const sp = speciesOf(p);
      scheduleHour += (sp.dailyLiters * Math.min(1.2, 0.25 + p.age / 12)) / 24;
      if (!p.sensor.online) continue;
      let m = p.reading.moisture;
      const target = pendingWatering.get(p.id);
      if (target !== undefined) {
        m += (target - m) * 0.55;
        if (Math.abs(target - m) < 0.4) {
          pendingWatering.delete(p.id);
          p.reading.moisture = m;
          finishWatering(p);
        }
      } else if (c.raining) {
        m = Math.min(sp.optimal + 8, m + 1.6);
      } else {
        m -= (0.025 + 0.07 * day) * sp.kc * climateFactor(c.tempC, sp.kc) + (Math.random() - 0.5) * 0.05;
      }
      m = Math.max(sp.wilting - 3, m);
      applyReading(p.sensor.id, {
        moisture: m,
        tempC: c.tempC,
        battery: p.sensor.battery - (Math.random() < 0.02 ? 1 : 0),
        rssi: p.sensor.rssi,
        ts: Date.now(),
      });
      autonomousCheck(p, c.raining, (pl, liters) => {
        pendingWatering.set(pl.id, sp.optimal + 2.5);
        recordWatering(pl, liters, true);
      });
    }
    store.water.todaySchedule += scheduleHour;
    emit('tick');
  }
}

function rollDay() {
  const w = store.water;
  w.days.shift();
  w.days.push({ date: new Date(), schedule: Math.round(w.todaySchedule), smart: Math.round(w.todaySmart) });
  w.todaySchedule = 0;
  w.todaySmart = 0;
}

// ───────────────────── Passerelle IoT (ESP32) ─────────────────────
// Interroge la passerelle (server/gateway.js) qui reçoit les mesures
// des ESP32 sur le terrain.  GET /api/readings  ·  POST /api/water
export class GatewaySource {
  constructor(url) {
    this.url = url.replace(/\/$/, '');
    this.timer = null;
  }
  start() {
    this.stop();
    const poll = async () => {
      try {
        const res = await fetch(`${this.url}/api/readings`);
        const list = await res.json();
        list.forEach((m) => applyReading(m.sensorId, m));
        // Mode autonome : la commande de vanne part sans intervention humaine
        for (const p of store.plants) autonomousCheck(p, false, (pl, liters) => this.water(pl.id, liters, true));
        emit('tick');
      } catch (e) {
        logEvent('meteo', `Passerelle injoignable (${this.url})`);
        emit('tick');
      }
    };
    poll();
    this.timer = setInterval(poll, store.settings.dataSaver ? 60000 : 15000);
  }
  stop() {
    clearInterval(this.timer);
  }
  async water(plantId, liters, auto = false) {
    const p = plantById(plantId);
    if (!p) return;
    const l = liters || diag(p).liters;
    try {
      await fetch(`${this.url}/api/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorId: p.sensor.id, liters: l }),
      });
      recordWatering(p, l, auto, 'envoyé');
      pendingEntry.delete(p.id);
    } catch {
      logEvent('meteo', `Commande d'arrosage non transmise pour ${p.id}`);
    }
    emit('watering', { plantId });
  }
}

let source = null;
export function startSource() {
  source?.stop();
  source = store.settings.source === 'passerelle' ? new GatewaySource(store.settings.gatewayUrl) : new SimulatedSource();
  source.start();
}
export const waterPlant = (id, liters) => source?.water(id, liters);
