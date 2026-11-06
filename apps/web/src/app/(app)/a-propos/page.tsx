import type { Metadata } from 'next';
import { TEXTES_A_PROPOS } from '@/features/presentation/contenu-a-propos';
import { EcranAPropos } from '@/features/presentation/ui/ecran-a-propos';

export const metadata: Metadata = { title: TEXTES_A_PROPOS.titrePage };

export default function PageAPropos() {
  return <EcranAPropos />;
}
