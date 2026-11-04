// Écran « Sources » (docs/05-api.md § 3.12, règle 8, D051) : chaque source utilisée, sa licence,
// l'attribution qu'elle impose et la date de ses données.
import 'server-only';
import { dateDuJour, sources, type SourceDonnees } from '@tourisme/commun';

import { parametres } from '@/config/parametres';
import { fenetreLiaisons } from '@/lib/db/requetes-partagees';

import type { ReponseSources } from '../schemas';

import { datesDesDonnees } from './requetes';

/** Valeurs recopiées dans parametres.json : leur date est celle du relevé (D048). */
const DATES_LOCALES: Record<string, string | null> = {
  facteurs_co2: parametres.impact.dateReleve,
  tarifs_tgv: parametres.prix.dateCalibrage,
};

export async function sourcesAffichees(): Promise<ReponseSources> {
  const [dates, horaires] = await Promise.all([datesDesDonnees(), fenetreLiaisons()]);
  const dateDe = (s: SourceDonnees): string | null => {
    const telechargement = dates.telechargements[s.code];
    if (telechargement) return dateDuJour(telechargement);
    if (s.reseau && dates.transport_local) return dateDuJour(dates.transport_local);
    return DATES_LOCALES[s.code] ?? null;
  };
  return {
    horaires,
    sources: sources.sources
      .filter((s) => s.affichee)
      .map((s) => ({
        code: s.code,
        nom: s.nom,
        producteur: s.producteur,
        page: s.page,
        licence: s.licence,
        attribution: s.attribution,
        dateDonnees: dateDe(s),
      })),
  };
}
