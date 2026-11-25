// Lieux retirés de l'onglet Lieux (D057, D091, D093) : ils restent sur les autres écrans. Échantillon
// (données d'exemple, db/echantillon/echantillon.sql, section E11) : ECH_L44 aire de jeux sans nom
// propre, ECH_L45 aire nommée, ECH_L42 fiche de ville, ECH_L53 piscine masquée, ECH_L47 parc animalier.
// L'onglet Lieux lui-même (ce qu'il écarte) : lieux-rangees.integration.test.ts.
import { beforeAll, describe, expect, it } from 'vitest';

import { schemaReponseAutour } from '@/features/lieux/schemas';

import { appeler, type Route } from './outils-api';

let autour: Route;
let lieuxGare: Route;
let fiche: Route;
const cle = (identifiant: string) => `echantillon-${identifiant}`;

beforeAll(async () => {
  autour = await import('@/app/api/autour/route');
  lieuxGare = await import('@/app/api/destinations/[uic]/lieux/route');
  fiche = await import('@/app/api/lieux/[cle]/route');
});

describe('lieux retirés de l’onglet Lieux, gardés ailleurs', () => {
  it('« À deux pas de vous » : les aires de jeux, sans la fiche de ville ni la piscine masquée', async () => {
    const reponse = await appeler(autour, '/api/autour?lat=46.3&lon=6.9');
    const cles = schemaReponseAutour.parse(reponse.corps).lieux.map((l) => l.cle);
    expect(cles).toEqual(expect.arrayContaining([cle('ECH_L44'), cle('ECH_L45')]));
    expect(cles).not.toContain(cle('ECH_L42'));
    // Piscine masquée au même point : gardée en base, jamais montrée (D093).
    expect(cles).not.toContain(cle('ECH_L53'));
  });

  // Le point est ≈ 890 m au nord des lieux : 1 157 m à pied, dans le rayon de 2 km, au-delà des 1 000 m
  // des aires de jeux (D091). Le parc animalier, au même endroit qu'elles, sert de témoin.
  it('« Près de vous » : aires de jeux à 1 km au plus, les autres lieux suivent le rayon', async () => {
    const reponse = await appeler(autour, '/api/autour?lat=46.308&lon=6.9&rayon=2000');
    const cles = schemaReponseAutour.parse(reponse.corps).lieux.map((l) => l.cle);
    expect(cles).toContain(cle('ECH_L47'));
    expect(cles).not.toContain(cle('ECH_L44'));
    expect(cles).not.toContain(cle('ECH_L45'));
  });

  it('fiche destination : les aires de jeux restent', async () => {
    const reponse = await appeler(lieuxGare, '/api/destinations/EX000005/lieux', {
      uic: 'EX000005',
    });
    const cles = schemaReponseAutour.parse(reponse.corps).lieux.map((l) => l.cle);
    expect(cles).toEqual(expect.arrayContaining([cle('ECH_L44'), cle('ECH_L45')]));
  });

  it('une fiche de ville s’ouvre par son lien', async () => {
    const directe = await appeler(fiche, `/api/lieux/${cle('ECH_L42')}`, { cle: cle('ECH_L42') });
    expect(directe.statut).toBe(200);
  });
});
