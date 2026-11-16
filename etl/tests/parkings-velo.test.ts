// Parkings vélo de l'extraction OSM (D097) : requête et lecture des éléments. Fonctions pures.
import { describe, expect, it } from 'vitest';
import {
  lireParkingVelo,
  NOM_PARKING_VELO,
  requeteParkingsVelo,
  type ElementOsm,
} from '../src/transformations/osm';

const element = (e: Partial<ElementOsm>): ElementOsm => ({ type: 'node', id: 1, tags: {}, ...e });

describe('parkings vélo OSM (D097)', () => {
  it('requeteParkingsVelo : la région par code INSEE, sans nom exigé, centre des surfaces', () => {
    const requete = requeteParkingsVelo('27', 180);
    expect(requete).toContain('[timeout:180]');
    expect(requete).toContain('["ref:INSEE"="27"]');
    expect(requete).toContain('nwr["amenity"="bicycle_parking"](area.region);');
    expect(requete).not.toContain('["name"]');
    expect(requete).toContain('out center tags;');
  });

  it('lireParkingVelo : un point avec son nom ; sans nom, « Parking vélo »', () => {
    const tags = { amenity: 'bicycle_parking' };
    expect(
      lireParkingVelo(element({ id: 7, lat: 47.3, lon: 5.0, tags: { ...tags, name: ' Gare ' } })),
    ).toEqual({ idSource: 'node/7', nom: 'Gare', lat: 47.3, lon: 5.0 });
    expect(lireParkingVelo(element({ lat: 47.3, lon: 5.0, tags }))?.nom).toBe(NOM_PARKING_VELO);
  });

  it('lireParkingVelo : une surface prend son centre ; sans position, rien', () => {
    const tags = { amenity: 'bicycle_parking' };
    expect(
      lireParkingVelo(element({ type: 'way', id: 9, center: { lat: 47.1, lon: 4.9 }, tags })),
    ).toMatchObject({ idSource: 'way/9', lat: 47.1, lon: 4.9 });
    expect(lireParkingVelo(element({ type: 'way', tags }))).toBeNull();
  });

  it('lireParkingVelo : un autre élément n’est pas un parking vélo', () => {
    expect(
      lireParkingVelo(element({ lat: 47.3, lon: 5.0, tags: { amenity: 'parking' } })),
    ).toBeNull();
  });
});
