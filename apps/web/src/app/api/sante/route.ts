import { etatSante } from '@/features/sante/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';

// Toujours calculée à la demande : jamais de page statique ni de cache (supervision).
export const dynamic = 'force-dynamic';

export const GET = gererRoute('sante', async () => {
  const sante = await etatSante();
  return repondre(sante, 'aucun', sante.base === 'erreur' ? 503 : 200);
});
