/// <reference lib="webworker" />
// Service worker (D071) : réseau d'abord, copie seulement si le réseau manque. Aucune adresse avec une
// position n'est gardée (règle 5) ; un train parti reste masqué par l'écran, même hors ligne (D068).
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { ExpirationPlugin, NetworkFirst, Serwist } from 'serwist';
import { parametres } from '@tourisme/commun';
import { apiGardeeHorsLigne, pageGardeeHorsLigne } from '../lib/pwa/routes-hors-ligne';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const { horsLigneS, horsLigneEntrees, reseauMaxS } = parametres.cache;
const expiration = () =>
  new ExpirationPlugin({ maxEntries: horsLigneEntrees, maxAgeSeconds: horsLigneS });

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Une nouvelle version prend la main sans rien bloquer.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Une page jamais ouverte, sans réseau : cette page, et jamais le cul-de-sac d'erreur du navigateur.
  fallbacks: {
    entries: [{ url: '/hors-ligne', matcher: ({ request }) => request.destination === 'document' }],
  },
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && apiGardeeHorsLigne(url),
      handler: new NetworkFirst({
        cacheName: 'api-hors-ligne',
        networkTimeoutSeconds: reseauMaxS,
        plugins: [expiration()],
      }),
    },
    {
      matcher: ({ url, request, sameOrigin }) =>
        sameOrigin && request.method === 'GET' && pageGardeeHorsLigne(url),
      handler: new NetworkFirst({
        cacheName: 'pages-hors-ligne',
        networkTimeoutSeconds: reseauMaxS,
        plugins: [expiration()],
      }),
    },
  ],
});

serwist.addEventListeners();
