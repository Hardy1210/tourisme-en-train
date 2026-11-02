import { describe, expect, it } from 'vitest';
import { licenceReconnue } from '../src/sources/transport-local';
import {
  arretsDesservis,
  nettoyerNomArret,
  stationsGbfs,
  typeDeLigne,
  type ArretGtfs,
  type LigneGtfs,
} from '../src/transformations/transport-local';

const arret = (id: string, nom: string, location_type = ''): ArretGtfs => ({
  stop_id: id,
  stop_name: nom,
  stop_lat: '47.32',
  stop_lon: '5.03',
  location_type,
});
const ligne = (id: string, nom: string, type: string): LigneGtfs => ({
  route_id: id,
  route_short_name: nom,
  route_type: type,
});

describe('transports sur place (04 § 4.7, D046)', () => {
  it('typeDeLigne : tram (0) et bus (3) gardés ; transport à la demande (715) exclu', () => {
    expect(typeDeLigne('0')).toBe('TRAM');
    expect(typeDeLigne('3')).toBe('BUS');
    expect(typeDeLigne('715')).toBeNull();
  });

  it('arrêt desservi par le tram → TRAM ; par des bus seulement → type du réseau (CAR pour Mobigo)', () => {
    const lignes = [ligne('T1', 'T1', '0'), ligne('L10', '10', '3'), ligne('L2', '2', '3')];
    const parArret = new Map([
      ['A', new Set(['T1', 'L10'])],
      ['B', new Set(['L10', 'L2'])],
    ]);
    const resultat = arretsDesservis(
      [arret('A', 'Gare'), arret('B', 'Darcy')],
      lignes,
      parArret,
      'CAR',
    );
    expect(resultat.map((a) => [a.idSource, a.type, a.lignes])).toEqual([
      ['A', 'TRAM', ['10', 'T1']],
      ['B', 'CAR', ['2', '10']],
    ]);
  });

  it('arrêt sans ligne, ou desservi seulement à la demande : écarté ; station parente : écartée', () => {
    const lignes = [ligne('TAD', 'TAD1', '715'), ligne('L1', '1', '3')];
    const parArret = new Map([
      ['A', new Set(['TAD'])],
      ['P', new Set(['L1'])],
    ]);
    const resultat = arretsDesservis(
      [arret('A', 'Hameau'), arret('B', 'Sans service'), arret('P', 'Pôle', '1')],
      lignes,
      parArret,
      'BUS',
    );
    expect(resultat).toEqual([]);
  });

  it('nom d’arrêt : « Gare SNCF - » → « Gare SNCF » ; « Saint-Jean - Centre » inchangé', () => {
    expect(nettoyerNomArret('Gare SNCF -')).toBe('Gare SNCF');
    expect(nettoyerNomArret('Saint-Jean - Centre')).toBe('Saint-Jean - Centre');
  });

  it('stations GBFS : nom texte (v2) ou traduit (v3), identifiant numérique converti en texte', () => {
    const json = {
      data: {
        stations: [
          { station_id: 12, name: 'GARE VIOTTE', lat: 47.24, lon: 6.02 },
          { station_id: 'b', name: [{ text: 'Bohn', language: 'fr' }], lat: 47.6, lon: 6.8 },
        ],
      },
    };
    expect(stationsGbfs(json).map((s) => [s.idSource, s.nom, s.type])).toEqual([
      ['12', 'GARE VIOTTE', 'VELO'],
      ['b', 'Bohn', 'VELO'],
    ]);
  });

  it('licence : Licence Ouverte 2.0 et ODbL reconnues ; « Selon le réseau » non', () => {
    expect(licenceReconnue('Licence Ouverte 2.0')).toBe(true);
    expect(licenceReconnue('ODbL')).toBe(true);
    expect(licenceReconnue('Selon le réseau (souvent ODbL)')).toBe(false);
  });
});
