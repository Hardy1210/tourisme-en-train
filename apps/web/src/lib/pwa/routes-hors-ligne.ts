// Ce que le service worker a le droit de garder (D071) : une liste explicite, pure et testée.
// Tout le reste passe par le réseau seulement : une adresse avec une position n'est jamais écrite (règle 5).

const ROUTES_API_GARDEES = [
  /^\/api\/destinations$/,
  /^\/api\/destinations\/[^/]+$/,
  /^\/api\/destinations\/[^/]+\/lieux$/,
  /^\/api\/lieux$/,
  /^\/api\/lieux\/[^/]+$/,
  /^\/api\/trains$/,
  /^\/api\/mobilites\/[^/]+$/,
  /^\/api\/impact$/,
  /^\/api\/sources$/,
];

const contientUnePosition = (url: URL): boolean =>
  url.searchParams.has('lat') || url.searchParams.has('lon');

/** Une réponse de l'API qui peut être relue hors ligne. */
export function apiGardeeHorsLigne(url: URL): boolean {
  return !contientUnePosition(url) && ROUTES_API_GARDEES.some((r) => r.test(url.pathname));
}

/** Une page de l'application, pour la rouvrir hors ligne. */
export function pageGardeeHorsLigne(url: URL): boolean {
  return (
    !contientUnePosition(url) &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.startsWith('/serwist/') &&
    !url.pathname.startsWith('/_next/')
  );
}
