import { maintenantParis } from '@tourisme/commun';

import { schemaParametresFiche } from '@/features/destinations/schemas';
import { ficheDestination } from '@/features/destinations/server/fiche';
import { gererRoute, repondre, type Segments } from '@/lib/http/reponse';
import { lireParametres, schemaUic, validerSegment } from '@/lib/http/valider';

export const GET = gererRoute(
  'destinations/[uic]',
  async (requete, { params }: Segments<{ uic: string }>) => {
    const uic = validerSegment((await params).uic, schemaUic);
    const parametres = lireParametres(requete, schemaParametresFiche);
    return repondre(await ficheDestination(uic, parametres, maintenantParis()), {
      publicMaxAgeS: 3600,
    });
  },
);
