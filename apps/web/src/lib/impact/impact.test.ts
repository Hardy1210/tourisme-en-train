import { describe, expect, it } from 'vitest';

import { parametres } from '@/config/parametres';

import { impactLiaison, prixEstime } from './impact';

// Valeurs du dépôt : TER 27,7 g/km, Intercités 8,98, TGV 2,93, voiture 142, avion 225 (≥ 300 km),
// 3 occupants ; prix TER et Intercités 0,22 €/km, TGV 0,17 €/km, marge ± 25 % (D048).
describe('impactLiaison', () => {
  it('Dijon → Beaune en TER (43,2 km) : CO₂ aller-retour et économie face à la voiture seule', () => {
    const impact = impactLiaison(43.2, ['TER']);
    expect(impact.co2Kg.train).toBe(2.4); // 2 × 43,2 × 27,7 / 1000 = 2,39
    expect(impact.co2Kg.voitureSeule).toBe(12.3); // 2 × 43,2 × 142 / 1000 = 12,27
    expect(impact.co2Kg.voiturePartagee).toBe(4.1);
    expect(impact.co2EconomiseKg).toBe(9.9);
  });

  it('TER et TGV sur la même liaison : facteur le moins favorable (TER)', () => {
    expect(impactLiaison(100, ['TGV', 'TER']).co2Kg.train).toBe(5.5);
    expect(impactLiaison(100, ['TGV']).co2Kg.train).toBe(0.6);
  });

  it('type AUTRE seul : CO₂ du train inconnu ; avec un type connu : ignoré', () => {
    expect(impactLiaison(100, ['AUTRE']).co2Kg.train).toBeNull();
    expect(impactLiaison(100, ['AUTRE']).co2EconomiseKg).toBeNull();
    expect(impactLiaison(100, ['AUTRE', 'TGV']).co2Kg.train).toBe(0.6);
  });

  it('facteur non relevé (null) : CO₂ du train inconnu, par prudence', () => {
    const p = structuredClone(parametres);
    p.impact.facteursCo2GParKm.INTERCITES = null;
    expect(impactLiaison(100, ['TER', 'INTERCITES'], p).co2Kg.train).toBeNull();
  });

  it('avion : à partir de 300 km, pas en dessous', () => {
    expect(impactLiaison(300, ['TGV']).co2Kg.avion).toBe(135);
    expect(impactLiaison(299.9, ['TGV']).co2Kg.avion).toBeNull();
  });
});

describe('prixEstime', () => {
  it('Dijon → Beaune en TER (43,2 km) : ≈ 7–12 €', () => {
    expect(prixEstime(43.2, ['TER'])).toEqual({ min: 7, max: 12, devise: 'EUR' });
  });

  it('TER et TGV : le type le plus cher (TER) ; TGV seul : moins cher', () => {
    expect(prixEstime(300, ['TGV', 'TER'])).toEqual({ min: 50, max: 83, devise: 'EUR' });
    expect(prixEstime(300, ['TGV'])).toEqual({ min: 38, max: 64, devise: 'EUR' });
  });

  it('jamais moins de 1 € ; type AUTRE seul : pas de prix', () => {
    expect(prixEstime(1, ['TER'])).toEqual({ min: 1, max: 1, devise: 'EUR' });
    expect(prixEstime(100, ['AUTRE'])).toBeNull();
  });

  it('prix à calibrer : jamais affiché', () => {
    const p = structuredClone(parametres);
    p.prix.aCalibrer = true;
    expect(prixEstime(100, ['TER'], p)).toBeNull();
  });
});
