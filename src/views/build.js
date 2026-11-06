// « Montage du capteur » : schéma de câblage interactif façon Tinkercad Circuits,
// avec simulation du mode autonome, liste du matériel, étapes et code.
import { store } from '../core/store.js';
import { thirstIndex } from '../core/thirst.js';
import { icon, esc, toast } from '../ui.js';
import esp32Code from '../../firmware/greentrack_esp32/greentrack_esp32.ino?raw';
import unoCode from '../../firmware/tinkercad_uno/greentrack_uno.ino?raw';

export const meta = () => ({ title: 'Montage du capteur', sub: 'Ce qu’il faut construire pour chaque plante — schéma, matériel, étapes et code' });

// ───────────── Composants ─────────────
const PARTS = {
  solar: { name: 'Panneau solaire 20 W', role: 'Recharge la batterie avec le soleil : aucune prise électrique nécessaire dans le parc.', qty: 1, price: 18000 },
  ctrl: { name: 'Régulateur solaire 12 V', role: 'Protège la batterie : il gère la charge par le panneau et coupe si la batterie est trop faible.', qty: 1, price: 6000 },
  battery: { name: 'Batterie 12 V 7 Ah', role: 'Réserve d’énergie pour la nuit et les jours nuageux (plusieurs jours d’autonomie).', qty: 1, price: 15000 },
  buck: { name: 'Convertisseur LM2596 (12 V → 5 V)', role: 'Abaisse la tension de la batterie pour alimenter l’ESP32 et le relais.', qty: 1, price: 2500 },
  esp: { name: 'ESP32 DevKit', role: 'Le cerveau : lit les capteurs, calcule l’indice de soif, envoie les données en Wi-Fi et commande la vanne.', qty: 1, price: 6000 },
  divider: { name: 'Résistances 100 kΩ + 27 kΩ', role: 'Pont diviseur : permet à l’ESP32 de mesurer la charge de la batterie.', qty: 2, price: 200 },
  soil: { name: 'Sonde d’humidité capacitive v1.2', role: 'Plantée dans la terre au pied de l’arbre : mesure l’humidité du sol. Capacitive = ne rouille pas.', qty: 1, price: 2500 },
  ds: { name: 'Sonde de température DS18B20 étanche', role: 'Mesure la température du sol, utilisée pour ajuster l’indice de soif (il fait chaud → la plante boit plus).', qty: 1, price: 3000 },
  pullup: { name: 'Résistance 4,7 kΩ', role: 'Résistance de tirage obligatoire pour la sonde DS18B20.', qty: 1, price: 100 },
  relay: { name: 'Module relais 5 V', role: 'Interrupteur commandé par l’ESP32 : il ouvre ou ferme le circuit 12 V de l’électrovanne.', qty: 1, price: 2000 },
  valve: { name: 'Électrovanne 12 V ½″', role: 'Le robinet automatique : quand elle reçoit du courant, l’eau coule vers la plante.', qty: 1, price: 7500 },
  diode: { name: 'Diode 1N4007', role: 'Protège le circuit contre la surtension créée par la bobine de la vanne à la fermeture.', qty: 1, price: 100 },
  pipe: { name: 'Tuyau goutte-à-goutte + raccords', role: 'Amène l’eau au pied de la plante, lentement, sans gaspillage.', qty: 1, price: 5000 },
  pot: { name: 'La plante (ici un jeune cocotier)', role: 'La sonde et le goutteur sont placés dans la zone des racines, à environ 20 cm de profondeur.', qty: 0, price: 0 },
};
const EXTRA_BOM = [
  { name: 'Boîtier étanche IP65', role: 'Protège l’électronique de la pluie et de la poussière.', qty: 1, price: 4000 },
  { name: 'Fils, borniers, gaine thermo', role: 'Câblage et connexions.', qty: 1, price: 2000 },
];

// ───────────── Câbles (polylignes) ─────────────
const C = { red: '#e0463a', black: '#2c3e50', orange: '#f08c1a', yellow: '#f2c12e', green: '#2bb673', blue: '#3d8fd6' };
const WIRES = [
  { c: C.red, p: [[230, 62], [290, 62]], parts: 'solar ctrl', power: 1 },
  { c: C.black, p: [[230, 108], [290, 108]], parts: 'solar ctrl', power: 1 },
  { c: C.red, p: [[370, 130], [370, 160], [410, 160], [410, 190]], parts: 'ctrl battery', power: 1 },
  { c: C.black, p: [[330, 130], [330, 190]], parts: 'ctrl battery', power: 1 },
  { c: C.red, p: [[450, 62], [530, 62]], parts: 'ctrl buck', power: 1 },
  { c: C.black, p: [[450, 108], [530, 108]], parts: 'ctrl buck', power: 1 },
  { c: C.red, p: [[660, 62], [1180, 62], [1180, 614], [1150, 614]], parts: 'buck rails', power: 1 },
  { c: C.black, p: [[660, 108], [1196, 108], [1196, 662], [1150, 662]], parts: 'buck rails', power: 1 },
  { c: C.red, p: [[530, 450], [530, 614]], parts: 'esp rails', power: 1 },
  { c: C.black, p: [[560, 450], [560, 662]], parts: 'esp rails', power: 1 },
  { c: C.orange, p: [[590, 450], [590, 638]], parts: 'esp rails', power: 1 },
  // pont diviseur batterie
  { c: C.red, p: [[410, 175], [470, 175], [470, 237], [485, 237]], parts: 'battery divider' },
  { c: C.yellow, p: [[560, 237], [560, 330]], parts: 'divider esp', sig: 1 },
  { c: C.black, p: [[635, 237], [1196, 237]], parts: 'divider rails' },
  // relais
  { c: C.yellow, p: [[350, 375], [500, 375]], parts: 'relay esp', sig: 1, id: 'w-relay' },
  { c: C.red, p: [[310, 425], [310, 614]], parts: 'relay rails', power: 1 },
  { c: C.black, p: [[280, 425], [280, 662]], parts: 'relay rails', power: 1 },
  // circuit 12 V de la vanne
  { c: C.red, p: [[390, 160], [390, 150], [270, 150], [270, 300], [225, 300], [225, 330]], parts: 'battery relay', valve: 1 },
  { c: C.red, p: [[265, 330], [265, 312], [200, 312], [200, 210], [160, 210]], parts: 'relay valve diode', valve: 1 },
  { c: C.black, p: [[330, 165], [250, 165], [250, 250], [160, 250]], parts: 'battery valve diode', valve: 1 },
  // sonde d'humidité
  { c: C.green, p: [[800, 365], [920, 365], [920, 380]], parts: 'esp soil', sig: 1 },
  { c: C.orange, p: [[935, 380], [935, 355], [1120, 355], [1120, 638]], parts: 'soil rails', power: 1 },
  { c: C.black, p: [[950, 380], [950, 345], [1135, 345], [1135, 662]], parts: 'soil rails', power: 1 },
  // sonde de température
  { c: C.yellow, p: [[1020, 380], [1020, 320], [840, 320], [840, 405], [800, 405]], parts: 'ds esp pullup', sig: 1 },
  { c: C.orange, p: [[1035, 380], [1035, 355]], parts: 'ds rails' },
  { c: C.black, p: [[1050, 380], [1050, 345]], parts: 'ds rails' },
  { c: C.yellow, p: [[1020, 330], [1030, 330]], parts: 'pullup ds' },
  { c: C.orange, p: [[1066, 330], [1080, 330], [1080, 355]], parts: 'pullup ds' },
];
const DOTS = [[410, 175], [390, 160], [330, 165], [560, 237], [1196, 237], [1035, 355], [1050, 345], [1020, 330], [1080, 355], [530, 614], [560, 662], [590, 638], [310, 614], [280, 662], [1120, 638], [1135, 662]];

// ───────────── Dessin SVG ─────────────
const pin = (x, y, label, pos = 'below') => {
  const ty = pos === 'below' ? y - 8 : pos === 'above' ? y + 14 : y + 4;
  const tx = pos === 'left' ? x + 8 : pos === 'right' ? x - 8 : x;
  const anchor = pos === 'left' ? 'start' : pos === 'right' ? 'end' : 'middle';
  return `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" rx="1.5" fill="#d9b44a" stroke="#8a6d1f"/>${label ? `<text x="${tx}" y="${ty}" text-anchor="${anchor}" class="pin-l">${label}</text>` : ''}`;
};
const label = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" class="part-l">${t}</text>`;
const part = (id, inner) => `<g class="part" data-part="${id}">${inner}</g>`;
const resistor = (x1, y, x2, bands) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#9aa4a8" stroke-width="2"/><rect x="${x1 + 8}" y="${y - 6}" width="${x2 - x1 - 16}" height="12" rx="5" fill="#e3c99a" stroke="#b39566"/>${bands.map((c, i) => `<rect x="${x1 + 14 + i * 7}" y="${y - 6}" width="3.5" height="12" fill="${c}"/>`).join('')}`;

function svg() {
  const w = (wr, i) => `<g class="wire ${wr.power ? 'power' : ''} ${wr.sig ? 'sig' : ''} ${wr.valve ? 'valvew' : ''}" data-parts="${wr.parts}" ${wr.id ? `id="${wr.id}"` : ''}>
      <polyline class="halo" points="${wr.p.map((q) => q.join(',')).join(' ')}"/>
      <polyline class="core" stroke="${wr.c}" points="${wr.p.map((q) => q.join(',')).join(' ')}"/></g>`;
  const solarCells = Array.from({ length: 12 }, (_, i) => `<rect x="${52 + (i % 4) * 43}" y="${42 + Math.floor(i / 4) * 30}" width="40" height="27" fill="#24467a" stroke="#4d73ad" stroke-width=".8"/>`).join('');
  return `<svg viewBox="0 0 1220 700" class="circuit" id="circuit" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dde5ec" stroke-width="1"/></pattern>
      <linearGradient id="brass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8c55a"/><stop offset="1" stop-color="#a8821f"/></linearGradient>
      <linearGradient id="sun" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1220" height="700" fill="url(#grid)"/>

    <!-- Plaque d'essai : rails d'alimentation -->
    ${part('rails', `<rect x="60" y="596" width="1100" height="84" rx="8" fill="#fbfbf9" stroke="#cfd6dc"/>
      ${Array.from({ length: 54 }, (_, i) => `<circle cx="${110 + i * 20}" cy="626" r="2" fill="#c9d0d5"/><circle cx="${110 + i * 20}" cy="650" r="2" fill="#c9d0d5"/>`).join('')}
      <line x1="100" y1="614" x2="1150" y2="614" stroke="${C.red}" stroke-width="3"/>
      <line x1="100" y1="638" x2="1150" y2="638" stroke="${C.orange}" stroke-width="3"/>
      <line x1="100" y1="662" x2="1150" y2="662" stroke="${C.black}" stroke-width="3"/>
      <text x="70" y="618" class="rail-l" fill="${C.red}">5 V</text><text x="66" y="642" class="rail-l" fill="${C.orange}">3,3 V</text><text x="66" y="666" class="rail-l" fill="${C.black}">GND</text>`)}

    <!-- Tuyau d'arrosage -->
    <g class="part" data-part="pipe">
      <polyline points="100,265 100,578 860,578 860,470 985,470" fill="none" stroke="#7f8c8d" stroke-width="9" stroke-linejoin="round"/>
      <polyline points="100,265 100,578 860,578 860,470 985,470" fill="none" stroke="#b9c3c7" stroke-width="5" stroke-linejoin="round"/>
      <polyline id="water" points="100,265 100,578 860,578 860,470 985,470" fill="none" stroke="#3d8fd6" stroke-width="4" stroke-linejoin="round" stroke-dasharray="8 10"/>
      <rect x="978" y="466" width="14" height="10" rx="2" fill="#2c3e50"/>
      <g id="drops">${[0, 1, 2].map((i) => `<circle cx="985" cy="482" r="3" fill="#3d8fd6" style="animation-delay:${i * 0.33}s"/>`).join('')}</g>
    </g>

    ${WIRES.map(w).join('')}
    ${DOTS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#17231e"/>`).join('')}

    ${part('solar', `<rect x="40" y="30" width="190" height="110" rx="6" fill="#c9d1d6" stroke="#8e9aa1"/>${solarCells}<rect id="sunshine" x="44" y="34" width="182" height="102" fill="url(#sun)"/>
      ${pin(230, 62, '+', 'right')}${pin(230, 108, '−', 'right')}${label(135, 158, 'Panneau solaire 20 W')}`)}
    ${part('ctrl', `<rect x="290" y="40" width="160" height="90" rx="8" fill="#2f3a40"/><rect x="330" y="54" width="80" height="26" rx="3" fill="#9fd3a8"/><text x="370" y="72" text-anchor="middle" class="lcd" id="lcd">12.6V</text>
      <text x="370" y="104" text-anchor="middle" class="chip-l">RÉGULATEUR</text>
      ${pin(290, 62, 'PV+', 'left')}${pin(290, 108, 'PV−', 'left')}${pin(330, 130, 'BAT−', 'above')}${pin(370, 130, 'BAT+', 'above')}${pin(450, 62, 'OUT+', 'right')}${pin(450, 108, 'OUT−', 'right')}`)}
    ${part('battery', `<rect x="290" y="190" width="160" height="95" rx="6" fill="#23272b"/><rect x="290" y="190" width="160" height="16" rx="4" fill="#3a4046"/>
      <text x="370" y="244" text-anchor="middle" class="chip-l" style="font-size:15px">12 V · 7 Ah</text><text x="370" y="264" text-anchor="middle" class="chip-s" id="batt-l">100 %</text>
      <rect x="322" y="182" width="16" height="10" fill="#2c3e50"/><rect x="402" y="182" width="16" height="10" fill="${C.red}"/>${label(370, 302, 'Batterie 12 V')}`)}
    ${part('buck', `<rect x="530" y="40" width="130" height="90" rx="6" fill="#1d5fa8"/><circle cx="575" cy="85" r="20" fill="#2b2b2b"/><circle cx="575" cy="85" r="9" fill="#555"/><rect x="615" y="60" width="22" height="22" rx="3" fill="#3d8fd6"/><circle cx="626" cy="71" r="5" fill="#d9b44a"/>
      <text x="626" y="112" text-anchor="middle" class="chip-s" style="fill:#fff">LM2596</text>
      ${pin(530, 62, 'IN+', 'left')}${pin(530, 108, 'IN−', 'left')}${pin(660, 62, '5V', 'right')}${pin(660, 108, 'GND', 'right')}${label(595, 148, '12 V → 5 V')}`)}
    ${part('divider', `${resistor(485, 237, 545, ['#8b4513', '#111', '#e6c200'])}${resistor(575, 237, 635, ['#e00', '#7a2be2', '#e67e22'])}<text x="560" y="222" text-anchor="middle" class="pin-l">100k · 27k</text>`)}
    ${part('esp', `<rect x="500" y="330" width="300" height="120" rx="8" fill="#20252b"/><rect x="600" y="345" width="130" height="88" rx="4" fill="#b8bfc4"/><text x="665" y="385" text-anchor="middle" class="chip-s">ESP-WROOM-32</text><text x="665" y="402" text-anchor="middle" class="chip-s" style="font-size:9px">Wi-Fi · Bluetooth</text>
      <rect x="490" y="372" width="22" height="26" rx="3" fill="#9aa4a8"/><circle id="esp-led" cx="760" cy="350" r="5" fill="#3d8fd6"/><text x="550" y="400" class="chip-l" style="fill:#fff;font-size:15px">ESP32</text>
      ${pin(560, 330, 'G35', 'above')}${pin(500, 375, 'G26', 'left')}${pin(800, 365, 'G34', 'right')}${pin(800, 405, 'G4', 'right')}${pin(530, 450, 'VIN', 'below')}${pin(560, 450, 'GND', 'below')}${pin(590, 450, '3V3', 'below')}`)}
    ${part('relay', `<rect x="200" y="330" width="150" height="95" rx="6" fill="#1d5fa8"/><rect x="232" y="352" width="70" height="52" rx="4" fill="#2f86d9"/><text x="267" y="382" text-anchor="middle" class="chip-s" style="fill:#fff">RELAIS 5V</text>
      <circle id="relay-led" cx="330" cy="405" r="5" fill="#5b1f1f"/>
      ${pin(225, 330, 'COM', 'above')}${pin(265, 330, 'NO', 'above')}${pin(350, 375, 'IN', 'right')}${pin(280, 425, 'GND', 'below')}${pin(310, 425, 'VCC', 'below')}${label(275, 442, 'Module relais')}`)}
    ${part('valve', `<rect x="40" y="225" width="120" height="40" rx="8" fill="url(#brass)"/><rect x="70" y="190" width="60" height="40" rx="6" fill="#2c3e50"/><text x="100" y="215" text-anchor="middle" class="chip-s" style="fill:#fff">12 V</text>
      <rect x="20" y="236" width="22" height="18" fill="#a8821f"/><text id="valve-l" x="100" y="252" text-anchor="middle" class="chip-s">FERMÉE</text>
      ${pin(160, 210, '+', 'right')}${pin(160, 250, '−', 'right')}${label(90, 182, 'Électrovanne')}`)}
    ${part('diode', `<line x1="178" y1="210" x2="178" y2="250" stroke="#9aa4a8" stroke-width="2"/><rect x="171" y="220" width="14" height="22" rx="3" fill="#2b2b2b"/><rect x="171" y="221" width="14" height="4" fill="#ccc"/>`)}
    ${part('pot', `<polygon points="880,480 1100,480 1085,588 895,588" fill="#c46a3f"/><rect id="soil" x="884" y="480" width="212" height="22" fill="#7a5233"/><polygon points="884,502 1096,502 1085,588 895,588" fill="#c46a3f" opacity=".0"/>
      <path d="M1078 480 C1076 455 1074 440 1078 420" stroke="#8c7357" stroke-width="5" fill="none"/>
      <path d="M1078 420 C1060 405 1045 410 1036 420 M1078 420 C1095 402 1112 406 1120 418 M1078 420 C1072 400 1062 392 1052 392 M1078 420 C1086 398 1098 392 1108 393" stroke="#4c8f35" stroke-width="6" fill="none" stroke-linecap="round"/>`)}
    ${part('soil', `<rect x="905" y="380" width="60" height="58" rx="4" fill="#1b1b1b"/><rect x="917" y="438" width="36" height="110" rx="3" fill="#1b1b1b"/><text x="935" y="420" text-anchor="middle" class="chip-s" style="fill:#fff;font-size:9px">CAPACITIVE</text>
      ${pin(920, 380, 'A', 'below')}${pin(935, 380, '+', 'below')}${pin(950, 380, '−', 'below')}<g id="soil-read" class="readout"><rect x="835" y="425" width="62" height="24" rx="6"/><text x="866" y="441" text-anchor="middle">—</text></g>`)}
    ${part('ds', `<rect x="1008" y="380" width="52" height="22" rx="3" fill="#2a8c4a"/><path d="M1034 402 C1034 440 1046 460 1040 530" stroke="#1b1b1b" stroke-width="4" fill="none"/><rect x="1035" y="520" width="10" height="26" rx="3" fill="#c0c6ca"/>
      ${pin(1020, 380, 'D', 'below')}${pin(1035, 380, '+', 'below')}${pin(1050, 380, '−', 'below')}`)}
    ${part('pullup', `${resistor(1030, 330, 1066, ['#e6c200', '#7a2be2', '#e00'])}`)}
  </svg>`;
}

// ───────────── Étapes de montage ─────────────
const STEPS = [
  { t: 'Préparer l’alimentation solaire', d: 'Relier le panneau au régulateur (PV+ / PV−), puis la batterie au régulateur (BAT+ / BAT−). Toujours brancher la batterie AVANT le panneau.', parts: ['solar', 'ctrl', 'battery'] },
  { t: 'Régler le convertisseur 5 V', d: 'Brancher le LM2596 sur la sortie du régulateur. Avec un multimètre, tourner la petite vis jusqu’à lire 5,0 V en sortie avant de brancher l’ESP32.', parts: ['buck'] },
  { t: 'Installer l’ESP32 et les rails', d: 'Sur la plaque d’essai : 5 V → VIN, GND → GND, et le 3,3 V de l’ESP32 sur le rail 3,3 V qui alimentera les sondes.', parts: ['esp', 'rails'] },
  { t: 'Brancher les deux sondes', d: 'Sonde d’humidité : A → G34. Sonde DS18B20 : D → G4, avec la résistance 4,7 kΩ entre D et 3,3 V. Les deux sur 3,3 V et GND.', parts: ['soil', 'ds', 'pullup'] },
  { t: 'Câbler le relais et la vanne', d: 'Relais : IN → G26, VCC → 5 V, GND → GND. Côté puissance : batterie + → COM, NO → vanne +, vanne − → batterie −. Diode 1N4007 en parallèle sur la vanne (bague grise côté +).', parts: ['relay', 'valve', 'diode'] },
  { t: 'Mesure de la batterie', d: 'Pont diviseur 100 kΩ / 27 kΩ entre batterie + et GND, point milieu sur G35 : l’ESP32 surveille ainsi la charge.', parts: ['divider'] },
  { t: 'Installer sur le terrain', d: 'Planter la sonde à 20 cm, dans la zone des racines, à environ 50 cm du tronc. Poser le goutteur au même endroit. Fixer le boîtier étanche sur un piquet, panneau orienté plein sud.', parts: ['pot', 'pipe'] },
  { t: 'Téléverser le programme', d: 'Ouvrir firmware/greentrack_esp32 dans l’IDE Arduino, renseigner le Wi-Fi et l’identifiant du capteur, puis téléverser. Le capteur apparaît dans GreenTrack.', parts: ['esp'] },
];

const fcfa = (n) => `${n.toLocaleString('fr-FR')} FCFA`;

export function render(el) {
  el.innerHTML = `
    <div class="build-tabs seg" id="tabs">
      <button data-tab="circuit" class="active">${icon('cpu')} Circuit</button>
      <button data-tab="bom">Matériel</button>
      <button data-tab="steps">Étapes</button>
      <button data-tab="code">Code ESP32</button>
      <button data-tab="tinkercad">Version Tinkercad</button>
    </div>
    <div id="tab-body" class="mt"></div>`;
  const q = (s) => el.querySelector(s);
  let stopSim = () => {};

  const tabs = {
    circuit: () => circuitTab(q('#tab-body'), (fn) => (stopSim = fn)),
    bom: () => bomTab(q('#tab-body')),
    steps: () => stepsTab(q('#tab-body'), (partsToShow) => show('circuit', partsToShow)),
    code: () => codeTab(q('#tab-body'), esp32Code, 'greentrack_esp32.ino', 'À ouvrir dans l’IDE Arduino (carte « ESP32 Dev Module »). Modifier le nom du Wi-Fi, le mot de passe et l’identifiant du capteur en haut du fichier.'),
    tinkercad: () => tinkercadTab(q('#tab-body')),
  };
  function show(name, highlight) {
    stopSim();
    stopSim = () => {};
    q('#tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    // conteneur neuf à chaque onglet : aucun écouteur ne s'accumule
    const body = q('#tab-body');
    body.replaceWith(body.cloneNode(false));
    tabs[name]();
    if (highlight) setTimeout(() => focusParts(q('#tab-body'), highlight), 50);
  }
  q('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) show(b.dataset.tab);
  });
  show('circuit');
  return () => stopSim();
}

function focusParts(root, ids) {
  const s = root.querySelector('#circuit');
  if (!s) return;
  s.classList.add('focus');
  s.querySelectorAll('.part').forEach((p) => p.classList.toggle('on', ids.includes(p.dataset.part)));
  s.querySelectorAll('.wire').forEach((w) => w.classList.toggle('on', w.dataset.parts.split(' ').some((x) => ids.includes(x))));
  const info = root.querySelector('#part-info');
  if (info) info.innerHTML = partInfo(ids[0], ids);
}

function partInfo(id, group) {
  const p = PARTS[id];
  if (!p) return defaultInfo();
  const links = [...new Set(WIRES.filter((w) => w.parts.split(' ').includes(id)).flatMap((w) => w.parts.split(' ')).filter((x) => x !== id && PARTS[x]))];
  return `<h3>${esc(p.name)}</h3><p>${esc(p.role)}</p>
    ${links.length ? `<div class="small muted" style="margin-top:10px">Relié à :</div><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${links.map((l) => `<span class="badge neutral plain">${esc(PARTS[l].name)}</span>`).join('')}</div>` : ''}
    ${p.price ? `<div class="small muted" style="margin-top:10px">Prix indicatif : <b style="color:var(--ink)">${fcfa(p.price * p.qty)}</b></div>` : ''}
    ${group && group.length > 1 ? `<div class="small muted" style="margin-top:8px">+ ${group.slice(1).map((g) => PARTS[g]?.name).filter(Boolean).join(', ')}</div>` : ''}`;
}
const defaultInfo = () => `<h3>Survolez un composant</h3><p>Chaque plante est équipée de ce petit montage autonome, alimenté par le soleil. Passez la souris sur un élément pour savoir à quoi il sert, ou lancez la simulation.</p>`;

// ───────────── Onglet circuit + simulation ─────────────
function circuitTab(root, setStop) {
  const species = store.species.filter((s) => ['cocotier', 'neem', 'baobab', 'flamboyant', 'manguier'].includes(s.id));
  root.innerHTML = `
    <div class="tk-toolbar card">
      <button class="btn tk-start" id="start">${icon('zap')} Démarrer la simulation</button>
      <div class="tk-ctrl"><label>Humidité du sol <b id="m-val">24 %</b></label><input type="range" id="m" min="3" max="45" step="0.5" value="24" disabled></div>
      <div class="tk-ctrl"><label>Espèce</label><select class="select" id="sp">${species.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
      <label class="row small" style="gap:8px"><span class="toggle"><input type="checkbox" id="sun" checked><span></span></span>Soleil</label>
    </div>
    <div class="tk-layout mt">
      <div class="card tk-canvas">${svg()}</div>
      <aside class="stack" style="display:flex;flex-direction:column;gap:12px">
        <div class="card card-pad tk-info" id="part-info">${defaultInfo()}</div>
        <div class="card card-pad" id="sim-state"></div>
      </aside>
    </div>
    <div class="card mt tk-serial"><div class="tk-serial-h">Moniteur série <span class="muted">115200 bauds</span></div><pre id="serial">Cliquez sur « Démarrer la simulation » pour voir l’ESP32 travailler.</pre></div>`;
  const q = (s) => root.querySelector(s);
  const s = q('#circuit');

  // Survol : mise en évidence du composant et de ses câbles
  s.addEventListener('mouseover', (e) => {
    const p = e.target.closest('.part');
    if (!p || p.dataset.part === 'rails') return;
    focusParts(root, [p.dataset.part]);
  });
  s.addEventListener('mouseleave', () => {
    s.classList.remove('focus');
    q('#part-info').innerHTML = defaultInfo();
  });

  const sim = { running: false, m: 24, valve: false, batt: 12.5, n: 0, timer: 0 };
  const sp = () => store.species.find((x) => x.id === q('#sp').value);
  const serial = q('#serial');
  const log = (t) => {
    const time = new Date().toLocaleTimeString('fr-FR');
    serial.textContent = (serial.textContent.startsWith('Cliquez') ? '' : serial.textContent) + `[${time}] ${t}\n`;
    const lines = serial.textContent.split('\n');
    if (lines.length > 120) serial.textContent = lines.slice(-120).join('\n');
    serial.scrollTop = serial.scrollHeight;
  };

  function paint() {
    const species = sp();
    const temp = q('#sun').checked ? 33 : 26;
    const idx = thirstIndex({ moisture: sim.m, tempC: temp }, species, 10);
    const col = idx >= 65 ? '#d64545' : idx >= 35 ? '#e8a33d' : '#2f9e44';
    const wet = Math.min(1, sim.m / 40);
    q('#soil').setAttribute('fill', `rgb(${Math.round(196 - 110 * wet)},${Math.round(150 - 92 * wet)},${Math.round(105 - 70 * wet)})`);
    q('#soil-read text').textContent = `${sim.m.toFixed(1)} %`;
    q('#m').value = sim.m;
    q('#m-val').textContent = `${sim.m.toFixed(1)} %`;
    q('#relay-led').setAttribute('fill', sim.valve ? '#ff3b30' : '#5b1f1f');
    q('#valve-l').textContent = sim.valve ? 'OUVERTE' : 'FERMÉE';
    q('#lcd').textContent = `${sim.batt.toFixed(1)}V`;
    q('#batt-l').textContent = `${Math.round(Math.max(0, Math.min(1, (sim.batt - 11.8) / 0.9)) * 100)} %`;
    s.classList.toggle('running', sim.running);
    s.classList.toggle('valve-open', sim.valve);
    s.classList.toggle('sunny', q('#sun').checked);
    q('#sim-state').innerHTML = `
      <h3 style="font-size:14px;margin-bottom:10px">Ce que calcule l’ESP32</h3>
      <div class="spread small"><span>Humidité mesurée</span><b>${sim.m.toFixed(1)} %</b></div>
      <div class="spread small" style="margin-top:6px"><span>Besoin du ${esc(species.name.toLowerCase())}</span><b>${species.optimal} %</b></div>
      <div class="spread small" style="margin-top:6px"><span>Indice de soif</span><b style="color:${col}">${idx} / 100</b></div>
      <div class="thirst-bar" style="margin:8px 0"><div class="track"><div class="fill" style="width:${idx}%;background:${col}"></div></div></div>
      <div class="reco ${idx >= 65 ? 'water' : idx >= 35 ? 'watch' : 'ok'}" style="padding:10px 12px">${icon(sim.valve ? 'drop' : idx >= 65 ? 'drop' : 'check')}<div><strong style="font-size:13.5px">${sim.valve ? 'Vanne ouverte : arrosage en cours' : idx >= 65 ? 'La plante a soif' : idx >= 35 ? 'À surveiller' : 'Pas besoin d’eau'}</strong>${sim.running ? '' : '<p>Démarrez la simulation pour activer le mode autonome.</p>'}</div></div>`;
    return idx;
  }

  function step() {
    const species = sp();
    const sunny = q('#sun').checked;
    if (sim.valve) sim.m += 0.7;
    else sim.m -= sunny ? 0.18 : 0.07;
    sim.m = Math.max(3, Math.min(45, sim.m));
    sim.batt = Math.max(11.7, Math.min(12.8, sim.batt + (sunny ? 0.004 : -0.003) - (sim.valve ? 0.006 : 0)));
    const idx = thirstIndex({ moisture: sim.m, tempC: sunny ? 33 : 26 }, species, 10);
    if (!sim.valve && idx >= 65) {
      sim.valve = true;
      log(`Indice de soif ${idx} ≥ 65 → la plante a soif : VANNE OUVERTE (G26 = HIGH)`);
    } else if (sim.valve && sim.m >= species.optimal) {
      sim.valve = false;
      log(`Humidité revenue à ${sim.m.toFixed(1)} % (optimum ${species.optimal} %) → VANNE FERMÉE`);
    }
    if (sim.n++ % 4 === 0) log(`Humidité ${sim.m.toFixed(1)} % · Temp ${sunny ? 33 : 26} °C · Batterie ${sim.batt.toFixed(2)} V · Indice ${idx}`);
    paint();
  }

  q('#start').addEventListener('click', () => {
    sim.running = !sim.running;
    q('#m').disabled = !sim.running;
    q('#start').innerHTML = sim.running ? `${icon('reset')} Arrêter la simulation` : `${icon('zap')} Démarrer la simulation`;
    q('#start').classList.toggle('stop', sim.running);
    clearInterval(sim.timer);
    if (sim.running) {
      log('ESP32 démarré — GreenTrack mode autonome');
      log(`Espèce : ${sp().name} (stress ${sp().stress} %, optimum ${sp().optimal} %)`);
      sim.timer = setInterval(step, 500);
    } else {
      sim.valve = false;
      log('Simulation arrêtée');
    }
    paint();
  });
  q('#m').addEventListener('input', (e) => {
    sim.m = +e.target.value;
    paint();
  });
  q('#sp').addEventListener('change', () => {
    if (sim.running) log(`Nouvelle espèce : ${sp().name}`);
    paint();
  });
  q('#sun').addEventListener('change', paint);
  paint();
  setStop(() => clearInterval(sim.timer));
}

// ───────────── Matériel ─────────────
function bomTab(root) {
  const rows = [...Object.values(PARTS).filter((p) => p.qty), ...EXTRA_BOM];
  const total = rows.reduce((a, p) => a + p.price * (p.qty || 1), 0);
  root.innerHTML = `
    <div class="grid g-3">
      <div class="card kpi"><div class="kpi-label">Coût d’un point d’arrosage</div><div class="kpi-value">≈ ${fcfa(Math.round(total / 1000) * 1000)}</div><div class="kpi-foot">prix indicatifs, marché de Cotonou / en ligne</div></div>
      <div class="card kpi"><div class="kpi-label">Autonomie</div><div class="kpi-value">3 à 5 jours</div><div class="kpi-foot">sans soleil, grâce à la veille profonde de l’ESP32</div></div>
      <div class="card kpi"><div class="kpi-label">Consommation</div><div class="kpi-value">0 FCFA / mois</div><div class="kpi-foot">100 % solaire, aucun abonnement</div></div>
    </div>
    <div class="card mt"><div class="table-wrap"><table class="table bom">
      <thead><tr><th>Composant</th><th>Qté</th><th>À quoi ça sert</th><th style="text-align:right">Prix</th></tr></thead>
      <tbody>${rows.map((p) => `<tr><td><strong>${esc(p.name)}</strong></td><td>${p.qty}</td><td class="muted">${esc(p.role)}</td><td style="text-align:right;white-space:nowrap">${fcfa(p.price * (p.qty || 1))}</td></tr>`).join('')}
      <tr><td colspan="3"><strong>Total</strong></td><td style="text-align:right"><strong>${fcfa(total)}</strong></td></tr></tbody>
    </table></div></div>
    <p class="small muted">Astuce : un même panneau et une même batterie peuvent alimenter plusieurs vannes proches, ce qui divise le coût par arbre dans un parc.</p>`;
}

// ───────────── Étapes ─────────────
function stepsTab(root, showOnCircuit) {
  root.innerHTML = `<div class="steps">${STEPS.map(
    (s, i) => `<article class="card step"><span class="guide-num">${i + 1}</span><div style="flex:1"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div><button class="btn btn-sm" data-step="${i}">${icon('eye')} Voir sur le schéma</button></article>`
  ).join('')}</div>`;
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (b) showOnCircuit(STEPS[+b.dataset.step].parts);
  });
}

// ───────────── Code ─────────────
function codeTab(root, code, file, hint) {
  root.innerHTML = `
    <div class="card card-pad spread" style="flex-wrap:wrap"><p style="margin:0;max-width:640px">${hint}</p>
      <div class="row"><button class="btn" id="copy">Copier</button><button class="btn btn-primary" id="dl">Télécharger ${esc(file)}</button></div></div>
    <pre class="code mt" style="max-height:620px">${esc(code)}</pre>`;
  root.querySelector('#copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast('Code copié');
    } catch {
      toast('Copie impossible', 'alert');
    }
  });
  root.querySelector('#dl').addEventListener('click', () => {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([code], { type: 'text/plain' })), download: file });
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

// ───────────── Tinkercad ─────────────
function tinkercadTab(root) {
  const wiring = [
    ['Capteur d’humidité du sol', 'Alim → 5V · GND → GND · SIG → A0'],
    ['TMP36 (température)', '+Vs → 5V · GND → GND · Vout → A1'],
    ['Transistor NPN 2N2222', 'Base ← résistance 1 kΩ ← D8 · Émetteur → GND'],
    ['Relais SPDT', 'Bobine entre 5V et le collecteur du transistor (+ diode 1N4007 en parallèle)'],
    ['Moteur DC (= pompe / vanne)', 'Pile 9 V + → COM du relais · NO → moteur · moteur → pile 9 V −'],
    ['LED verte', 'D5 → 220 Ω → LED → GND (« pas besoin d’eau »)'],
    ['LED rouge', 'D6 → 220 Ω → LED → GND (« a soif »)'],
  ];
  root.innerHTML = `
    <div class="card card-pad">
      <h3 style="font-size:15px">Reproduire le montage dans Tinkercad Circuits</h3>
      <p class="muted" style="margin:6px 0 0;max-width:760px">Tinkercad ne propose pas l’ESP32 : on valide la même logique (indice de soif + arrosage autonome) avec un <b>Arduino Uno</b>. Le moteur DC joue le rôle de l’électrovanne. Dans la simulation, faites glisser le curseur du capteur d’humidité : la pompe démarre quand la plante a soif et s’arrête quand le sol est revenu à l’optimum.</p>
      <a class="btn btn-primary mt" href="https://www.tinkercad.com/circuits" target="_blank" rel="noopener">Ouvrir Tinkercad Circuits</a>
    </div>
    <div class="grid g-2 mt">
      <div class="card"><div class="card-head"><h3>Câblage</h3></div><div class="table-wrap" style="margin-top:8px"><table class="table">
        <tbody>${wiring.map(([a, b]) => `<tr style="cursor:default"><td><strong>${esc(a)}</strong></td><td class="small">${esc(b)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div class="card-head"><h3>Code Arduino Uno</h3><button class="btn btn-sm" id="copy-uno">Copier</button></div><div class="card-body"><pre class="code" style="max-height:460px">${esc(unoCode)}</pre></div></div>
    </div>`;
  root.querySelector('#copy-uno').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(unoCode);
      toast('Code copié — collez-le dans l’onglet « Code » de Tinkercad (mode Texte)');
    } catch {
      toast('Copie impossible', 'alert');
    }
  });
}
