// Outils des parcours : aucun appel hors de l'application, fond de carte simulé.
import type { BrowserContext } from '@playwright/test';
import { sources } from '@tourisme/commun';

const ADRESSE_FOND_CARTE = sources.sources.find((s) => s.code === 'fond_carte')?.api;
const STYLE_VIDE = { version: 8, sources: {}, layers: [] };

export async function couperLeReseau(context: BrowserContext, baseURL: string | undefined) {
  await context.route('**/*', (requete) => {
    const url = requete.request().url();
    if (baseURL && url.startsWith(baseURL)) return requete.fallback();
    if (url === ADRESSE_FOND_CARTE) return requete.fulfill({ json: STYLE_VIDE });
    return requete.abort();
  });
}
