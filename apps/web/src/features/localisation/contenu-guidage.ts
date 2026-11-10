// Textes du guidage quand la localisation est refusée (D083). Seul fichier à modifier pour corriger un
// texte : la logique (`appareil.ts`) et l'écran (`ui/guidage-localisation.tsx`) n'en contiennent aucun.
// Les noms de menus suivent iOS 18 et Android 14 ; textes Android à vérifier sur un vrai Android (E14).

export const APPAREILS = [
  'iphone_safari',
  'iphone_installee',
  'iphone_chrome',
  'android_chrome',
  'android_installee',
  'telephone_autre',
  'ordinateur',
  'inconnu',
] as const;

export type Appareil = (typeof APPAREILS)[number];

export type GuideLocalisation = {
  titre: string;
  etapes: readonly string[];
  /** Phrase en plus, après les étapes (ex. un refus mémorisé par Safari). */
  complement?: string;
};

const REVENIR = 'Revenez ici et touchez « Autoriser la localisation ».';
const SERVICE_IPHONE =
  'Ouvrez Réglages › Confidentialité et sécurité › Service de localisation, et activez-le.';
const POSITION_ANDROID = 'Glissez du haut de l’écran vers le bas et activez Position.';

export const LIBELLES_GUIDAGE = {
  lien: 'Comment autoriser la localisation ?',
  toujoursBloquee: 'La localisation est toujours bloquée : suivez les étapes ci-dessous.',
} as const;

export const GUIDES_LOCALISATION: Record<Appareil, GuideLocalisation> = {
  iphone_safari: {
    titre: 'Sur iPhone',
    etapes: [
      SERVICE_IPHONE,
      'Sur la même page, touchez Sites web Safari › « Lorsque l’app est active ».',
      REVENIR,
    ],
    complement:
      'Toujours bloqué ? Touchez aA dans la barre d’adresse › Réglages du site web › Localisation › Autoriser.',
  },
  iphone_installee: {
    titre: 'Sur iPhone',
    etapes: [
      SERVICE_IPHONE,
      'Sur la même page, touchez Sites web Safari › « Lorsque l’app est active ».',
      REVENIR,
    ],
  },
  iphone_chrome: {
    titre: 'Sur iPhone, avec Chrome',
    etapes: [
      SERVICE_IPHONE,
      'Sur la même page, touchez Chrome › « Lorsque l’app est active ».',
      REVENIR,
    ],
  },
  android_chrome: {
    titre: 'Sur Android, avec Chrome',
    etapes: [
      POSITION_ANDROID,
      'Dans Chrome, touchez l’icône à gauche de l’adresse › Autorisations › Position › Autoriser.',
      REVENIR,
    ],
  },
  android_installee: {
    titre: 'Sur Android',
    etapes: [
      POSITION_ANDROID,
      'Ouvrez Chrome › ⋮ › Paramètres › Paramètres des sites › Position › touchez le site › Autoriser.',
      REVENIR,
    ],
  },
  telephone_autre: {
    titre: 'Sur votre téléphone',
    etapes: [
      'Activez la localisation du téléphone, puis autorisez ce site dans les réglages de votre navigateur.',
      REVENIR,
    ],
  },
  ordinateur: {
    titre: 'Sur ordinateur',
    etapes: [
      'Cliquez sur l’icône à gauche de l’adresse › Position › Autoriser.',
      'Rechargez la page.',
    ],
  },
  inconnu: {
    titre: 'Pour autoriser la localisation',
    etapes: [
      'Activez la localisation de votre appareil, puis autorisez ce site dans les réglages de votre navigateur.',
      REVENIR,
    ],
  },
};
