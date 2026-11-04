// Comparaison des modes de transport : calcul pur, le plus sobre d'abord.
import type { ReponseImpact } from './schemas';

export type ModeImpact = 'train' | 'voiturePartagee' | 'voitureSeule' | 'avion';
export type LigneImpact = { mode: ModeImpact; kg: number; largeurPct: number; plusSobre: boolean };

export function lignesImpact(co2: ReponseImpact['co2Kg']): LigneImpact[] {
  const lignes = (Object.keys(co2) as (keyof typeof co2)[])
    .map((cle) => {
      const kg = co2[cle];
      return kg === null ? null : { mode: cle, kg };
    })
    .filter((ligne) => ligne !== null)
    .sort((a, b) => a.kg - b.kg);
  const max = Math.max(...lignes.map((l) => l.kg));
  return lignes.map((ligne, index) => ({
    ...ligne,
    largeurPct: max > 0 ? (ligne.kg / max) * 100 : 0,
    plusSobre: index === 0,
  }));
}
