import { describe, expect, it } from 'vitest';
import parametresBruts from '../../../config/parametres.json' with { type: 'json' };
import { schemaParametres } from './parametres';

// Copie profonde modifiable du vrai fichier, pour fabriquer les cas refusés.
function copie(): Record<string, unknown> & typeof parametresBruts {
  return structuredClone(parametresBruts);
}

describe('schéma de config/parametres.json', () => {
  it('accepte le fichier du dépôt', () => {
    expect(schemaParametres.safeParse(parametresBruts).success).toBe(true);
  });

  it('refuse un fichier avec une clé manquante', () => {
    const p: Partial<typeof parametresBruts> = copie();
    delete p.rayons;
    expect(schemaParametres.safeParse(p).success).toBe(false);
  });

  it('refuse une clé inconnue (faute de frappe)', () => {
    const p = copie();
    expect(schemaParametres.safeParse({ ...p, rayon: {} }).success).toBe(false);
  });

  it('accepte un facteur CO₂ à null (pas encore relevé)', () => {
    const p = copie();
    p.impact.facteursCo2GParKm.TER = null as unknown as number;
    expect(schemaParametres.safeParse(p).success).toBe(true);
  });

  it('accepte un prix à null tant que le prix est à calibrer', () => {
    const p = copie();
    expect(p.prix.aCalibrer).toBe(true);
    expect(schemaParametres.safeParse(p).success).toBe(true);
  });

  it('refuse un prix à null une fois le prix calibré', () => {
    const p = copie();
    p.prix.aCalibrer = false;
    p.prix.source = 'Barème TER' as unknown as null;
    p.prix.parKm = { TER: 0.1, INTERCITES: null, TGV: 0.15 } as unknown as typeof p.prix.parKm;
    expect(schemaParametres.safeParse(p).success).toBe(false);
  });

  it('accepte un prix calibré complet', () => {
    const p = copie();
    p.prix.aCalibrer = false;
    p.prix.source = 'Barème TER' as unknown as null;
    p.prix.parKm = { TER: 0.1, INTERCITES: 0.12, TGV: 0.15 } as unknown as typeof p.prix.parKm;
    expect(schemaParametres.safeParse(p).success).toBe(true);
  });

  it('dédoublonnage : palier large au-delà du proche accepté ; palier large plus court refusé', () => {
    const p = copie();
    p.dedoublonnage.distanceLargeM = p.dedoublonnage.distanceM + 1;
    expect(schemaParametres.safeParse(p).success).toBe(true);
    p.dedoublonnage.distanceLargeM = p.dedoublonnage.distanceM;
    expect(schemaParametres.safeParse(p).success).toBe(false);
  });

  it('regroupementSites : sous-catégories distinctes acceptées ; en double refusées', () => {
    const p = copie();
    const [premier] = p.regroupementSites;
    expect(premier).toBeDefined();
    p.regroupementSites = [...p.regroupementSites, { ...premier!, distanceM: 10 }];
    expect(schemaParametres.safeParse(p).success).toBe(false);
  });
});
