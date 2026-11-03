import { mobilites } from '@/features/mobilites/server/service';
import { gererRoute, repondre, type Segments } from '@/lib/http/reponse';
import { schemaUic, validerSegment } from '@/lib/http/valider';

export const GET = gererRoute(
  'mobilites/[uic]',
  async (_requete, { params }: Segments<{ uic: string }>) => {
    const uic = validerSegment((await params).uic, schemaUic);
    return repondre(await mobilites(uic), { publicMaxAgeS: 86400 });
  },
);
