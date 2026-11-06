// Modèles 3D procéduraux « low-poly » : aucun fichier à télécharger,
// la maquette pèse quelques kilo-octets et reste fluide sur du matériel modeste.
import * as THREE from 'three';
import { rng } from '../data/plants.js';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0, flatShading: true, ...extra });
const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

function shadow(obj, cast = true, receive = false) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return obj;
}

// Boule de feuillage irrégulière
function blob(r, mat, rand, detail = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const p = g.attributes.position;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let k = seen.get(key);
    if (k === undefined) {
      k = 0.82 + rand() * 0.3;
      seen.set(key, k);
    }
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function trunk(rTop, rBot, h, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 7), mat);
  m.position.y = h / 2;
  return m;
}

function branch(from, to, r, mat) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, dir.length(), 6), mat);
  m.position.copy(from).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

// Chaque constructeur renvoie { group, canopy: [materials], sway: [objets animés], top, ring }
const BUILDERS = {
  neem(rand) {
    const g = new THREE.Group();
    const leaf = std('#3d7a33');
    g.add(trunk(0.32, 0.5, 5.2, std('#6b4a2f')));
    g.add(branch(new THREE.Vector3(0, 4, 0), new THREE.Vector3(1.6, 6.5, 0.4), 0.22, std('#6b4a2f')));
    g.add(branch(new THREE.Vector3(0, 4.3, 0), new THREE.Vector3(-1.4, 6.8, -0.6), 0.2, std('#6b4a2f')));
    const crown = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const b = blob(2.2 + rand() * 1.3, leaf, rand);
      const a = (i / 7) * Math.PI * 2;
      b.position.set(Math.cos(a) * (i ? 2.4 : 0), 7.4 + rand() * 2 + (i ? 0 : 1.4), Math.sin(a) * (i ? 2.4 : 0));
      crown.add(b);
    }
    g.add(crown);
    return { group: g, canopy: [leaf], sway: [crown], top: 11.5, ring: 1.7 };
  },

  baobab(rand) {
    const g = new THREE.Group();
    const bark = std('#9a8775');
    const prof = [
      [0, 0], [2.3, 0], [2.5, 0.8], [2.35, 3], [2.05, 5.5], [1.55, 7.6], [1.05, 9], [0.5, 9.8], [0, 9.9],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 9), bark));
    const leaf = std('#7c9a43');
    const crown = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rand() * 0.4;
      const len = 3 + rand() * 1.8;
      const from = new THREE.Vector3(Math.cos(a) * 0.5, 9.2, Math.sin(a) * 0.5);
      const to = new THREE.Vector3(Math.cos(a) * len, 11 + rand() * 1.8, Math.sin(a) * len);
      crown.add(branch(from, to, 0.42, bark));
      const tip = new THREE.Vector3(Math.cos(a + 0.5) * (len + 1), to.y + 1, Math.sin(a + 0.5) * (len + 1));
      crown.add(branch(to, tip, 0.18, bark));
      const b = blob(0.9 + rand() * 0.6, leaf, rand, 0);
      b.position.copy(tip);
      crown.add(b);
      const b2 = blob(0.7 + rand() * 0.5, leaf, rand, 0);
      b2.position.copy(to).add(new THREE.Vector3(0, 0.6, 0));
      crown.add(b2);
    }
    g.add(crown);
    return { group: g, canopy: [leaf], sway: [crown], top: 13.5, ring: 3.1 };
  },

  flamboyant(rand) {
    const g = new THREE.Group();
    const wood = std('#5f4630');
    g.add(trunk(0.3, 0.42, 3.4, wood));
    const ends = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      const to = new THREE.Vector3(Math.cos(a) * 3, 5.6, Math.sin(a) * 3);
      g.add(branch(new THREE.Vector3(0, 3.2, 0), to, 0.22, wood));
      ends.push(to);
    }
    const leaf = std('#4f8a34');
    const flower = std('#e0452a');
    const flower2 = std('#f2713a');
    const crown = new THREE.Group();
    const base = blob(1, leaf, rand, 1);
    base.scale.set(6.4, 1.3, 6.4);
    base.position.y = 6.1;
    crown.add(base);
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const d = rand() * 5;
      const b = blob(1.3 + rand() * 0.6, i % 3 ? flower : flower2, rand, 0);
      b.scale.y = 0.55;
      b.position.set(Math.cos(a) * d, 6.9 + rand() * 0.6 - d * 0.08, Math.sin(a) * d);
      crown.add(b);
    }
    g.add(crown);
    return { group: g, canopy: [leaf, flower, flower2], sway: [crown], top: 8.2, ring: 1.6 };
  },

  cocotier(rand) {
    const g = new THREE.Group();
    const lean = rand() * Math.PI * 2;
    const k = 0.6 + rand() * 0.8;
    const pts = [0, 4, 8, 12, 15].map((y) => new THREE.Vector3(Math.cos(lean) * (y / 15) ** 2 * 2.6 * k, y, Math.sin(lean) * (y / 15) ** 2 * 2.6 * k));
    const curve = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.26, 6), std('#8c7357')));
    const top = pts[pts.length - 1];
    const crown = new THREE.Group();
    crown.position.copy(top);
    const leaf = std('#4c8f35', { side: THREE.DoubleSide });
    const L = 5.2;
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.PlaneGeometry(1.1, L, 1, 8);
      const p = geo.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const t = (p.getY(v) + L / 2) / L;
        p.setXYZ(v, p.getX(v) * (1 - t * 0.75), t * L * 0.8, -(t * t) * L * 0.65);
      }
      geo.computeVertexNormals();
      const fr = new THREE.Mesh(geo, leaf);
      const pivot = new THREE.Group();
      pivot.rotation.y = (i / 10) * Math.PI * 2 + rand() * 0.3;
      fr.rotation.x = -1.05 + rand() * 0.35;
      pivot.add(fr);
      crown.add(pivot);
    }
    const nut = std('#7a6a2e');
    for (let i = 0; i < 5; i++) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 5), nut);
      const a = (i / 5) * Math.PI * 2;
      n.position.set(Math.cos(a) * 0.35, -0.35, Math.sin(a) * 0.35);
      crown.add(n);
    }
    g.add(crown);
    return { group: g, canopy: [leaf], sway: [crown], top: 16.5, ring: 1.3 };
  },

  manguier(rand) {
    const g = new THREE.Group();
    const leaf = std('#2e6a2f');
    g.add(trunk(0.4, 0.6, 3.2, std('#5a4029')));
    const crown = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const a = rand() * Math.PI * 2;
      const d = i ? 1.5 + rand() * 2 : 0;
      const b = blob(2.4 + rand() * 1.2, leaf, rand);
      b.position.set(Math.cos(a) * d, 5.6 + rand() * 2.2, Math.sin(a) * d);
      crown.add(b);
    }
    g.add(crown);
    return { group: g, canopy: [leaf], sway: [crown], top: 10, ring: 1.9 };
  },

  karite(rand) {
    const g = new THREE.Group();
    const wood = std('#4d3a28');
    g.add(branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.4, 2.6, 0.2), 0.5, wood));
    g.add(branch(new THREE.Vector3(0.4, 2.5, 0.2), new THREE.Vector3(-0.3, 5, 0), 0.38, wood));
    const leaf = std('#4f7a34');
    const crown = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = blob(1.8 + rand(), leaf, rand);
      b.position.set(Math.cos(a) * 2, 5.6 + rand() * 1.6, Math.sin(a) * 2);
      crown.add(b);
    }
    const c = blob(2.4, leaf, rand);
    c.position.y = 7;
    crown.add(c);
    g.add(crown);
    return { group: g, canopy: [leaf], sway: [crown], top: 9.5, ring: 1.6 };
  },

  acacia(rand) {
    const g = new THREE.Group();
    const wood = std('#6b5136');
    g.add(trunk(0.22, 0.34, 4, wood));
    g.add(branch(new THREE.Vector3(0, 3, 0), new THREE.Vector3(1.8, 5.4, 0), 0.16, wood));
    g.add(branch(new THREE.Vector3(0, 3.4, 0), new THREE.Vector3(-1.6, 6, 0.5), 0.15, wood));
    const leaf = std('#6b9a3c');
    const crown = new THREE.Group();
    [[0, 5.6, 0, 4.2], [1.2, 6.6, 0.4, 3], [-0.8, 7.4, -0.3, 2.2]].forEach(([x, y, z, r]) => {
      const b = blob(1, leaf, rand, 1);
      b.scale.set(r, 0.9, r);
      b.position.set(x, y, z);
      crown.add(b);
    });
    g.add(crown);
    return { group: g, canopy: [leaf], sway: [crown], top: 8.6, ring: 1.5 };
  },
};

const REF_HEIGHT = { neem: 12, baobab: 14, flamboyant: 9, cocotier: 16.5, manguier: 11, karite: 10, acacia: 9 };

export function buildTree(speciesId, height, seed) {
  const rand = rng(seed);
  const b = (BUILDERS[speciesId] || BUILDERS.neem)(rand);
  const s = THREE.MathUtils.clamp(height / (REF_HEIGHT[speciesId] || 11), 0.35, 1.25);
  b.group.scale.setScalar(s);
  b.scale = s;
  b.canopyBase = b.canopy.map((m) => m.color.clone());
  shadow(b.group);
  return b;
}

// ───────────────────────── Décor du parc ─────────────────────────
export function buildPark(scene, { lite }) {
  const rand = rng(77);
  const ground = new THREE.Group();

  // Sol de la ville : terre de barre (latérite rouge, typique du sud Bénin)
  const earth = new THREE.Mesh(new THREE.PlaneGeometry(320, 260), lam('#b8653c'));
  earth.rotation.x = -Math.PI / 2;
  earth.position.y = -0.06;
  earth.receiveShadow = true;
  ground.add(earth);
  // Boulevard goudronné qui fait le tour de la place, avec marquage central
  const asphalt = lam('#47494b');
  const mark = lam('#e8e4d8');
  const roadBand = (x, z, w, d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), asphalt);
    m.position.set(x, -0.03, z);
    m.receiveShadow = true;
    ground.add(m);
  };
  roadBand(0, -46, 126, 11);
  roadBand(0, 46, 126, 11);
  roadBand(-57, 0, 11, 103);
  roadBand(57, 0, 11, 103);
  for (let x = -54; x <= 54; x += 6) {
    for (const z of [-46, 46]) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(3, 0.02, 0.25), mark);
      d.position.set(x, 0, z);
      ground.add(d);
    }
  }
  for (let z = -40; z <= 40; z += 6) {
    for (const x of [-57, 57]) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 3), mark);
      d.position.set(x, 0, z);
      ground.add(d);
    }
  }
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(100, 78), lam('#c9c1b0'));
  walk.rotation.x = -Math.PI / 2;
  walk.position.y = -0.02;
  walk.receiveShadow = true;
  ground.add(walk);

  // Pelouse
  const shape = new THREE.Shape();
  const W = 46, H = 34, R = 6;
  shape.moveTo(-W + R, -H);
  shape.lineTo(W - R, -H);
  shape.quadraticCurveTo(W, -H, W, -H + R);
  shape.lineTo(W, H - R);
  shape.quadraticCurveTo(W, H, W - R, H);
  shape.lineTo(-W + R, H);
  shape.quadraticCurveTo(-W, H, -W, H - R);
  shape.lineTo(-W, -H + R);
  shape.quadraticCurveTo(-W, -H, -W + R, -H);
  const lawn = new THREE.Mesh(new THREE.ShapeGeometry(shape), lam('#78a04a'));
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  ground.add(lawn);

  // Bordure béton
  const curb = new THREE.Mesh(new THREE.ShapeGeometry(shape), lam('#d8d1c2'));
  curb.rotation.x = -Math.PI / 2;
  curb.position.y = -0.01;
  curb.scale.set(1.02, 1.03, 1);
  ground.add(curb);

  // Variations de pelouse
  for (let i = 0; i < (lite ? 8 : 26); i++) {
    const tone = rand();
    const m = new THREE.Mesh(new THREE.CircleGeometry(2 + rand() * 6, 12), lam(tone > 0.72 ? '#a9a259' : tone > 0.6 ? '#b07a4a' : tone > 0.3 ? '#86ad55' : '#6c9444'));
    m.rotation.x = -Math.PI / 2;
    m.position.set((rand() - 0.5) * 80, 0.005, (rand() - 0.5) * 58);
    m.receiveShadow = true;
    ground.add(m);
  }

  // Allées en terre de barre (latérite)
  const pathMat = lam('#c0703f');
  const addPath = (x, z, w, d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), pathMat);
    m.position.set(x, 0.03, z);
    m.receiveShadow = true;
    ground.add(m);
  };
  addPath(0, 0, 92, 2.8);
  addPath(0, 0, 2.8, 68);
  addPath(0, -29.5, 84, 2.4);
  addPath(0, 29.5, 84, 2.4);
  addPath(-41.5, 0, 2.4, 58);
  addPath(41.5, 0, 2.4, 58);

  // Place centrale, bassin et monument
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.08, 40), lam('#d4b08a'));
  plaza.position.y = 0.04;
  plaza.receiveShadow = true;
  ground.add(plaza);
  const basin = new THREE.Mesh(new THREE.TorusGeometry(4, 0.35, 6, 40), lam('#e6dfd0'));
  basin.rotation.x = -Math.PI / 2;
  basin.position.y = 0.3;
  ground.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(3.8, 32), new THREE.MeshStandardMaterial({ color: '#3f8fbf', roughness: 0.15, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.22;
  ground.add(water);
  ground.add(buildAmazon());

  // Massifs de bougainvilliers et haies
  const hedge = std('#3b6e2d');
  const bloom = std('#d6407f');
  const bloom2 = std('#f08a3c');
  const beds = [
    [-20, 3.2], [-20, -3.2], [20, 3.2], [20, -3.2], [-3.2, 16], [3.2, -16], [-3.2, -18], [3.2, 18],
  ];
  for (const [x, z] of beds) {
    const horiz = Math.abs(z) < 5;
    for (let i = 0; i < (lite ? 3 : 6); i++) {
      const b = blob(0.8 + rand() * 0.4, i % 2 ? hedge : rand() > 0.5 ? bloom : bloom2, rand, 0);
      b.scale.y = 0.7;
      b.position.set(x + (horiz ? (i - 2.5) * 1.6 : 0), 0.6, z + (horiz ? 0 : (i - 2.5) * 1.6));
      ground.add(shadow(b));
    }
  }
  // Haie périphérique (avec entrées)
  for (const side of [-1, 1]) {
    for (const [x0, x1] of [[-40, -4], [4, 40]]) {
      const hz = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 1, 0.9), hedge);
      hz.position.set((x0 + x1) / 2, 0.5, side * 32.2);
      ground.add(shadow(hz, true, true));
    }
    for (const [z0, z1] of [[-30, -3], [3, 30]]) {
      const hx = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1, z1 - z0), hedge);
      hx.position.set(side * 44.2, 0.5, (z0 + z1) / 2);
      ground.add(shadow(hx, true, true));
    }
  }

  // Bancs & lampadaires
  const lamps = [];
  const wood = lam('#7a5232');
  const metal = lam('#3a3f3d');
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd77a', emissiveIntensity: 0 });
  const benchSpots = [[-14, 2.4, 0], [14, -2.4, Math.PI], [-2.4, 22, Math.PI / 2], [2.4, -22, -Math.PI / 2], [-30, 2.4, 0], [30, -2.4, Math.PI]];
  for (const [x, z, r] of benchSpots) {
    const b = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.6), wood);
    seat.position.y = 0.5;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.1), wood);
    back.position.set(0, 0.8, -0.28);
    b.add(seat, back);
    for (const sx of [-0.85, 0.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), metal);
      leg.position.set(sx, 0.25, 0);
      b.add(leg);
    }
    b.position.set(x, 0, z + (z > 0 ? 0.6 : -0.6) * Math.sign(z || 1));
    b.rotation.y = r;
    ground.add(shadow(b));
  }
  const lampSpots = [[-10, 1.8], [10, -1.8], [-28, -1.8], [28, 1.8], [1.8, 10], [-1.8, -12], [1.8, 26], [-1.8, -26]];
  for (const [x, z] of lampSpots) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.2, 6), metal);
    pole.position.set(x, 2.1, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), bulbMat);
    bulb.position.set(x, 4.35, z);
    ground.add(shadow(pole), bulb);
    lamps.push(bulb);
  }

  // Paillote (abri traditionnel)
  const hut = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 6), wood);
    post.position.set(Math.cos(a) * 2.2, 1.3, Math.sin(a) * 2.2);
    hut.add(post);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 10), std('#c9a45c'));
  roof.position.y = 3.6;
  hut.add(roof);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 12), wood);
  table.position.y = 0.8;
  hut.add(table);
  hut.position.set(22, 0, -13);
  ground.add(shadow(hut));

  // Quartier de Cotonou : maisons à étage, boutiques, citernes sur les toits
  const city = buildCity(ground, rand, lite);

  // Drapeau du Bénin à l'entrée sud de la place
  const flag = buildFlag();
  flag.group.position.set(6, 0, 36);
  ground.add(flag.group);

  // Panneau d'entrée
  ground.add(buildSign('PLACE DES AMAZONES', 'Parc pilote GreenTrack · ANAP', -7, 36.5));

  scene.add(ground);
  return {
    lamps,
    bulbMat,
    update(dt, time) {
      city.update(dt, time);
      flag.update(time);
    },
  };
}

// Passerelle LoRa / Wi-Fi qui centralise les capteurs du parc
export function buildGateway() {
  const g = new THREE.Group();
  const metal = lam('#7d8580');
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6, 8), metal);
  pole.position.y = 3;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), lam('#f2f2ee'));
  box.position.set(0, 2.2, 0.3);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1), std('#1e3a5c', { metalness: 0.4, roughness: 0.3 }));
  panel.position.set(0, 4.6, 0.4);
  panel.rotation.x = -0.5;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 5), metal);
  ant.position.y = 6.8;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: '#2b7bb9' }));
  tip.position.y = 7.6;
  g.add(pole, box, panel, ant, tip);
  shadow(g);
  return { group: g, tip };
}

// Capteur au pied de l'arbre : piquet, boîtier ESP32, mini panneau solaire, LED d'état
export function buildSensor() {
  const g = new THREE.Group();
  const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 5), lam('#8d9490'));
  stake.position.y = 0.45;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.14), lam('#f4f4f0'));
  box.position.y = 0.75;
  const solar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.24), std('#1e3a5c', { metalness: 0.4, roughness: 0.3 }));
  solar.position.set(0, 0.92, 0);
  solar.rotation.x = -0.4;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#2f9e44' }));
  led.position.set(0, 0.8, 0.08);
  g.add(stake, box, solar, led);
  shadow(g);
  return { group: g, led };
}


// ───────────────────────── Ambiance béninoise ─────────────────────────

const SKIN = ['#5a3a26', '#4a2e1f', '#6b4630', '#3f271a'];
const PAGNE = ['#e0452a', '#f2b33d', '#1f8a5b', '#2b5fb9', '#8a2be2', '#d6407f', '#f08a3c', '#1aa3a3'];

// Statue stylisée de l'Amazone (guerrière du royaume du Danhomè) sur son socle
function buildAmazon() {
  const g = new THREE.Group();
  const stone = lam('#e9e3d6');
  const bronze = std('#7a5a32', { metalness: 0.65, roughness: 0.45 });
  [[3.2, 0.6, 0.3], [2.4, 0.6, 0.9], [1.6, 3.2, 2.8]].forEach(([w, h, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), stone);
    m.position.y = y;
    g.add(m);
  });
  const f = new THREE.Group();
  f.position.y = 4.4;
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 7), bronze);
  legL.position.set(-0.28, 1.1, 0.15);
  legL.rotation.x = -0.12;
  const legR = legL.clone();
  legR.position.set(0.28, 1.1, -0.2);
  legR.rotation.x = 0.18;
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.1, 8), bronze);
  skirt.position.y = 2.2;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 1.5, 8), bronze);
  torso.position.y = 3.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), bronze);
  head.position.y = 4.35;
  const armUp = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.6, 6), bronze);
  armUp.position.set(0.62, 4.3, 0);
  armUp.rotation.z = -0.35;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.28), std('#a7a9a6', { metalness: 0.8, roughness: 0.3 }));
  blade.position.set(0.98, 5.6, 0);
  blade.rotation.z = -0.35;
  const armDown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.4, 6), bronze);
  armDown.position.set(-0.55, 3.1, 0.1);
  armDown.rotation.z = 0.25;
  f.add(legL, legR, skirt, torso, head, armUp, blade, armDown);
  g.add(f);
  g.rotation.y = Math.PI;
  return shadow(g);
}

// Maison de Cotonou : béton peint, balcon, fenêtres, citerne noire sur le toit
function buildHouse(rand, lite) {
  const g = new THREE.Group();
  const facades = ['#efe2c4', '#e8c79a', '#f3ead9', '#d9e2cf', '#f0d2b4', '#e6d8c2', '#cfdde6', '#f2c9a0'];
  const floors = 1 + Math.floor(rand() * (rand() > 0.8 ? 4 : 3));
  const w = 8 + rand() * 6;
  const d = 8 + rand() * 4;
  const h = floors * 3.2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(facades[Math.floor(rand() * facades.length)]));
  body.position.y = h / 2;
  g.add(body);
  const win = lam('#2d3a3f');
  const trim = lam('#ffffff');
  // fenêtres sur la façade (vers +z)
  if (!lite) {
    for (let f = 0; f < floors; f++) {
      for (let x = -w / 2 + 1.6; x < w / 2 - 1; x += 2.4) {
        const wm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.1), win);
        wm.position.set(x, f * 3.2 + 1.8, d / 2 + 0.02);
        g.add(wm);
      }
    }
  }
  // balcons des étages
  for (let f = 1; f < floors; f++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.18, 1.2), trim);
    slab.position.set(0, f * 3.2, d / 2 + 0.6);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.8, 0.08), lam(rand() > 0.5 ? '#3b6e8f' : '#2f4f3a'));
    rail.position.set(0, f * 3.2 + 0.5, d / 2 + 1.18);
    g.add(slab, rail);
  }
  // rez-de-chaussée : boutique avec auvent coloré
  if (rand() > 0.35) {
    const shop = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.12, 2), lam(PAGNE[Math.floor(rand() * PAGNE.length)]));
    shop.position.set(0, 2.7, d / 2 + 1);
    shop.rotation.x = 0.15;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.7, 0.1), lam(['#f2c12e', '#2b7bb9', '#e0452a', '#1f8a5b'][Math.floor(rand() * 4)]));
    sign.position.set(0, 3.1, d / 2 + 0.06);
    g.add(shop, sign);
  }
  if (floors === 1 && rand() > 0.4) {
    // toit en tôle ondulée
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.15, d + 0.8), lam(rand() > 0.5 ? '#9aa1a3' : '#8a5a3c'));
    roof.position.y = h + 0.5;
    roof.rotation.x = 0.12;
    g.add(roof);
  } else {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), lam('#d8cfbf'));
    parapet.position.y = h + 0.3;
    parapet.scale.set(1.01, 1, 1.01);
    g.add(parapet);
    // citerne d'eau noire, omniprésente sur les toits
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 12), lam('#1c1c1c'));
    tank.position.set(w / 2 - 1.4, h + 1.35, -d / 2 + 1.4);
    g.add(tank);
  }
  shadow(g, !lite, true);
  return g;
}

function buildPerson(rand, withHeadload = false) {
  const g = new THREE.Group();
  const cloth = lam(PAGNE[Math.floor(rand() * PAGNE.length)]);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.9, 6), cloth);
  legs.position.y = 0.45;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.65, 6), lam(PAGNE[Math.floor(rand() * PAGNE.length)]));
  top.position.y = 1.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), lam(SKIN[Math.floor(rand() * SKIN.length)]));
  head.position.y = 1.7;
  g.add(legs, top, head);
  if (withHeadload) {
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.2, 0.22, 10), lam('#c9a45c'));
    bowl.position.y = 1.95;
    g.add(bowl);
  } else if (rand() > 0.5) {
    const wrap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), cloth);
    wrap.position.y = 1.76;
    g.add(wrap);
  }
  return shadow(g);
}

// Zémidjan : moto-taxi, conducteur en chemise jaune
function buildZem(rand) {
  const g = new THREE.Group();
  const tire = lam('#1b1b1b');
  for (const x of [-0.7, 0.7]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 6, 12), tire);
    w.position.set(x, 0.38, 0);
    g.add(w);
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.3), lam(['#b3261e', '#1f3c88', '#222', '#c0c0c0'][Math.floor(rand() * 4)]));
  body.position.y = 0.7;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.34), lam('#1b1b1b'));
  seat.position.set(-0.15, 0.92, 0);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.8), lam('#888'));
  bar.position.set(0.62, 1.15, 0);
  const driver = new THREE.Group();
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.45), lam('#f2c12e'));
  shirt.position.y = 1.35;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), lam(SKIN[Math.floor(rand() * SKIN.length)]));
  head.position.y = 1.82;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), lam('#f5f5f5'));
  helmet.position.y = 1.86;
  driver.add(shirt, head, helmet);
  g.add(body, seat, bar, driver);
  if (rand() > 0.45) {
    const p = buildPerson(rand);
    p.scale.setScalar(0.85);
    p.position.set(-0.55, 0.55, 0);
    g.add(p);
  }
  return shadow(g);
}

function buildCar(rand) {
  const g = new THREE.Group();
  const color = ['#f2f2ee', '#c4c8cc', '#2b5fb9', '#7a1f1f', '#2c2c2c', '#e8c13a'][Math.floor(rand() * 6)];
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 1.8), std(color, { roughness: 0.5, metalness: 0.3 }));
  body.position.y = 0.75;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.75, 1.6), std('#30404a', { roughness: 0.2, metalness: 0.4 }));
  cabin.position.set(-0.2, 1.55, 0);
  g.add(body, cabin);
  for (const [x, z] of [[1.3, 0.85], [1.3, -0.85], [-1.3, 0.85], [-1.3, -0.85]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 10), lam('#1b1b1b'));
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.36, z);
    g.add(w);
  }
  return shadow(g);
}

// Étal de vendeuse au bord de la route, sous un grand parasol
function buildStall(rand) {
  const g = new THREE.Group();
  const table = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1.2), lam('#8a6a45'));
  table.position.y = 0.85;
  g.add(table);
  for (const [x, z] of [[0.9, 0.5], [0.9, -0.5], [-0.9, 0.5], [-0.9, -0.5]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), lam('#6b5136'));
    leg.position.set(x, 0.42, z);
    g.add(leg);
  }
  const goods = ['#e0452a', '#f2b33d', '#4c8f35', '#f08a3c'];
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), lam(goods[Math.floor(rand() * goods.length)]));
    f.position.set(-0.7 + (i % 3) * 0.7, 1.02, i < 3 ? 0.25 : -0.25);
    g.add(f);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 5), lam('#ddd'));
  pole.position.y = 1.3;
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.6, 8), lam(PAGNE[Math.floor(rand() * PAGNE.length)]));
  umb.position.y = 2.7;
  const seller = buildPerson(rand);
  seller.position.set(0, 0, -1);
  g.add(pole, umb, seller);
  return shadow(g);
}

// Position sur la boucle du boulevard (rectangle de demi-largeur hw et demi-profondeur hd)
function loopPoint(s, hw, hd) {
  const P = 4 * (hw + hd);
  s = ((s % P) + P) % P;
  if (s < 2 * hw) return { x: -hw + s, z: hd, a: 0 };
  s -= 2 * hw;
  if (s < 2 * hd) return { x: hw, z: hd - s, a: Math.PI / 2 };
  s -= 2 * hd;
  if (s < 2 * hw) return { x: hw - s, z: -hd, a: Math.PI };
  s -= 2 * hw;
  return { x: -hw, z: -hd + s, a: -Math.PI / 2 };
}

function buildCity(parent, rand, lite) {
  // maisons le long des deux côtés du boulevard
  const spots = [];
  for (let x = -100; x <= 100; x += 14) spots.push([x, -66, 0], [x, 66, Math.PI]);
  for (let z = -38; z <= 38; z += 14) spots.push([-76, z, Math.PI / 2], [76, z, -Math.PI / 2]);
  spots.forEach(([x, z, r], i) => {
    if (lite && i % 2) return;
    const h = buildHouse(rand, lite);
    h.position.set(x + (rand() - 0.5) * 3, 0, z + Math.sign(z || 0) * rand() * 3);
    h.rotation.y = r;
    parent.add(h);
  });

  // vendeuses au bord de la route
  const stalls = [[-30, 56], [-8, 55.5], [22, 56.5], [40, -55.5], [-44, -56], [66, 18], [-66, -12]];
  stalls.slice(0, lite ? 3 : stalls.length).forEach(([x, z]) => {
    const st = buildStall(rand);
    st.position.set(x, 0, z);
    st.rotation.y = rand() * Math.PI;
    parent.add(st);
  });

  // circulation : zémidjans et voitures sur deux voies de sens opposés
  const movers = [];
  const nZem = lite ? 5 : 14;
  for (let i = 0; i < nZem; i++) {
    const z = buildZem(rand);
    parent.add(z);
    const outer = i % 2 === 0;
    movers.push({ obj: z, s: rand() * 412, v: 7 + rand() * 4, outer });
  }
  for (let i = 0; i < (lite ? 2 : 5); i++) {
    const c = buildCar(rand);
    parent.add(c);
    const outer = i % 2 === 1;
    movers.push({ obj: c, s: rand() * 412, v: 5 + rand() * 2, outer });
  }

  // promeneurs dans le parc, le long des allées
  const walkers = [];
  for (let i = 0; i < (lite ? 3 : 9); i++) {
    const p = buildPerson(rand, i % 4 === 0);
    parent.add(p);
    const alongX = i % 2 === 0;
    walkers.push({ obj: p, alongX, t: rand() * 80, v: 0.9 + rand() * 0.5, lane: (rand() - 0.5) * 1.6 });
  }

  return {
    update(dt, time) {
      for (const m of movers) {
        m.s += (m.outer ? 1 : -1) * m.v * dt;
        const p = m.outer ? loopPoint(m.s, 59.5, 48.5) : loopPoint(m.s, 54.5, 43.5);
        m.obj.position.set(p.x, 0, p.z);
        m.obj.rotation.y = p.a + (m.outer ? 0 : Math.PI);
      }
      for (const w of walkers) {
        w.t += w.v * dt;
        const k = (w.t % 80) / 80;
        const pos = (k < 0.5 ? k * 2 : 2 - k * 2) * 76 - 38;
        const dir = k < 0.5 ? 1 : -1;
        if (w.alongX) {
          w.obj.position.set(pos, Math.abs(Math.sin(time * 6 + w.t)) * 0.05, w.lane);
          w.obj.rotation.y = dir > 0 ? 0 : Math.PI;
        } else {
          w.obj.position.set(w.lane, Math.abs(Math.sin(time * 6 + w.t)) * 0.05, pos * 0.8);
          w.obj.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        }
      }
    },
  };
}

// Drapeau du Bénin : bande verte verticale, jaune en haut, rouge en bas
function buildFlag() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 9, 8), lam('#d9d9d9'));
  pole.position.y = 4.5;
  g.add(pole);
  const c = document.createElement('canvas');
  c.width = 150;
  c.height = 100;
  const x = c.getContext('2d');
  x.fillStyle = '#008751';
  x.fillRect(0, 0, 60, 100);
  x.fillStyle = '#fcd116';
  x.fillRect(60, 0, 90, 50);
  x.fillStyle = '#e8112d';
  x.fillRect(60, 50, 90, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(3, 2, 12, 1);
  const base = geo.attributes.position.array.slice();
  const cloth = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
  cloth.position.set(1.55, 8, 0);
  g.add(cloth);
  shadow(g);
  return {
    group: g,
    update(time) {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const bx = base[i * 3];
        p.setZ(i, Math.sin(bx * 2.2 - time * 4) * 0.12 * (bx + 1.5));
      }
      p.needsUpdate = true;
    },
  };
}

function buildSign(title, sub, x, z) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const g2 = c.getContext('2d');
  g2.fillStyle = '#0f3b2c';
  g2.fillRect(0, 0, 512, 160);
  g2.fillStyle = '#7bd389';
  g2.fillRect(0, 140, 512, 20);
  g2.fillStyle = '#ffffff';
  g2.font = 'bold 44px system-ui, sans-serif';
  g2.textAlign = 'center';
  g2.fillText(title, 256, 66);
  g2.font = '26px system-ui, sans-serif';
  g2.fillStyle = '#cfe9da';
  g2.fillText(sub, 256, 112);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.6, 0.15), [lam('#0f3b2c'), lam('#0f3b2c'), lam('#0f3b2c'), lam('#0f3b2c'), new THREE.MeshLambertMaterial({ map: tex }), lam('#0f3b2c')]);
  board.position.y = 2.2;
  for (const px of [-2.2, 2.2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), lam('#3a3f3d'));
    post.position.set(px, 1.1, 0);
    g.add(post);
  }
  g.add(board);
  g.position.set(x, 0, z);
  return shadow(g);
}
