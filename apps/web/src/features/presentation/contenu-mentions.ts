// Textes de « Mentions légales et confidentialité » (fiche E13, D076).
// Chaque phrase sur la position décrit ce que fait le code : à revoir si ce parcours change.
import { marque } from '@/config/marque';

export const TEXTES_MENTIONS = {
  titre: 'Mentions légales et confidentialité',
  sections: [
    {
      titre: 'Éditeur',
      paragraphes: [
        `${marque.nom} est édité par Hardy Lino, dans le cadre du défi data.gouv.fr « Tourisme en train » (Fondation SNCF / Open Data University).`,
        'Contact\u00a0: wagoo.train@gmail.com',
      ],
    },
    {
      titre: 'Hébergeur',
      paragraphes: ['OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.'],
    },
    {
      titre: 'Votre position',
      paragraphes: [
        'Votre navigateur vous la demande, et vous pouvez refuser : vous choisissez alors une gare ou une ville.',
        "Elle n'est jamais enregistrée : ni en base, ni dans les journaux. L'application la garde en mémoire, seulement le temps que la page reste ouverte.",
        'Elle est envoyée à notre serveur, pour trouver les gares et les lieux proches de vous.',
        "Elle est envoyée à l'API Adresse de l'IGN pour trouver le nom de votre commune (recherche inverse). Quand vous cherchez une ville, le texte saisi lui est aussi envoyé.",
        'Le fond de carte est chargé depuis OpenFreeMap : votre navigateur lui demande les zones de la carte affichées, et ce service reçoit votre adresse IP, comme tout site consulté.',
      ],
    },
    {
      titre: 'Sur votre appareil',
      paragraphes: [
        "L'application garde la dernière gare utilisée (jamais votre position) et une copie des dernières réponses, pour rester lisible sans réseau.",
        'Aucun compte, aucune inscription.',
      ],
    },
    {
      titre: 'Cookies',
      paragraphes: [
        "Aucun cookie et aucune mesure d'audience : il n'y a donc pas de bandeau à accepter.",
      ],
    },
  ],
} as const;
