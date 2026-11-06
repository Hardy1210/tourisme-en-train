import type { Metadata } from 'next';
import { TEXTES_MENTIONS } from '@/features/presentation/contenu-mentions';
import { EcranMentions } from '@/features/presentation/ui/ecran-mentions';

export const metadata: Metadata = { title: TEXTES_MENTIONS.titre };

export default function PageMentions() {
  return <EcranMentions />;
}
