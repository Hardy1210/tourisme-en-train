// Exécuté une fois au démarrage du serveur Next.js : valide les variables d'environnement
// pour que l'application refuse de démarrer si l'une manque (fiche E00).
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env');
  }
}
