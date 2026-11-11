// Textes de la barre du trajet et de la feuille « Où allez-vous ? » (D084). Seul fichier à modifier pour
// corriger un texte : la logique (`recherche-destination.ts`) et l'écran n'en contiennent aucun.

export const TEXTES_TRAJET = {
  /** Partie destination de la barre, sans recherche. */
  ouAller: 'Où aller ?',
  /** Nom accessible de la barre : « Trajet : Autour de Dijon, vers Où aller ? ». */
  trajet: (depart: string, destination: string) => `Trajet : ${depart}, vers ${destination}`,
  modifierDepart: (depart: string) => `Départ : ${depart}, modifier`,
  modifierDestination: (destination: string) => `Destination : ${destination}, modifier`,
  effacer: 'Effacer la recherche',
  titreFeuille: 'Où allez-vous ?',
  champ: 'Nom de la destination',
  /** « 2 destinations sur 101 » sous le champ. */
  compte: (trouvees: number, total: number) =>
    `${trouvees} destination${trouvees > 1 ? 's' : ''} sur ${total}`,
  afficher: (nombre: number) =>
    nombre > 1 ? `Afficher les ${nombre} destinations` : 'Afficher la destination',
  /** Ligne d'une destination trouvée : « Gare Beaune · 45 trains/jour ». */
  ligneGare: (gare: string, trains: number) => `Gare ${gare} · ${trains} trains/jour`,
  aucune: (recherche: string) => `Aucune destination « ${recherche} » avec ces filtres`,
  aucuneTexte:
    'Vérifiez l’orthographe, ou effacez les filtres pour chercher dans toutes les destinations.',
  effacerFiltres: 'Effacer les filtres',
  chargement: 'Les destinations arrivent…',
} as const;
