# 🔧 Construire un capteur GreenTrack

> Le schéma interactif, avec simulation, se trouve dans l’application : **Montage du capteur**.

Un **point d’arrosage** équipe une plante. Il est autonome en énergie (solaire), mesure le sol, décide et arrose.

## Liste du matériel

| Composant | Qté | Rôle | Prix indicatif |
|---|---|---|---|
| ESP32 DevKit | 1 | Le cerveau : mesures, Wi-Fi, décision | 6 000 FCFA |
| Sonde d’humidité capacitive v1.2 | 1 | Humidité du sol (ne rouille pas) | 2 500 FCFA |
| Sonde DS18B20 étanche | 1 | Température du sol | 3 000 FCFA |
| Résistance 4,7 kΩ | 1 | Tirage de la DS18B20 | 100 FCFA |
| Résistances 100 kΩ + 27 kΩ | 2 | Mesure de la batterie | 200 FCFA |
| Module relais 5 V | 1 | Interrupteur de la vanne | 2 000 FCFA |
| Électrovanne 12 V ½″ | 1 | Robinet automatique | 7 500 FCFA |
| Diode 1N4007 | 1 | Protection de la bobine | 100 FCFA |
| Convertisseur LM2596 | 1 | 12 V → 5 V | 2 500 FCFA |
| Batterie 12 V 7 Ah | 1 | Énergie pour la nuit | 15 000 FCFA |
| Panneau solaire 20 W | 1 | Recharge | 18 000 FCFA |
| Régulateur solaire 12 V | 1 | Protège la batterie | 6 000 FCFA |
| Tuyau goutte-à-goutte + raccords | 1 | Amène l’eau aux racines | 5 000 FCFA |
| Boîtier étanche IP65 | 1 | Protection pluie et poussière | 4 000 FCFA |
| Fils, borniers, gaine | — | Câblage | 2 000 FCFA |
| **Total** | | | **≈ 74 000 FCFA** |

💡 Dans un parc, **un panneau et une batterie peuvent alimenter plusieurs vannes** proches, ce qui fait nettement baisser le coût par arbre.

## Câblage

```
                 ┌──────────── Régulateur solaire ─────────────┐
 Panneau 20 W ──►│ PV+ / PV−      BAT+ / BAT−      OUT+ / OUT− │
                 └───────────────────┬───────────────┬─────────┘
                                     │               │
                              Batterie 12 V    LM2596 → 5 V
                                     │               │
           ┌───── COM ◄──────────────┘               ├──► VIN  ESP32
 Relais ───┤                                         └──► VCC  relais
           └───── NO ──► Vanne + ; Vanne − ──► Batterie −
                         (diode 1N4007 en parallèle sur la vanne)

ESP32  G34 ◄── A   sonde d’humidité   (+ 3,3 V, − GND)
       G4  ◄── D   DS18B20            (+ 3,3 V, − GND, 4,7 kΩ entre D et 3,3 V)
       G26 ──► IN  relais
       G35 ◄── point milieu du pont 100 kΩ / 27 kΩ (batterie + → GND)
```

| Broche ESP32 | Reliée à | Pourquoi |
|---|---|---|
| `VIN` | 5 V (LM2596) | Alimentation |
| `GND` | Masse commune | Référence |
| `3V3` | Rail 3,3 V | Alimente les sondes |
| `G34` | Sortie A de la sonde d’humidité | Entrée analogique |
| `G4` | Broche D de la DS18B20 | Bus 1-Wire |
| `G26` | IN du relais | Commande de la vanne |
| `G35` | Pont diviseur batterie | Niveau de charge |

## Étapes de montage

1. **Alimentation** : panneau → régulateur → batterie. Branchez toujours la batterie *avant* le panneau.
2. **Réglez le LM2596 à 5,0 V** au multimètre *avant* de brancher l’ESP32.
3. **ESP32 sur plaque d’essai** : 5 V → VIN, GND, 3,3 V vers le rail des sondes.
4. **Sondes** : humidité → G34 ; DS18B20 → G4 avec la résistance de 4,7 kΩ.
5. **Relais et vanne** : IN → G26 ; batterie + → COM, NO → vanne +, vanne − → batterie −. La diode se monte bague grise côté +.
6. **Pont diviseur** 100 kΩ / 27 kΩ → G35.
7. **Sur le terrain** : sonde à 20 cm de profondeur, à environ 50 cm du tronc, goutteur au même endroit, panneau plein sud.
8. **Programme** : ouvrez `firmware/greentrack_esp32` dans l’IDE Arduino, renseignez le Wi-Fi et l’`SENSOR_ID`, puis téléversez.

## Étalonnage de la sonde d’humidité

1. Sonde **à l’air libre** : notez la valeur brute → `RAW_DRY` (environ 3 300).
2. Sonde dans **un verre d’eau**, jusqu’au trait → `RAW_WET` (environ 1 350).
3. Reportez les deux valeurs en haut du firmware.

## Le mode autonome dans le firmware

```
réveil → mesure → envoi à la passerelle
       ├── passerelle OK  → exécute la commande décidée par GreenTrack
       └── passerelle KO  → humidité < seuil de stress ? → arrose seul
→ veille profonde 15 min
```

La plante n’est **jamais abandonnée**, même en cas de coupure réseau.

## Tester sans matériel : Tinkercad

Tinkercad ne propose pas l’ESP32. Le fichier [firmware/tinkercad_uno/greentrack_uno.ino](../firmware/tinkercad_uno/greentrack_uno.ino) reproduit la même logique sur **Arduino Uno** :

| Composant Tinkercad | Branchement |
|---|---|
| Capteur d’humidité du sol | Alim → 5V · GND → GND · SIG → A0 |
| TMP36 | +Vs → 5V · Vout → A1 · GND |
| NPN 2N2222 + 1 kΩ | D8 → 1 kΩ → base · émetteur → GND |
| Relais SPDT | Bobine entre 5V et le collecteur (+ diode) |
| Moteur DC (= vanne) + pile 9 V | Pile + → COM · NO → moteur → pile − |
| LED verte / rouge + 220 Ω | D5 / D6 |

Lancez la simulation et faites glisser le curseur du capteur : la pompe démarre quand la plante a soif.
