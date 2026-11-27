import { describe, expect, it } from 'vitest';
import {
  billetDestination,
  formaterNombreLieux,
  totalLieux,
  couleurTranche,
  traitTranche,
  destinationsMontrees,
  dureeElargie,
  formaterDuree,
  formaterKg,
  formaterPrix,
  prochainTrainDirect,
  sansTrainsPartis,
} from './presentation';
import type { Destination } from './schemas';

const heure = (s: number, texte: string) => ({ s, texte, lendemain: false });
const destination = (titre: string, prochain: ReturnType<typeof heure> | null) =>
  ({ titre, prochainDepart: prochain }) as Destination;

describe('formaterDuree', () => {
  it('reste en minutes sous une heure', () => {
    expect(formaterDuree(59)).toBe('59 min');
  });

  it('passe en heures, avec des minutes sur deux chiffres', () => {
    expect(formaterDuree(60)).toBe('1 h');
    expect(formaterDuree(94)).toBe('1 h 34');
    expect(formaterDuree(125)).toBe('2 h 05');
  });
});

describe('couleurTranche', () => {
  const BORNES = [30, 60, 90];

  it('donne une couleur par tranche', () => {
    expect(couleurTranche('<=30', BORNES)).toBe('bg-map-time-1');
    expect(couleurTranche('<=90', BORNES)).toBe('bg-map-time-3');
  });

  it('la dernière tranche a la dernière couleur (Paris, 94 min)', () => {
    expect(couleurTranche('>90', BORNES)).toBe('bg-map-time-4');
  });
});

describe('prochainTrainDirect', () => {
  it('choisit le départ le plus tôt', () => {
    const liste = [
      destination('Dole', heure(40_000, '11:06')),
      destination('Beaune', heure(36_720, '10:12')),
    ];
    expect(prochainTrainDirect(liste)).toEqual({ heure: '10:12', vers: 'Beaune' });
  });

  it('ignore les destinations sans train restant, et renvoie null si aucune n’en a', () => {
    expect(
      prochainTrainDirect([
        destination('Dole', null),
        destination('Beaune', heure(36_720, '10:12')),
      ]),
    ).toEqual({ heure: '10:12', vers: 'Beaune' });
    expect(prochainTrainDirect([destination('Dole', null)])).toBeNull();
    expect(prochainTrainDirect([])).toBeNull();
  });
});

describe('formats', () => {
  it('affiche toujours le prix comme une estimation', () => {
    expect(formaterPrix({ min: 12, max: 18 })).toBe('≈ 12 à 18 €');
    expect(formaterPrix({ min: 12, max: 12 })).toBe('≈ 12 €');
  });

  it('écrit le CO₂ à la française', () => {
    expect(formaterKg(3.24)).toBe('3,2');
  });
});

describe('dureeElargie', () => {
  it('propose la durée suivante, quel que soit l’ordre des options', () => {
    expect(dureeElargie(30, [120, 30, 180, 60])).toBe(60);
  });

  it('ne propose rien depuis la plus grande', () => {
    expect(dureeElargie(180, [30, 60, 120, 180])).toBeNull();
  });
});

describe('sansTrainsPartis', () => {
  const JOUR = '2026-11-18';
  const a = (heureActuelleS: number) => ({ dateDuJour: JOUR, heureActuelleS });
  const dix = destination('Beaune', heure(36_000, '10:00'));

  it('garde un train à l’heure exacte de son départ', () => {
    expect(sansTrainsPartis([dix], JOUR, a(36_000))[0]?.prochainDepart?.texte).toBe('10:00');
  });
  it('retire un train parti, sans annoncer qu’il n’y en a plus', () => {
    const [carte] = sansTrainsPartis([dix], JOUR, a(36_001));
    expect(carte?.prochainDepart).toBeNull();
    expect(carte?.prochaineArrivee).toBeNull();
    expect(carte?.prochainPerime).toBe(true);
  });
  it('ne marque pas une destination qui n’a réellement plus de train', () => {
    const [carte] = sansTrainsPartis([destination('Dole', null)], JOUR, a(36_001));
    expect(carte?.prochainPerime).toBeUndefined();
  });
  it('« Votre gare » annonce le train suivant encore à venir', () => {
    const liste = [dix, destination('Dole', heure(36_600, '10:10'))];
    expect(prochainTrainDirect(sansTrainsPartis(liste, JOUR, a(36_001)))).toEqual({
      heure: '10:10',
      vers: 'Dole',
    });
  });
  it('« Votre gare » n’annonce rien quand tous sont partis', () => {
    expect(prochainTrainDirect(sansTrainsPartis([dix], JOUR, a(36_001)))).toBeNull();
  });
});

describe('totalLieux', () => {
  it('additionne les catégories renvoyées', () => {
    expect(totalLieux({ enfants: 5, parcs: 7 })).toBe(12);
  });
  it('vaut 0 sans lieu (pas de bulle)', () => {
    expect(totalLieux({})).toBe(0);
  });
  it('accorde le mot', () => {
    expect(formaterNombreLieux(1)).toBe('1 lieu');
    expect(formaterNombreLieux(2)).toBe('2 lieux');
  });
});

describe('traitTranche (icône de train inversée, D118)', () => {
  const BORNES = [30, 60, 90];
  it('même tranche que le point : contour et train de la même couleur', () => {
    expect(traitTranche('<=30', BORNES)).toBe('border-map-time-1 text-map-time-1');
    expect(traitTranche('<=90', BORNES)).toBe('border-map-time-3 text-map-time-3');
  });
  it('au-delà de la dernière borne : la dernière couleur, comme le point', () => {
    expect(traitTranche('>90', BORNES)).toBe('border-map-time-4 text-map-time-4');
  });
});

describe('destinationsMontrees (« Voir plus » de la feuille, D122)', () => {
  const liste = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

  it('25 destinations : les 10 premières dans l’ordre reçu, 15 restent ; puis 20, puis toutes', () => {
    expect(destinationsMontrees(liste(25), 1, 10)).toEqual({ montrees: liste(10), reste: 15 });
    expect(destinationsMontrees(liste(25), 2, 10)).toEqual({ montrees: liste(20), reste: 5 });
    expect(destinationsMontrees(liste(25), 3, 10)).toEqual({ montrees: liste(25), reste: 0 });
  });

  it('limite : 10 destinations tiennent dans la première page, rien ne reste ; 11 en laissent une', () => {
    expect(destinationsMontrees(liste(10), 1, 10)).toEqual({ montrees: liste(10), reste: 0 });
    expect(destinationsMontrees(liste(11), 1, 10)).toEqual({ montrees: liste(10), reste: 1 });
  });

  it('liste vide : rien à montrer, rien ne reste', () => {
    expect(destinationsMontrees([], 1, 10)).toEqual({ montrees: [], reste: 0 });
  });
});

describe('billetDestination', () => {
  const avec = (
    depart: ReturnType<typeof heure> | null,
    arrivee: ReturnType<typeof heure> | null,
  ) => ({ prochainDepart: depart, prochaineArrivee: arrivee }) as Destination;

  it('donne les deux heures et la durée de ce train-là', () => {
    expect(billetDestination(avec(heure(36720, '10:12'), heure(37380, '10:23')), true)).toEqual({
      etat: 'train',
      depart: '10:12',
      arrivee: '10:23',
      dureeMin: 11,
    });
  });

  it('compte juste un train qui arrive après minuit (25:10)', () => {
    const billet = billetDestination(avec(heure(85800, '23:50'), heure(90600, '01:10')), true);
    expect(billet).toMatchObject({ etat: 'train', dureeMin: 80 });
  });

  it('sans train : « aujourd’hui » le jour même, « ce jour » une autre date', () => {
    expect(billetDestination(avec(null, null), true)).toEqual({
      etat: 'aucun',
      texte: "Plus de train direct aujourd'hui",
    });
    expect(billetDestination(avec(null, null), false)).toEqual({
      etat: 'aucun',
      texte: 'Plus de train direct ce jour',
    });
  });

  it('train annoncé déjà parti : mise à jour, jamais « plus de train »', () => {
    const d = { ...avec(null, null), prochainPerime: true };
    expect(billetDestination(d, true)).toEqual({ etat: 'miseAJour' });
  });
});
