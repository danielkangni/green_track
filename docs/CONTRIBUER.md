# 🤝 Contribuer à GreenTrack

## Démarrer

```bash
git clone git@github.com:danielkangni/green_track.git
cd green_track
npm install
npm run dev          # développement, http://localhost:5173
npm run build        # production dans dist/
npm run preview      # tester la version de production
node server/gateway.js   # (optionnel) passerelle IoT sur le port 8787
```

> 💡 Si `npm run dev` affiche `ENOSPC: System limit for number of file watchers`, augmentez la limite d’observateurs de fichiers (`fs.inotify.max_user_watches`) ou utilisez `npm run build && npm run preview`.

## Règles du projet

- **Tout en français** : interface, messages et commentaires.
- **Léger avant tout** : pas de framework, pas de police ni d’image externe. Chaque nouvelle dépendance doit être justifiée.
- **Simple à comprendre** : si un agent de l’ANAP ne comprend pas un écran en 10 secondes, il faut le simplifier.
- **Une seule source de vérité** : les vues lisent `store` et écoutent `on()`. Elles ne gardent jamais leur propre copie des données.

## Recettes courantes

### Ajouter une espèce par défaut

Ajoutez un objet dans [src/data/species.js](../src/data/species.js) :

```js
{ id: 'teck', name: 'Teck', scientific: 'Tectona grandis', family: 'Lamiacées',
  optimal: 23, stress: 15, wilting: 9, dailyLiters: 30, kc: 0.8,
  drought: 'moyenne', growth: 'rapide', maintenance: '…', color: '#4f8a3a' }
```

Pour un rendu 3D dédié, ajoutez un constructeur dans `BUILDERS` de [src/twin/builders.js](../src/twin/builders.js). Sinon, le modèle du neem est utilisé.

### Ajouter un écran

1. Créez `src/views/mon-ecran.js`, qui exporte `meta()` et `render(el, params)`. `render` retourne une fonction de nettoyage.
2. Déclarez la route dans `ROUTES` de [src/main.js](../src/main.js).

```js
export const meta = () => ({ title: 'Mon écran', sub: 'Une phrase qui explique' });
export function render(el) {
  el.innerHTML = '…';
  return on((type) => { /* rafraîchir */ });   // désabonnement automatique
}
```

### Brancher une nouvelle source de capteurs

Implémentez `start()`, `stop()` et `water(plantId, litres)`, puis appelez `applyReading(sensorId, mesure)` pour chaque mesure reçue. Voir `GatewaySource` dans [src/core/sensors.js](../src/core/sensors.js).

## Convention de commits

```
feat(3d): ajoute les zémidjans sur le boulevard
fix(carte): corrige le filtre par espèce
docs: explique l’étalonnage de la sonde
```

Types : `feat`, `fix`, `docs`, `style`, `refactor`, `chore`. Portées fréquentes : `core`, `iot`, `3d`, `carte`, `accueil`, `montage`, `firmware`.
