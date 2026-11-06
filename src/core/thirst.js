// Intelligence végétale : indice de soif propre à chaque plante.
//
// L'indice (0–100) compare l'humidité mesurée du sol aux seuils de l'espèce,
// puis le module selon le climat (évapotranspiration) et l'âge du sujet.
//
//   base   = (optimal − humidité) / (optimal − flétrissement)   ∈ [0, 1]
//   climat = 1 + (T − 28 °C) × 0,03 × kc                         ∈ [0,85 ; 1,35]
//   âge    = 1,2 si < 3 ans, 1,1 si < 6 ans, sinon 1
//   indice = clamp(base × climat × âge × 100, 0, 100)
//
// Recommandation :
//   indice < 35  → Aucune intervention
//   35 ≤ i < 65  → Surveillance
//   i ≥ 65       → Arrosage nécessaire

export const THRESHOLDS = { watch: 35, water: 65 };

export const LEVELS = {
  ok: { key: 'ok', label: 'Aucune intervention', short: 'Hydratée', color: '#2f9e44' },
  watch: { key: 'watch', label: 'Surveillance', short: 'À surveiller', color: '#e8a33d' },
  water: { key: 'water', label: 'Arrosage nécessaire', short: 'Assoiffée', color: '#d64545' },
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function climateFactor(tempC, kc = 0.8) {
  return clamp(1 + (tempC - 28) * 0.03 * kc, 0.85, 1.35);
}

export function ageFactor(ageYears) {
  if (ageYears < 3) return 1.2;
  if (ageYears < 6) return 1.1;
  return 1;
}

export function thirstIndex({ moisture, tempC }, species, ageYears) {
  const span = Math.max(1, species.optimal - species.wilting);
  const base = clamp((species.optimal - moisture) / span, 0, 1);
  return Math.round(clamp(base * climateFactor(tempC, species.kc) * ageFactor(ageYears) * 100, 0, 100));
}

export function levelFor(index) {
  if (index >= THRESHOLDS.water) return LEVELS.water;
  if (index >= THRESHOLDS.watch) return LEVELS.watch;
  return LEVELS.ok;
}

// Volume d'eau conseillé (L) pour ramener le sol à l'humidité optimale.
export function waterNeedLiters({ moisture, tempC }, species, ageYears) {
  const deficit = clamp((species.optimal - moisture) / Math.max(1, species.optimal - species.wilting), 0, 1);
  const size = clamp(0.25 + ageYears / 12, 0.25, 1.2);
  return Math.round(species.dailyLiters * deficit * size * climateFactor(tempC, species.kc) * 1.5);
}

// Diagnostic complet utilisé partout dans l'interface.
export function diagnose(plant, species) {
  const reading = plant.reading;
  const index = thirstIndex(reading, species, plant.age);
  const level = levelFor(index);
  const liters = level.key === 'ok' ? 0 : waterNeedLiters(reading, species, plant.age);
  let explanation;
  if (reading.moisture >= species.optimal) {
    explanation = `Sol à ${reading.moisture.toFixed(1)} %, au-dessus de l'optimum du ${species.name.toLowerCase()} (${species.optimal} %).`;
  } else if (reading.moisture > species.stress) {
    explanation = `Sol à ${reading.moisture.toFixed(1)} %, entre le seuil de stress (${species.stress} %) et l'optimum (${species.optimal} %).`;
  } else {
    explanation = `Sol à ${reading.moisture.toFixed(1)} %, sous le seuil de stress du ${species.name.toLowerCase()} (${species.stress} %).`;
  }
  return { index, level, liters, explanation };
}
