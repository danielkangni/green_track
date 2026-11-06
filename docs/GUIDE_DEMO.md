# 🎤 Guide de démonstration — 5 minutes pour convaincre le jury

> Objectif : montrer en 5 minutes que GreenTrack **voit** quand une plante a soif, **comprend** ses besoins et **agit seul**, même sans matériel physique sur la table.

```bash
npm install
npm run build && npm run preview     # http://localhost:4173
```

Ouvrez l’application **avant** le passage. Au premier lancement, le guide « Comment fonctionne GreenTrack ? » s’affiche. Lisez-le une fois, puis fermez-le.

---

## Minute 0 → 1 · Le problème et la promesse

> « À Cotonou, en saison sèche, les arbres plantés par l’ANAP meurent faute d’eau. Ou bien on les arrose tous les jours, même quand ils n’en ont pas besoin. **GreenTrack donne à chaque plante sa propre voix.** »

👉 Page **Accueil**. Montrez la phrase d’état (« 3 plantes ont soif ») et les **trois couleurs** : vert, orange, rouge. Le jury doit comprendre l’outil en 10 secondes.

## Minute 1 → 2 · Une plante, une fiche

👉 Cliquez sur une plante dans « À faire maintenant ». Son **passeport végétal** s’ouvre.

- La **jauge de soif** de 0 à 100.
- L’échelle des besoins de **son espèce** : flétrissement, stress, optimum.
- L’historique d’humidité sur 48 h.

> « Une humidité de 18 % est parfaite pour un baobab, mais c’est la soif pour un cocotier. GreenTrack ne compare pas les plantes entre elles : il compare chaque plante **à ses propres besoins**. »

## Minute 2 → 3 · Le parc en 3D (l’effet « waouh »)

👉 **Parc en 3D**, le jumeau numérique de la Place des Amazones.

1. Faites tourner la scène : boulevard, zémidjans, vendeuses, statue de l’Amazone.
2. Cliquez sur un **arbre rouge** : la caméra s’en approche et son passeport s’affiche.
3. **« Simuler l’arrosage »** : l’eau jaillit, l’indice baisse, l’anneau passe au vert.
4. Mode **« Réseau de capteurs »** : on voit les ESP32 envoyer leurs données à la passerelle.
5. Scénario **« Journée de forte chaleur »** : plusieurs arbres virent à l’orange ou au rouge.

## Minute 3 → 4 · Il arrose tout seul

👉 **Arrosages**. Le **mode autonome** est activé.

> « Personne n’a touché à rien. GreenTrack a arrosé chaque plante, avec la juste quantité, et il a attendu quand la pluie est arrivée. Chaque goutte est tracée. »

Montrez la colonne « Humidité avant → après », le badge « Reporté · Pluie détectée », puis l’export CSV pour les rapports de l’ANAP.

## Minute 4 → 5 · C’est constructible demain

👉 **Montage du capteur**.

1. Cliquez sur **« Démarrer la simulation »** : le courant circule dans les câbles.
2. Faites glisser l’**humidité du sol** vers le bas : la vanne s’ouvre, l’eau coule et le moniteur série affiche la décision de l’ESP32.
3. Onglet **Matériel** : environ **75 000 FCFA par point d’arrosage**, 100 % solaire.
4. Onglet **Version Tinkercad** : le même montage, reproductible sur Arduino Uno.

> « Le prototype tourne sur des données simulées, mais l’architecture est prête : le jour où l’on branche de vrais ESP32, l’interface ne change pas d’une ligne. »

---

## Questions probables du jury

| Question | Réponse courte |
|---|---|
| *Et sans Internet ?* | L’ESP32 arrose seul en secours. L’application fonctionne hors ligne (service worker) et propose un mode économie de données. |
| *Qui paie l’électricité ?* | Personne : chaque nœud a son panneau solaire et sa batterie, avec 3 à 5 jours d’autonomie. |
| *Pourquoi pas un simple minuteur ?* | Un minuteur arrose même quand il pleut, et il arrose pareil un baobab et un cocotier. Résultat simulé : **−58 % d’eau**. |
| *Les seuils sont-ils fiables ?* | Ce sont des valeurs indicatives, **modifiables** dans *Espèces*, à valider avec les agronomes de l’ANAP. |
| *Et si un capteur tombe en panne ?* | Une alerte « Capteur hors ligne » apparaît, la batterie faible est signalée, et l’arbre reste visible en gris sur la carte et en 3D. |

## Plan B (si quelque chose plante)

- Pas de 3D sur la machine du jury (vieux GPU) : activez **Réglages → Capteurs & connexion → Mode économie de données**. La 3D est allégée.
- Pas d’Internet : la carte perd ses fonds, mais tout le reste fonctionne.
- Pour repartir de zéro : videz le stockage local du navigateur (outils de développement → Application → Effacer).
