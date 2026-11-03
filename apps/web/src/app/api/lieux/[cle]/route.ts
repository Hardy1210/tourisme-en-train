import { ficheLieu } from '@/features/lieux/server/fiche';
import { gererRoute, repondre, type Segments } from '@/lib/http/reponse';
import { schemaCleLieu, validerSegment } from '@/lib/http/valider';

export const GET = gererRoute(
  'lieux/[cle]',
  async (_requete, { params }: Segments<{ cle: string }>) => {
    const cle = validerSegment((await params).cle, schemaCleLieu);
    return repondre(await ficheLieu(cle), { publicMaxAgeS: 86400 });
  },
);
