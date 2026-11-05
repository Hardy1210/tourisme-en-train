import { describe, expect, it } from 'vitest';
import type { GareProche } from '@/features/gares/schemas';
import { calculerDepart, type EntreesDepart } from './depart';

const VIDE = { donnees: undefined, statutErreur: null };
const gareProche = (dansRegion: boolean): GareProche => ({
  uic: '87713040',
  nom: 'Dijon',
  commune: 'Dijon',
  lat: 47.32,
  lon: 5.03,
  distanceM: 900,
  dureeVeloMin: 5,
  dureeVoitureMin: 3,
  dansRegion,
});
const entrees = (partiel: Partial<EntreesDepart>): EntreesDepart => ({
  uicChoisi: null,
  gareChoisie: VIDE,
  position: { etat: 'attente' },
  proches: VIDE,
  ...partiel,
});
const TROUVEE = { etat: 'trouvee', lat: 47.3, lon: 5 } as const;
const gareChoisie = (dansRegion: boolean) => ({
  ...VIDE,
  donnees: { uic: 'A', nom: 'Beaune', lat: 47, lon: 4.8, dansRegion, commune: { nom: 'Beaune' } },
});

describe('calculerDepart, depuis la position', () => {
  it('attend la réponse du navigateur, puis celle des gares', () => {
    expect(calculerDepart(entrees({}))).toEqual({ etat: 'chargement' });
    expect(calculerDepart(entrees({ position: TROUVEE }))).toEqual({ etat: 'chargement' });
  });

  it('part de la gare la plus proche, avec sa distance', () => {
    const depart = calculerDepart(
      entrees({ position: TROUVEE, proches: { ...VIDE, donnees: [gareProche(true)] } }),
    );
    expect(depart).toMatchObject({
      etat: 'pret',
      origine: 'position',
      gare: { uic: '87713040', distanceM: 900 },
      point: { lat: 47.3, lon: 5 },
    });
  });

  it('annonce le hors région si la gare la plus proche n’est pas dans la région', () => {
    const depart = calculerDepart(
      entrees({ position: TROUVEE, proches: { ...VIDE, donnees: [gareProche(false)] } }),
    );
    expect(depart).toEqual({ etat: 'hors_region' });
  });

  it.each(['refusee', 'indisponible'] as const)('position %s → recherche de ville', (etat) => {
    expect(calculerDepart(entrees({ position: { etat } }))).toEqual({
      etat: 'sans_position',
      raison: etat,
    });
  });

  it('signale une panne de l’API, et aucune gare trouvée', () => {
    expect(
      calculerDepart(entrees({ position: TROUVEE, proches: { ...VIDE, statutErreur: 500 } })),
    ).toEqual({ etat: 'erreur' });
    expect(
      calculerDepart(entrees({ position: TROUVEE, proches: { ...VIDE, donnees: [] } })),
    ).toEqual({ etat: 'erreur' });
  });
});

describe('calculerDepart, depuis une gare choisie', () => {
  it('part de cette gare sans demander la position, sans distance', () => {
    const depart = calculerDepart(entrees({ uicChoisi: 'A', gareChoisie: gareChoisie(true) }));
    expect(depart).toMatchObject({
      etat: 'pret',
      origine: 'choix',
      gare: { nom: 'Beaune', distanceM: null },
      point: { lat: 47, lon: 4.8 },
    });
  });

  it('annonce le hors région pour une gare hors de la région', () => {
    expect(calculerDepart(entrees({ uicChoisi: 'A', gareChoisie: gareChoisie(false) }))).toEqual({
      etat: 'hors_region',
    });
  });

  it('distingue un lien vers une gare inconnue d’une panne', () => {
    const avec = (statutErreur: number) =>
      calculerDepart(entrees({ uicChoisi: 'A', gareChoisie: { ...VIDE, statutErreur } }));
    expect(avec(404)).toEqual({ etat: 'sans_position', raison: 'gare_inconnue' });
    expect(avec(400)).toEqual({ etat: 'sans_position', raison: 'gare_inconnue' });
    expect(avec(500)).toEqual({ etat: 'erreur' });
  });
});

describe('gare conseillée (D064)', () => {
  const avecUic = (uic: string) => ({ ...gareProche(true), uic });
  const donnees = [avecUic('proche'), avecUic('grande')];

  it('part de la gare conseillée, pas de la plus proche', () => {
    const depart = calculerDepart(
      entrees({ position: TROUVEE, proches: { ...VIDE, donnees }, uicConseille: 'grande' }),
    );
    expect(depart).toMatchObject({ etat: 'pret', gare: { uic: 'grande' } });
  });
  it('sans conseil, part de la plus proche', () => {
    const depart = calculerDepart(
      entrees({ position: TROUVEE, proches: { ...VIDE, donnees }, uicConseille: null }),
    );
    expect(depart).toMatchObject({ etat: 'pret', gare: { uic: 'proche' } });
  });
});
