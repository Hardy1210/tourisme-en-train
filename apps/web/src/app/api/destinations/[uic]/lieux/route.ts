import { schemaParametresLieuxGare } from '@/features/lieux/schemas';
import { lieuxAPiedDeLaGare } from '@/features/lieux/server/fiche';
import { gererRoute, repondre, type Segments } from '@/lib/http/reponse';
import { lireParametres, schemaUic, validerSegment } from '@/lib/http/valider';

export const GET = gererRoute(
  'destinations/[uic]/lieux',
  async (requete, { params }: Segments<{ uic: string }>) => {
    const uic = validerSegment((await params).uic, schemaUic);
    const parametres = lireParametres(requete, schemaParametresLieuxGare);
    return repondre(await lieuxAPiedDeLaGare(uic, parametres), { publicMaxAgeS: 86400 });
  },
);
