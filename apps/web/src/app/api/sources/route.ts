import { sourcesAffichees } from '@/features/presentation/server/service';
import { gererRoute, repondre } from '@/lib/http/reponse';

export const GET = gererRoute('sources', async () =>
  repondre(await sourcesAffichees(), { publicMaxAgeS: 86400 }),
);
