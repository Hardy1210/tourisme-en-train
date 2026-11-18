import { maintenantParis } from '@tourisme/commun';
import { ficheLieu } from '@/features/lieux/server/fiche';
import { gererRoute, repondre, type Segments } from '@/lib/http/reponse';
import { schemaCleLieu, validerSegment } from '@/lib/http/valider';

export const GET = gererRoute(
  'lieux/[cle]',
  async (_requete, { params }: Segments<{ cle: string }>) => {
    const cle = validerSegment((await params).cle, schemaCleLieu);
    // Date du jour : une photo dont les droits ont pris fin ne sort plus (D100), au cache près (un jour).
    return repondre(await ficheLieu(cle, maintenantParis().dateDuJour), { publicMaxAgeS: 86400 });
  },
);
