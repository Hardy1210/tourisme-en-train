// Photo d'un lieu à l'écran (D100, D101, D103) : lecture depuis la base, crédit, et passage de l'icône à
// la photo. Fonctions pures : la limite de temps et les événements du navigateur arrivent en paramètres.
import { describe, expect, it } from 'vitest';
import { etatSuivant, photoDe, texteCredit, type EtatPhoto } from './photo';

const ligne = {
  photo_petite: 'https://thumb.wikimedia.org/a/500px-a.jpg',
  photo_grande: 'https://thumb.wikimedia.org/a/960px-a.jpg',
  photo_auteur: 'Chau7',
  photo_licence: 'CC BY-SA 3.0',
  photo_licence_url: 'https://creativecommons.org/licenses/by-sa/3.0',
  photo_page: 'https://commons.wikimedia.org/wiki/File:A.jpg',
  photo_source: 'wikimedia_commons',
};

describe('photoDe : colonnes de la jointure → photo de l’API', () => {
  it('une photo, avec son crédit', () => {
    expect(photoDe(ligne)).toEqual({
      petite: 'https://thumb.wikimedia.org/a/500px-a.jpg',
      grande: 'https://thumb.wikimedia.org/a/960px-a.jpg',
      auteur: 'Chau7',
      licence: 'CC BY-SA 3.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      page: 'https://commons.wikimedia.org/wiki/File:A.jpg',
      source: 'wikimedia_commons',
    });
  });

  it('limite : pas de ligne jointe (aucune photo, ou droits pas en cours) → null', () => {
    expect(
      photoDe({
        ...ligne,
        photo_petite: null,
        photo_grande: null,
        photo_auteur: null,
        photo_licence: null,
        photo_licence_url: null,
        photo_page: null,
        photo_source: null,
      }),
    ).toBeNull();
  });
});

const photo = photoDe(ligne);
if (!photo) throw new Error('photo d’exemple illisible');

describe('texteCredit : « Photo : auteur · licence · source » (D101)', () => {
  it('Wikimedia Commons', () => {
    expect(texteCredit(photo)).toBe('Photo : Chau7 · CC BY-SA 3.0 · Wikimedia Commons');
  });
  it('DATAtourisme', () => {
    expect(
      texteCredit({
        ...photo,
        auteur: 'OT Beaune',
        licence: 'Licence Ouverte',
        source: 'datatourisme_photos',
        page: null,
        licenceUrl: null,
      }),
    ).toBe('Photo : OT Beaune · Licence Ouverte · DATAtourisme');
  });
});

describe('etatSuivant : l’icône d’abord, la photo si elle arrive à temps (D103)', () => {
  it('à l’écran → chargement ; chargée → affichée', () => {
    expect(etatSuivant('attente', 'visible')).toBe('chargement');
    expect(etatSuivant('chargement', 'chargee')).toBe('affichee');
    // Déjà en mémoire du navigateur : chargée avant même d'être signalée à l'écran.
    expect(etatSuivant('attente', 'chargee')).toBe('affichee');
  });

  it('limite : délai dépassé ou erreur pendant le chargement → abandon, l’icône reste', () => {
    expect(etatSuivant('chargement', 'delai')).toBe('abandon');
    expect(etatSuivant('chargement', 'erreur')).toBe('abandon');
    expect(etatSuivant('attente', 'erreur')).toBe('abandon');
  });

  it('limite : une photo qui arrive après l’abandon ne s’affiche pas (pas d’image qui surgit)', () => {
    expect(etatSuivant('abandon', 'chargee')).toBe('abandon');
  });

  it('limite : le délai n’efface jamais une photo déjà affichée', () => {
    const affichee: EtatPhoto = 'affichee';
    expect(etatSuivant(affichee, 'delai')).toBe('affichee');
    expect(etatSuivant(affichee, 'visible')).toBe('affichee');
  });
});
