import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GareProche } from '@/features/gares/schemas';
import {
  CLE_ACCUEIL_VU,
  ecrireAccueilVu,
  etapeAccueil,
  etatAccueilInitial,
  lireAccueilVu,
  photoAuHasard,
  presentationGare,
} from './accueil';
import type { Depart } from './depart';

describe('etapeAccueil', () => {
  const base = { gareDansUrl: false, depart: 'chargement' } as const;
  it('premier lancement, sans gare dans le lien : la bienvenue', () => {
    expect(etapeAccueil({ ...base, etat: etatAccueilInitial(false) })).toBe('bienvenue');
  });
  it('accueil déjà vu : Explorer directement', () => {
    expect(etapeAccueil({ ...base, etat: etatAccueilInitial(true) })).toBeNull();
  });
  it('lien partagé avec une gare, même au premier lancement : Explorer directement', () => {
    expect(etapeAccueil({ ...base, etat: 'bienvenue', gareDansUrl: true })).toBeNull();
  });
  it('départ choisi, gare pas encore trouvée : la recherche, sans fenêtre modale', () => {
    expect(etapeAccueil({ ...base, etat: 'gare' })).toBe('recherche');
  });
  it('départ choisi, gare trouvée : l’écran de la gare', () => {
    expect(etapeAccueil({ ...base, etat: 'gare', depart: 'pret' })).toBe('gare');
  });
  it('départ choisi, gare dans l’URL : reste sur l’écran de la gare', () => {
    expect(etapeAccueil({ etat: 'gare', gareDansUrl: true, depart: 'pret' })).toBe('gare');
  });
  it.each(['sans_position', 'hors_region', 'erreur'] as const)(
    '%s : les écrans d’Explorer prennent le relais',
    (depart) => {
      expect(etapeAccueil({ ...base, etat: 'gare', depart })).toBeNull();
    },
  );
});

describe('presentationGare', () => {
  const gare = (uic: string, dansRegion = true) =>
    ({ uic, nom: uic, dansRegion }) as unknown as GareProche;
  const pret = (origine: 'position' | 'choix', uic: string, proches: GareProche[]) =>
    ({
      etat: 'pret',
      origine,
      gare: { uic },
      point: { lat: 0, lon: 0 },
      proches,
    }) as unknown as Extract<Depart, { etat: 'pret' }>;

  it('la gare la plus proche : « la plus proche »', () => {
    expect(presentationGare(pret('position', 'A', [gare('A'), gare('B')]))).toBe('plus_proche');
  });
  it('une gare mieux desservie un peu plus loin (D064) : jamais « la plus proche »', () => {
    expect(presentationGare(pret('position', 'B', [gare('A'), gare('B')]))).toBe('mieux_desservie');
  });
  it('une gare choisie : ni l’un ni l’autre', () => {
    expect(presentationGare(pret('choix', 'A', [gare('A')]))).toBe('choisie');
  });
});

describe('repère « accueil vu »', () => {
  let valeurs: Map<string, string>;
  beforeEach(() => {
    valeurs = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (cle: string) => valeurs.get(cle) ?? null,
      setItem: (cle: string, valeur: string) => valeurs.set(cle, valeur),
    });
  });

  it('se relit', () => {
    expect(lireAccueilVu()).toBe(false);
    ecrireAccueilVu();
    expect(lireAccueilVu()).toBe(true);
  });
  it('ne garde qu’un oui, jamais de position (règle 5)', () => {
    ecrireAccueilVu();
    expect([...valeurs.entries()]).toEqual([[CLE_ACCUEIL_VU, '1']]);
  });
  it('une autre valeur ne vaut pas « vu »', () => {
    valeurs.set(CLE_ACCUEIL_VU, 'oui');
    expect(lireAccueilVu()).toBe(false);
  });
  it('stockage refusé (navigation privée) : pas vu, sans erreur', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('refusé');
      },
      setItem: () => {
        throw new Error('refusé');
      },
    });
    expect(() => ecrireAccueilVu()).not.toThrow();
    expect(lireAccueilVu()).toBe(false);
  });
});

describe('photoAuHasard', () => {
  const liste = ['a', 'b', 'c'] as const;
  it('prend la photo qui correspond au tirage', () => {
    expect(photoAuHasard(liste, 0)).toBe('a');
    expect(photoAuHasard(liste, 0.5)).toBe('b');
  });
  it('ne dépasse jamais la liste, même au tirage le plus haut', () => {
    expect(photoAuHasard(liste, 0.9999)).toBe('c');
  });
});
