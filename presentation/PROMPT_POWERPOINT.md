# Prompt — Créer le PowerPoint de présentation de GreenTrack

> **Mode d’emploi**
> 1. Ouvrez Claude (Claude Code dans ce dossier, ou claude.ai avec la compétence PowerPoint) à la racine du dépôt `green_track/`.
> 2. Copiez tout ce qui se trouve sous la ligne « DÉBUT DU PROMPT ».
> 3. Complétez les champs entre [crochets] de la section « À compléter par l’équipe ».
> 4. Envoyez. Claude présente d’abord le plan des diapositives et attend votre accord avant de produire le fichier.
>
> **Matière déjà prête dans ce dossier**
> - `presentation/images/` : 13 captures d’écran en 1920 × 1080 de l’application.
> - `presentation/video/greentrack-demo.mp4` : la démo filmée de l’application (1 min 47, 1080p, sans son, pour être commentée en direct).
> - `docs/` : guide de démo, indice de soif, architecture, matériel.

==================== DÉBUT DU PROMPT ====================

Tu vas créer la présentation PowerPoint (.pptx, format 16:9) du projet **GreenTrack**, que notre équipe présente devant le jury d’un hackathon. GreenTrack est une plateforme qui aide l’**ANAP** à surveiller et à préserver les espaces verts du **Bénin** : un capteur au pied de chaque plante mesure l’humidité du sol, GreenTrack calcule un **indice de soif propre à chaque espèce**, et le **mode autonome** arrose seul, juste ce qu’il faut.

Avant de commencer, lis dans ce dépôt : `README.md`, `docs/GUIDE_DEMO.md`, `docs/INDICE_DE_SOIF.md`, `docs/ARCHITECTURE.md` et `docs/MATERIEL.md`. Regarde ensuite chaque image de `presentation/images/`. Tout ce que tu écris doit venir de ces fichiers ou de cette consigne.

## Public et objectif

- **Public** : un jury de hackathon (techniciens et non-techniciens), et potentiellement des responsables de l’ANAP et de collectivités béninoises.
- **Objectif** : en 8 à 10 minutes, faire comprendre le problème, convaincre que la solution est utile, crédible et constructible, et donner envie de la financer ou de la piloter.
- **Langue** : français, phrases courtes, vocabulaire simple. Un agent municipal doit tout comprendre.

## Règles de fond (non négociables)

1. **Rien d’inventé.** Aucun chiffre, aucune statistique, aucune citation ni aucun partenaire qui ne figure pas dans le dépôt ou dans la section « À compléter ». Quand une diapositive gagnerait à avoir un chiffre de contexte (mortalité des jeunes plants, pluviométrie, budget d’arrosage…), écris un emplacement visible `[chiffre à sourcer]` et signale-le-moi dans ton récapitulatif.
2. **Les chiffres de GreenTrack sont ceux de la simulation**, et la présentation le dit : 116 plantations suivies sur 6 espaces verts simulés, environ 58 % d’eau économisée par rapport à un arrosage fixe (en simulation), environ 74 000 FCFA par point d’arrosage (prix indicatifs).
3. **Une idée par diapositive**, au plus 25 mots de texte visible. Le détail va dans les **notes de l’orateur**, que tu rédiges pour chaque diapositive (60 à 120 mots, à la première personne du pluriel, prêtes à être lues).
4. **Montrer plutôt que dire** : chaque diapositive porte une image (capture, schéma, icône, photo). Jamais de diapositive qui ne contient que du texte.

## Charte graphique (reprise de l’application)

| Rôle | Couleur |
|---|---|
| Vert forêt (fonds sombres, titres) | `#0F3B2C` |
| Vert feuille (accent principal) | `#2F9E44` |
| Menthe (accent sur fond sombre) | `#7BD389` |
| Terre de barre (rappel du sol béninois) | `#B5532F` |
| Sable (fonds clairs) | `#F5F2EA` |
| États : hydratée / à surveiller / assoiffée | `#2F9E44` / `#D98E1F` / `#D64545` |

- Police : **Inter** si elle est disponible, sinon Segoe UI ou Calibri. Titres en gras, corps de texte d’au moins 18 pt.
- Alterner les fonds sable (contenu) et les fonds vert forêt (transitions et temps forts).
- Captures d’écran présentées dans un cadre aux coins arrondis, avec une ombre douce. Jamais déformées : on garde les proportions 16:9.
- Un petit pied de page discret : « GreenTrack · ANAP · Bénin » et le numéro de diapositive.

## Images à utiliser (dossier `presentation/images/`)

| Fichier | Ce qu’on y voit | Diapositive conseillée |
|---|---|---|
| `01-guide.png` | Le guide « Comment fonctionne GreenTrack ? » en 3 idées | Fonctionnement |
| `02-accueil.png` | L’accueil : « X plantes ont soif », mode autonome activé | La solution |
| `03-parc-3d.png` | Le jumeau numérique 3D de la Place des Amazones | Parc 3D (temps fort) |
| `04-parc-3d-capteurs.png` | La 3D en mode « Réseau de capteurs » | Architecture IoT |
| `05-parc-3d-arbre.png` | Un arbre sélectionné et son passeport | Parc 3D |
| `06-parc-3d-arrosage.png` | Arrosage simulé dans la 3D | Mode autonome |
| `07-passeport.png` | Le passeport végétal d’un baobab | Indice de soif |
| `08-arrosages.png` | Le mode autonome et l’historique des arrosages | Mode autonome |
| `09-carte.png` | La carte interactive des plantations à Cotonou | La solution |
| `10-especes.png` | Les profils d’espèces configurables | Indice de soif |
| `11-montage-simulation.png` | Le schéma de câblage façon Tinkercad, simulation en cours | Le matériel |
| `12-materiel.png` | La liste du matériel et le coût par point d’arrosage | Coût |
| `13-alertes.png` | Les alertes intelligentes | La solution |

Pour les diapositives de contexte (problème, Bénin), utilise des **photos libres de droits** de végétation urbaine en Afrique de l’Ouest, de saison sèche ou d’arrosage manuel, issues de banques gratuites (Unsplash, Pexels, Wikimedia Commons), en notant la source dans les notes. Si tu ne peux pas télécharger d’images, place un cadre `[Photo : …]` décrivant précisément la photo attendue, et liste-les à la fin pour que l’équipe les ajoute.

## Vidéo de démonstration

Intègre `presentation/video/greentrack-demo.mp4` sur sa propre diapositive (« Démo »), en plein cadre, avec `07-passeport.png` ou `03-parc-3d.png` comme image d’aperçu. Dans les notes, indique le minutage pour la commenter :

| Temps | À l’écran |
|---|---|
| 0:00 | Accueil et guide en 3 idées |
| 0:12 | Parc en 3D : rotation, mode « état de santé », sélection d’un arbre |
| 0:25 | Arrosage simulé, modes capteurs et humidité du sol, scénario chaleur |
| 0:54 | Mode autonome et historique des arrosages |
| 1:04 | Passeport végétal d’une plante |
| 1:12 | Carte interactive |
| 1:21 | Montage du capteur : simulation du circuit, vanne qui s’ouvre |
| 1:38 | Liste du matériel, version Tinkercad |

Ajoute aussi la **publicité de 20 s** `presentation/video/greentrack-pub-1080p-web.mp4` (avec le son, voix off française). Place-la en ouverture, juste après le titre, ou en clôture, selon mon choix ; par défaut, en ouverture. Son image d’aperçu est `videos/greentrack-pub/miniature-1920x1080.jpg`.

## Plan de la présentation (14 diapositives)

1. **Titre** (fond vert forêt). « GreenTrack — chaque arbre a sa propre voix ». Sous-titre : « Surveiller et préserver les espaces verts du Bénin ». Visuel : `03-parc-3d.png` en grand, légèrement assombri. Noms de l’équipe, nom du hackathon, date.
2. **Le problème** (fond sable). Les jeunes arbres plantés en ville meurent en saison sèche, ou bien on les arrose tous pareil, même quand ce n’est pas utile. Trois pictogrammes : arbres perdus `[chiffre à sourcer]`, eau gaspillée, agents débordés. Photo : sol de terre de barre sec, jeune plant.
3. **Pourquoi c’est difficile aujourd’hui.** Pas de donnée par arbre, un arrosage au calendrier et non au besoin, des espèces aux besoins très différents (un baobab boit beaucoup moins qu’un cocotier), une connexion Internet limitée, pas d’électricité sur place.
4. **Nos inspirations** (une colonne par projet, avec son logo ou une capture d’écran publique si possible, sinon un pictogramme) :
   - **Green Ecolution** (Allemagne) : projet open source de gestion intelligente des arbres urbains, avec des capteurs qui guident l’arrosage. *Ce que nous en retenons* : piloter l’arrosage par des mesures plutôt que par un calendrier.
   - **OpenTreeMap** : plateforme collaborative d’inventaire des arbres urbains, avec une carte et une fiche par arbre. *Ce que nous en retenons* : le passeport végétal et la carte.
   - **Soqia-Advice** : outil de conseil en irrigation `[l’équipe vérifie et complète la description]`. *Ce que nous en retenons* : une recommandation simple et actionnable.
   - Bandeau en bas : **ce que GreenTrack ajoute**. Un indice de soif propre à chaque espèce, le mode autonome, une alimentation solaire, des coûts en FCFA, le fonctionnement hors ligne, et le jumeau 3D.
5. **La solution en une image** (fond vert forêt). Capteur → indice de soif → décision → arrosage. Visuel : `01-guide.png`.
6. **L’indice de soif.** Exemple marquant : à 18 % d’humidité, le baobab est à 0 (vert) mais le cocotier est à 71 (rouge). Échelle vert / orange / rouge. Visuels : `07-passeport.png` et `10-especes.png`. Les notes expliquent la formule simplement (`docs/INDICE_DE_SOIF.md`).
7. **La plateforme.** Accueil, carte et alertes. Visuels : `02-accueil.png`, `09-carte.png`, `13-alertes.png` en mosaïque.
8. **Le mode autonome.** « Il arrose tout seul, et il attend quand il pleut. » Historique avant → après, export CSV pour les rapports de l’ANAP, secours hors ligne dans l’ESP32. Visuels : `08-arrosages.png` et `06-parc-3d-arrosage.png`.
9. **Le parc en 3D** (temps fort, fond vert forêt). Le jumeau numérique de la Place des Amazones : zémidjans, terre de barre, statue de l’Amazone, capteurs au pied des arbres. Visuels : `03-parc-3d.png` et `05-parc-3d-arbre.png`.
10. **Démo** : la vidéo en plein cadre.
11. **Le matériel, constructible demain.** ESP32, sonde capacitive, électrovanne 12 V, solaire. Environ 74 000 FCFA par point, 0 FCFA par mois. Visuels : `11-montage-simulation.png` et `12-materiel.png`. Mention : testable sans matériel dans Tinkercad.
12. **Architecture et pensée pour le Bénin.** Capteurs → passerelle → plateforme. Premier écran d’environ 16 Ko, hors ligne, mode économie de données, 100 % français. Visuel : `04-parc-3d-capteurs.png` et un schéma simple redessiné d’après `docs/ARCHITECTURE.md`.
13. **Impact et prochaines étapes.** Pilote sur un parc (Place des Amazones), validation des seuils avec les agronomes de l’ANAP, puis extension aux sites de Porto-Novo, Ouidah et Abomey-Calavi. Indicateurs à suivre : survie des plants, litres économisés, temps d’agent gagné. Aucun chiffre promis.
14. **Merci** (fond vert forêt). Phrase de clôture, contact de l’équipe et lien du dépôt. Visuel : `02-accueil.png` ou la miniature de la pub.

## Animations

Sobres : apparition en fondu des éléments de chaque diapositive, transition « Fondu » ou « Pousser » entre les diapositives. Pas d’effets fantaisie.

## Livraison

1. D’abord, le **plan détaillé** : titre, texte visible, image et idée des notes pour chaque diapositive. Attends mon accord.
2. Ensuite, le fichier `presentation/GreenTrack-presentation.pptx`, avec les images et la vidéo intégrées et les notes de l’orateur remplies.
3. Une vérification : ouvre ou convertis le fichier en images (par exemple en PDF puis en PNG) et regarde chaque diapositive. Corrige tout texte qui déborde, toute image déformée, tout chevauchement ou contraste insuffisant.
4. Un récapitulatif : les emplacements `[chiffre à sourcer]` et `[Photo : …]` restants, et ce que tu n’as pas pu vérifier.

## À compléter par l’équipe

- Noms et rôles des membres de l’équipe : [ … ]
- Nom du hackathon, lieu et date : [ … ]
- Durée exacte du passage : [ ex. 8 min + 4 min de questions ]
- Description vérifiée de Soqia-Advice (et lien) : [ … ]
- Chiffres de contexte sourcés, s’il y en a (mortalité des plants, budget d’arrosage…) : [ … ]
- Contact et lien à afficher à la fin : [ … ]
- Ouvrir ou clore avec la publicité vidéo : [ ouverture / clôture / aucune ]
