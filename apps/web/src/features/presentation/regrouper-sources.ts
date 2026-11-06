import { GROUPES_SOURCE, type GroupeSource } from '@tourisme/commun';

/** Les sources par thème, dans l'ordre de `GROUPES_SOURCE` ; un thème sans source n'apparaît pas. */
export function regrouperSources<S extends { groupe: GroupeSource }>(
  sources: readonly S[],
): { groupe: GroupeSource; sources: S[] }[] {
  return GROUPES_SOURCE.map((groupe) => ({
    groupe,
    sources: sources.filter((source) => source.groupe === groupe),
  })).filter(({ sources: liste }) => liste.length > 0);
}
