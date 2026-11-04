// Adaptateur du fond de carte (OpenFreeMap) : adresse et attribution dans config/sources.json (règle 3).
import { sources } from '@tourisme/commun';

const source = sources.sources.find((s) => s.code === 'fond_carte');
if (!source?.api) throw new Error('Source fond_carte sans adresse (config/sources.json).');
const adresse = source.api;

export const attributionFondCarte = source.attribution;

/** Le style du fond de carte, en JSON ; une erreur si le service ne répond pas. */
export async function chargerStyleCarte(signal?: AbortSignal): Promise<unknown> {
  const reponse = await fetch(adresse, { signal });
  if (!reponse.ok) throw new Error('Fond de carte indisponible.');
  return reponse.json();
}
