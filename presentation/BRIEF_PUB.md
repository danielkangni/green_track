# Brief de la publicité GreenTrack (prompt Mavena « Démo d’application »)

> Proposition à valider par l’équipe avant de lancer la fabrication. Corrigez directement ce fichier.

- **Produit** : GreenTrack. Il surveille chaque arbre et l’arrose tout seul, au bon moment et avec la bonne quantité.
- **Support** : application web responsive, montrée sur téléphone, l’outil d’un agent sur le terrain.
- **Public visé** : jury du hackathon, ANAP, mairies et gestionnaires d’espaces verts du Bénin.
- **Message unique** : « Chaque arbre a sa propre voix, et GreenTrack l’écoute. »
- **Le parcours, en trois gestes** :
  1. Une alerte « Le cocotier AMZ-005 a soif » arrive. Aïcha l’ouvre et la jauge de soif affiche 83/100, en rouge.
  2. Le mode autonome est activé : la vanne s’ouvre, l’eau sort de l’écran et coule au pied de l’arbre, et la jauge redescend à 12, en vert.
  3. L’historique « Arrosages » : une pilule « Reporté · pluie détectée » sort de l’écran, puis « −58 % d’eau (simulation) ».
- **Ce qui sort de l’écran** : la carte d’alerte, la jauge de soif, la goutte et le goutte-à-goutte au sol, les pilules de l’historique, et de petits arbres (neem, baobab, cocotier) posés autour du téléphone.
- **Fil conducteur** : l’anneau de l’indice de soif, seul élément en couleur. Il est rouge quand l’arbre a soif et devient vert une fois l’arbre arrosé, puis revient dans le logo final.
- **Données affichées** : celles de l’application (cocotier AMZ-005, Place des Amazones, optimum 30 %, 116 plantes surveillées). L’économie d’eau est affichée comme un résultat de simulation.
- **Personnage de la voix** : Aïcha, agente des espaces verts à Cotonou (personnage fictif).
- **Appel à l’action** : bouton « Essayer GreenTrack ». Aucune adresse ni logo de magasin d’applications.
- **Où la vidéo sera vue** : dans le PowerPoint (diapositive d’ouverture ou de clôture) et sur les réseaux de l’équipe.
- **Ton** : chaleureux, net et confiant.
- **Charte** : studio sombre vert forêt `#0F3B2C`, sol laqué, un seul accent vert feuille `#2F9E44` (le rouge `#D64545` n’apparaît que pour l’état « a soif »), police Inter.
- **Matière fournie** : `presentation/images/` (captures de chaque écran) et l’icône `public/favicon.svg`.
- **Voix off** : oui. Voix ElevenLabs en français (modèle multilingue, voix de catalogue, aucune imitation d’une personne réelle). La clé se trouve dans `~/tekbot/Tekbot_Acad-mie/.env` (`ELEVENLABS_API_KEY`).
- **Dossier de travail** : `green_track/videos/greentrack-pub/`.

## Proposition de voix (5 phrases, environ 250 caractères)

1. « À Cotonou, Aïcha veille sur les arbres de la Place des Amazones. »
2. « Ce matin, le cocotier a soif : quatre-vingt-trois sur cent. »
3. « Mode autonome : la vanne s’ouvre, juste ce qu’il faut. »
4. « Et s’il pleut, GreenTrack attend. »
5. « GreenTrack. Chaque arbre a sa propre voix. »
