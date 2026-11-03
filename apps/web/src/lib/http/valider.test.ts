import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ParametreInvalide } from './erreurs';
import { lireParametres, schemaCategories, schemaDate, schemaLat, schemaLon } from './valider';

const requete = (parametres: string) => new Request(`http://localhost/api/test?${parametres}`);
const schemaPosition = z.object({ lat: schemaLat, lon: schemaLon });

function messageDe(fonction: () => unknown): string {
  try {
    fonction();
  } catch (erreur) {
    if (erreur instanceof ParametreInvalide) return erreur.message;
    throw erreur;
  }
  throw new Error('aucune erreur levée');
}

describe('lireParametres', () => {
  it('position à Dijon acceptée (place Darcy)', () => {
    expect(lireParametres(requete('lat=47.3226&lon=5.0353'), schemaPosition)).toEqual({
      lat: 47.3226,
      lon: 5.0353,
    });
  });

  it('position hors France (Genève, Londres) refusée avec un message clair', () => {
    expect(messageDe(() => lireParametres(requete('lat=46.2&lon=10.5'), schemaPosition))).toBe(
      'La position doit se trouver en France métropolitaine.',
    );
    expect(messageDe(() => lireParametres(requete('lat=51.6&lon=0'), schemaPosition))).toBe(
      'La position doit se trouver en France métropolitaine.',
    );
  });

  it('bornes de la France acceptées : lat 41 et 51,5, lon −5,5 et 10', () => {
    expect(() => lireParametres(requete('lat=41&lon=-5.5'), schemaPosition)).not.toThrow();
    expect(() => lireParametres(requete('lat=51.5&lon=10'), schemaPosition)).not.toThrow();
  });

  it('paramètre absent → « obligatoire » ; texte → « nombre »', () => {
    expect(messageDe(() => lireParametres(requete('lat=47'), schemaPosition))).toBe(
      'Le paramètre « lon » est obligatoire.',
    );
    expect(messageDe(() => lireParametres(requete('lat=abc&lon=5'), schemaPosition))).toBe(
      'La latitude doit être un nombre.',
    );
  });
});

describe('schemaCategories', () => {
  it('absent → null (toutes) ; liste → catégories sans doublon', () => {
    expect(schemaCategories.parse(undefined)).toBeNull();
    expect(schemaCategories.parse('enfants,parcs,enfants')).toEqual(['enfants', 'parcs']);
  });

  it('catégorie inconnue refusée', () => {
    expect(schemaCategories.safeParse('enfants,plage').success).toBe(false);
  });
});

describe('schemaDate', () => {
  it('AAAA-MM-JJ accepté ; autre format refusé', () => {
    expect(schemaDate.parse('2026-11-03')).toBe('2026-11-03');
    expect(schemaDate.safeParse('03/11/2026').success).toBe(false);
  });
});
