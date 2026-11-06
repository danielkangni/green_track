# Publicité GreenTrack — 20 s, 1920 × 1080, 60 i/s

Vidéo fabriquée entièrement par code, avec le kit Mavena « Démo d’application » (structure de la vidéo d’exemple *Foulée v2* : 15 plans). La scène WebGL2 est rendue image par image. La voix off vient d’ElevenLabs (« Jean Maurice », voix française à l’accent africain, modèle multilingue v2, vitesse 1,2). La musique et les bruitages sont synthétisés. Aucun texte n’est ajouté par-dessus l’image : les seuls textes sont ceux de l’interface, le logo et le bouton.

Aïcha est un personnage fictif. Les données affichées sont celles de l’application et restent cohérentes avec la formule de l’indice de soif : cocotier AMZ-006, 2 ans, sol 20 % pour un optimum de 30 %, 34 °C, soit un indice de 83 et un besoin de 19 L. La prévision « Averse à 15 h » est une donnée de démonstration.

## Livrables

| Fichier | Contenu |
|---|---|
| `../../presentation/video/greentrack-pub-1080p-web.mp4` | Version web, environ 11 Mbit/s, avec le son (versionnée dans git) |
| `out/greentrack-pub-1080p.mp4` | Maître, environ 15 Mbit/s, avec le son (local, non versionné) |
| `miniature-1920x1080.jpg` | Miniature : le temps fort (100 %, « Arbre hydraté »), à 12,4 s |
| `storyboard-greentrack.jpg` | 18 images de la version livrée |
| `audio/script.json` | Le texte de la voix |

## Voix

1. « Aïcha veille sur le parc. Elle ouvre GreenTrack. »
2. « Le cocotier a soif : quatre-vingt-trois sur cent. »
3. « En mode autonome, la vanne s’ouvre, juste assez. »
4. « S’il pleut, GreenTrack attend. »
5. « GreenTrack. Chaque arbre a sa voix. »

Fil conducteur : l’anneau vert d’hydratation (100 − indice de soif). Il quitte l’icône de la notification, recule à 17 % quand l’indice 83 arrive, se referme pendant l’arrosage, jaillit à 100 % et revient dans le logo.

## Les 15 plans

| Plan | Début | Ce qu’on voit |
|---|---|---|
| 0 | 0,00 | Plongée : la notification « Le cocotier a soif » tombe, le doigt la touche |
| 1 | 1,00 | Le téléphone se dresse, l’anneau devient le logo GreenTrack |
| 2 | 3,56 | L’accueil s’assemble (4 blocs en volume), la caméra fonce sur l’indice |
| 3 | 5,00 | La carte de l’indice sort de l’écran, le compteur monte de 52 à 83 |
| 4 | 7,00 | Très gros plan : l’anneau recule de 48 % à 17 % |
| 5 | 7,50 | La pilule « Il lui faut 19 L · optimum 30 % » sort de l’écran |
| 6 | 8,28 | Très gros plan : le doigt enfonce « Activer le mode autonome » |
| 7 | 10,00 | Plongée : l’anneau d’eau se dessine au sol autour du téléphone |
| 8 | 11,00 | Gros plan : les litres montent (4 L/min) |
| 9 | 11,50 | Au ras du sol : la goutte de tête file vers son point de départ |
| 10 | 12,00 | 100 % : l’anneau jaillit, éclats, pilule « Arbre hydraté » |
| 11 | 12,78 | Onglet « Arrosages » : « Averse à 15 h », bouton « Attendre la pluie » → « Reporté » |
| 12 | 14,50 | Trois autres arbres tombent à côté (baobab, neem, flamboyant) |
| 13 | 15,00 | Travelling sur leurs indices : 10, 0, 18, 29 |
| 14 | 15,50 | Les arbres repartent, logo GreenTrack et bouton « Essayer GreenTrack » |

## Relancer (depuis ce dossier)

Le kit Mavena (`scene/moteur.js`, `scene/lib.js`, `tools/`…) n’est pas versionné, car c’est un produit acheté. Pour retravailler la vidéo, il faut recopier `scene/` et `tools/` depuis `~/Téléchargements/mavena-demo-kit/videos/demo-v2/`, puis remettre les fichiers propres à GreenTrack : `scene/cues.js`, `scene/film.js`, `scene/tex-greentrack.js`, `scene/index.html` et `scene/base.js`, ainsi que les réglages de `tools/voice.mjs`, `tools/assemble-voice.mjs`, `tools/sound.mjs` et `tools/outils-systeme.mjs`. Ces fichiers sont présents sur la machine de Daniel.

```bash
node tools/voice.mjs                 # voix (clé ElevenLabs lue dans ../../.env, jamais affichée)
node tools/assemble-voice.mjs        # calage sur la grille à 120 bpm → scene/timing.js
node tools/sound.mjs                 # musique, bruitages, mix → audio/mix.wav (−16 LUFS)
node tools/rendu.mjs video --scene scene/index.html --dpr 1 --workers 4 --bitrate 16000000 \
  --out out/greentrack-muet-1080p.mp4 --out2 out/greentrack-muet-1080p-12.mp4 --bitrate2 12000000 > out/rendu.log 2>&1 < /dev/null
node tools/bin/mux out/greentrack-muet-1080p.mp4 audio/mix.wav out/greentrack-pub-1080p.mp4
```

Le rendu prend environ 1 minute sur la carte NVIDIA, grâce à `tools/outils-systeme.mjs` qui force EGL/ANGLE. Sans carte graphique, Chrome retombe sur SwiftShader et le rendu échoue.

## Changer quelque chose

- **Un texte ou une valeur de l’interface** : `scene/tex-greentrack.js`. Les valeurs animées (indice, hydratation, litres) sont dans `fraction()` et `indiceCarte()` de `scene/film.js`.
- **La voix** : `audio/script.json`, puis `node tools/voice.mjs --force N`, `assemble-voice` et `sound`.
- **Un instant ou une coupe** : `scene/cues.js` (aucun temps écrit en dur ailleurs).
- **Un cadrage** : le tableau `CAMS` de `scene/film.js`.

## Contrôles effectués

- `coupes` + `controle.py` : 0 image figée et 0 saut de luminosité isolé. Les pics isolés correspondent aux 14 coupes, au bouton qui passe à « Reporté » (14,42 s) et au premier téléphone d’arbre qui s’allume (14,63 s).
- `comparer` : la version web est identique au maître, sans aucune image incomplète.
- `encode probe` : 20,000 s, 60 i/s, son stéréo 48 kHz.
- Son : −16,0 LUFS intégré, crête à −3,0 dBFS, voix au-dessus de l’accompagnement à chaque seconde.
- **Non vérifié** : la relecture de la voix par reconnaissance vocale (Whisper n’est pas installé). La voix a été vérifiée par son calage mot par mot, pas à l’oreille.
