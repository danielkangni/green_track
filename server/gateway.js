// Passerelle IoT GreenTrack — Node.js, sans dépendance.
//
// Reçoit les mesures des ESP32 et les met à disposition du tableau de bord.
//   node server/gateway.js            (port 8787 par défaut, PORT=… pour changer)
//
// API
//   POST /api/readings            ← ESP32 : une mesure ou un tableau de mesures
//   GET  /api/readings            → GreenTrack : dernière mesure de chaque capteur
//   POST /api/water               ← GreenTrack : { sensorId, liters } commande d'arrosage
//   GET  /api/commands/:sensorId  → ESP32 : commande en attente ({ water: litres } ou {})
//   GET  /health
import http from 'node:http';

const PORT = Number(process.env.PORT) || 8787;
const STALE_MS = 6 * 3600 * 1000;
const readings = new Map(); // sensorId → dernière mesure
const commands = new Map(); // sensorId → litres à apporter

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function valid(m) {
  return m && typeof m.sensorId === 'string' && Number.isFinite(m.moisture) && m.moisture >= 0 && m.moisture <= 100;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return send(res, 204);

  try {
    if (url.pathname === '/health') return send(res, 200, { ok: true, sensors: readings.size });

    if (url.pathname === '/api/readings' && req.method === 'POST') {
      const body = await readBody(req);
      const list = (Array.isArray(body) ? body : [body]).filter(valid);
      for (const m of list) {
        readings.set(m.sensorId, {
          sensorId: m.sensorId,
          moisture: +m.moisture,
          tempC: Number.isFinite(m.tempC) ? +m.tempC : null,
          battery: Number.isFinite(m.battery) ? +m.battery : null,
          rssi: Number.isFinite(m.rssi) ? +m.rssi : null,
          ts: Date.now(),
        });
      }
      console.log(`[mesures] ${list.map((m) => `${m.sensorId}=${m.moisture}%`).join(', ')}`);
      return send(res, 200, { accepted: list.length });
    }

    if (url.pathname === '/api/readings' && req.method === 'GET') {
      const now = Date.now();
      return send(res, 200, [...readings.values()].filter((m) => now - m.ts < STALE_MS));
    }

    if (url.pathname === '/api/water' && req.method === 'POST') {
      const { sensorId, liters } = await readBody(req);
      if (typeof sensorId !== 'string' || !(liters > 0)) return send(res, 400, { error: 'sensorId et liters requis' });
      commands.set(sensorId, Math.min(200, +liters));
      console.log(`[arrosage] ${sensorId} : ${liters} L en attente`);
      return send(res, 200, { queued: true });
    }

    const cmd = url.pathname.match(/^\/api\/commands\/([\w-]+)$/);
    if (cmd && req.method === 'GET') {
      const liters = commands.get(cmd[1]);
      commands.delete(cmd[1]);
      return send(res, 200, liters ? { water: liters } : {});
    }

    send(res, 404, { error: 'introuvable' });
  } catch (e) {
    send(res, 400, { error: 'requête invalide' });
  }
});

server.listen(PORT, () => console.log(`Passerelle GreenTrack à l'écoute sur http://0.0.0.0:${PORT}`));
