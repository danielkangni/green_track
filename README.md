# GreenTrack 🌳

**Plateforme de surveillance intelligente des espaces verts du Bénin, conçue pour l’ANAP.**

GreenTrack suit chaque plantation (neem, baobab, flamboyant, cocotier…) à l’aide de capteurs d’humidité du sol. Elle calcule pour chacune un **indice de soif propre à son espèce**, puis recommande une action simple : *aucune intervention*, *surveillance* ou *arrosage nécessaire*.

Le prototype fonctionne avec des **données IoT simulées**. Son architecture est prête à recevoir de vrais capteurs **ESP32 / Arduino**.

> 🌍 **Hackathon** · Un outil pour que chaque arbre planté au Bénin survive à la saison sèche, en arrosant **au bon endroit, au bon moment, avec la bonne quantité**.

## 📚 Documentation

| Document | Pour qui | Contenu |
|---|---|---|
| [🎤 Guide de démo](docs/GUIDE_DEMO.md) | Équipe, jury | Le déroulé en 5 minutes, les questions probables, le plan B |
| [💧 L’indice de soif](docs/INDICE_DE_SOIF.md) | Tout le monde | La formule expliquée simplement, avec exemples |
| [🏗️ Architecture](docs/ARCHITECTURE.md) | Développeurs | Flux de données, API de la passerelle, organisation du code |
| [🔧 Construire un capteur](docs/MATERIEL.md) | Makers, techniciens | Matériel, câblage, étalonnage, version Tinkercad |
| [🤝 Contribuer](docs/CONTRIBUER.md) | Équipe | Conventions, recettes pour ajouter une espèce ou un écran |

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # version de production dans dist/
npm run preview    # sert la version de production
```

## Fonctionnalités

| Écran | Rôle |
|---|---|
| **Tableau de bord** | KPI (plantations, indice de soif moyen, arrosages nécessaires, eau économisée, capteurs en ligne), humidité du sol par site sur 48 h, répartition des états, consommation d’eau sur 30 jours (planifiée vs pilotée), alertes prioritaires, journal en temps réel |
| **Carte interactive** | Les 6 espaces verts suivis (Cotonou, Porto-Novo, Ouidah, Abomey-Calavi) et chaque plantation, filtrables par état et par espèce, avec arrosage depuis la carte |
| **Maquette 3D** | Jumeau numérique du parc pilote (Place des Amazones), détaillé plus bas |
| **Alertes** | Arrosages, surveillances, interventions terrain (termites, branches cassées…) et anomalies de capteurs (hors ligne, batterie faible) |
| **Passeports végétaux** | Une fiche par plante : espèce, âge, hauteur, GPS, jauge de l’indice de soif, seuils de l’espèce, historique 48 h, capteur, historique d’entretien |
| **Espèces** | Profils hydriques configurables (curseurs), avec une simulation en direct de l’indice obtenu ; ajout de nouvelles espèces |
| **Capteurs & IoT** | Architecture matérielle, état du parc de capteurs, bascule simulation ↔ passerelle ESP32, arrosage automatique, mode économie de données |

### Maquette 3D (Three.js)

Le parc reconstitue un coin de Cotonou : terre de barre, boulevard parcouru par des zémidjans, maisons à étage avec citernes sur les toits, vendeuses sous parasol, statue stylisée de l’Amazone, drapeau du Bénin. Il est entièrement procédural : aucun modèle 3D n’est téléchargé. On y trouve aussi une place centrale avec bassin, des massifs de bougainvilliers, une paillote et des lampadaires.

- **Sélection d’un arbre** : la caméra s’en approche et son passeport végétal s’ouvre dans le panneau latéral.
- **4 modes d’affichage** :
  - *Naturel* : le feuillage jaunit avec le stress hydrique.
  - *État de santé* : chaque couronne prend la couleur de son état (vert, orange, rouge).
  - *Humidité du sol* : un halo bleu au pied de chaque arbre, d’autant plus intense que le sol est humide.
  - *Réseau de capteurs* : les ESP32, les liaisons radio et les paquets de données en route vers la passerelle.
- **Simulation de l’arrosage** : des gouttes d’eau apparaissent, l’humidité remonte et l’indice baisse en direct.
- **Scénarios de démonstration** pour le jury : vague de chaleur, averse, arrosage groupé.
- **Synchronisation** : la 3D lit le même état que le tableau de bord. Un arrosage déclenché ici apparaît partout, et inversement.
- **Cycle jour/nuit** calé sur l’heure simulée.

## Mode autonome (aucune intervention humaine)

Activé par défaut. Chaque plante dont l’indice de soif atteint **65** est arrosée **automatiquement**, avec le volume adapté à son espèce, son âge et la chaleur. S’il pleut, l’arrosage est **reporté**. Tout est consigné dans l’écran **Arrosages** : date, plante, déclenchement auto ou manuel, litres, humidité avant → après et statut. L’historique s’exporte en CSV.

Sur le terrain, l’ESP32 garde ce comportement même **sans réseau** : si la passerelle est injoignable, il ouvre seul la vanne quand le sol passe sous le seuil de stress.

## Montage du capteur (façon Tinkercad)

L’écran **Montage du capteur** présente ce qu’il faut construire pour chaque plante :

- **Circuit interactif** : solaire 12 V, ESP32, sondes d’humidité et de température, relais et électrovanne. Au survol, chaque composant explique son rôle et montre ses câbles. Le bouton **« Démarrer la simulation »** fait couler le courant et le moniteur série affiche les décisions de l’ESP32. Faites baisser l’humidité : la vanne s’ouvre, l’eau coule, puis la vanne se referme à l’optimum.
- **Matériel** : liste des composants avec prix indicatifs, environ 75 000 FCFA par point d’arrosage.
- **Étapes** : 8 étapes de montage, chacune reliée au schéma.
- **Code ESP32** : à copier ou télécharger.
- **Version Tinkercad** : câblage Arduino Uno et code ([firmware/tinkercad_uno](firmware/tinkercad_uno/greentrack_uno.ino)) pour reproduire et simuler le montage dans Tinkercad Circuits, qui ne propose pas l’ESP32.

## L’indice de soif — l’intelligence végétale

```
base   = (optimum − humidité) / (optimum − flétrissement)      ∈ [0 ; 1]
climat = 1 + (T − 28 °C) × 0,03 × Kc                            ∈ [0,85 ; 1,35]
âge    = 1,2 (< 3 ans) · 1,1 (< 6 ans) · 1
indice = base × climat × âge × 100                              ∈ [0 ; 100]
```

| Indice | Recommandation |
|---|---|
| < 35 | 🟢 Aucune intervention |
| 35 – 64 | 🟠 Surveillance |
| ≥ 65 | 🔴 Arrosage nécessaire (avec le volume conseillé en litres) |

Une même humidité de 18 % donne donc une évaluation différente selon l’espèce : le **baobab** (optimum 16 %) est hydraté, alors que le **cocotier** (optimum 30 %) a soif. Le code se trouve dans [src/core/thirst.js](src/core/thirst.js).

## Architecture

```
Sonde capacitive ─► ESP32 ──Wi-Fi/LoRa──► Passerelle ──HTTP──► GreenTrack (navigateur)
 + DS18B20           veille profonde       server/gateway.js     indice de soif, alertes
                     ◄── commande vanne ◄──────────────────────── « Arroser »
```

- `src/core/sensors.js` définit une **interface de source unique**, `start()`, `stop()` et `water(id, litres)`, avec deux implémentations :
  - `SimulatedSource` : climat diurne, évapotranspiration par espèce, averses, arrosage automatique.
  - `GatewaySource` : interroge la passerelle réelle.

  Les deux poussent leurs mesures par la même fonction `applyReading()`. Passer au matériel réel ne demande donc aucune modification de l’interface.
- `server/gateway.js` est la passerelle Node.js, **sans dépendance** :

  ```bash
  node server/gateway.js     # port 8787
  ```

  | Méthode et route | Rôle |
  |---|---|
  | `POST /api/readings` | Reçoit les mesures des ESP32 |
  | `GET /api/readings` | Sert les dernières mesures à GreenTrack |
  | `POST /api/water` | Met en file une commande d’arrosage |
  | `GET /api/commands/:sensorId` | Renvoie sa commande à l’ESP32 |
- `firmware/greentrack_esp32/` contient le firmware Arduino de référence. Il mesure l’humidité (avec étalonnage) et la température, ainsi que la batterie et le signal Wi-Fi, envoie le tout en JSON, exécute les commandes de vanne, puis se met en veille profonde pendant 15 min.

Format d’une mesure :

```json
{ "sensorId": "ESP32-AMZ-001", "moisture": 18.4, "tempC": 31.2, "battery": 87, "rssi": -67 }
```

Pour tester sans matériel, lancez la passerelle, puis dans **Capteurs & IoT** choisissez « Passerelle ESP32 » avec l’adresse `http://localhost:8787`, et envoyez une mesure :

```bash
curl -X POST localhost:8787/api/readings -H 'Content-Type: application/json' \
     -d '{"sensorId":"ESP32-AMZ-001","moisture":11.2,"battery":77}'
```

## Adapté aux connexions limitées

- **Chargement à la demande** : le premier écran pèse environ 16 Ko gzip. Leaflet et Three.js ne sont téléchargés qu’à l’ouverture de la carte ou de la 3D.
- **Aucune ressource externe** à part les tuiles de carte : polices système, icônes SVG intégrées, modèles 3D procéduraux.
- **Service worker** (en production) : l’application et les tuiles de carte consultées restent disponibles hors connexion, et un bandeau prévient en cas de coupure.
- **Mode économie de données** : fonds de carte désactivés, 3D allégée (sans ombres, 30 i/s, moins de particules) et rafraîchissement ralenti.
- Les profils d’espèces et les réglages sont conservés localement.

## Structure

```
src/
  core/      thirst.js (indice de soif) · store.js (état + événements) · sensors.js (sources IoT)
  data/      species.js · sites.js · plants.js (registre simulé déterministe)
  views/     dashboard · map · twin (3D) · alerts · plants · passport · species · sensors
  twin/      builders.js (arbres et décor procéduraux)
server/      gateway.js
firmware/    greentrack_esp32/greentrack_esp32.ino
```

## Limites du prototype

- Les mesures sont simulées : une heure simulée s’écoule toutes les 2,5 s.
- Les localisations des sites sont approximatives.
- Les seuils hydriques des espèces sont indicatifs et doivent être validés par les agronomes de l’ANAP.
