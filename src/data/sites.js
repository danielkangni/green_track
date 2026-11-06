// Espaces verts suivis (localisations approximatives pour le prototype).
export const SITES = [
  {
    id: 'amazones',
    name: 'Parc pilote — Place des Amazones',
    city: 'Cotonou',
    lat: 6.3568,
    lng: 2.4331,
    area: 1.8,
    pilot: true, // reconstitué en 3D
    description: 'Site pilote équipé de capteurs, reconstitué dans la maquette 3D.',
  },
  {
    id: 'marina',
    name: 'Boulevard de la Marina',
    city: 'Cotonou',
    lat: 6.3527,
    lng: 2.4146,
    area: 3.2,
    description: 'Alignement littoral de cocotiers et de flamboyants.',
  },
  {
    id: 'etoile',
    name: "Place de l'Étoile Rouge",
    city: 'Cotonou',
    lat: 6.3729,
    lng: 2.4113,
    area: 1.1,
    description: 'Rond-point végétalisé, forte exposition au trafic.',
  },
  {
    id: 'jardin-pn',
    name: 'Jardin des Plantes et de la Nature',
    city: 'Porto-Novo',
    lat: 6.4943,
    lng: 2.6223,
    area: 4.5,
    description: 'Jardin botanique historique, collections arborées.',
  },
  {
    id: 'kpasse',
    name: 'Forêt sacrée de Kpassè',
    city: 'Ouidah',
    lat: 6.3655,
    lng: 2.0867,
    area: 2.4,
    description: 'Forêt patrimoniale, suivi des sujets remarquables.',
  },
  {
    id: 'uac',
    name: "Campus d'Abomey-Calavi",
    city: 'Abomey-Calavi',
    lat: 6.4166,
    lng: 2.3419,
    area: 5.0,
    description: 'Programme de reboisement universitaire.',
  },
];

export const siteById = (id) => SITES.find((s) => s.id === id);
