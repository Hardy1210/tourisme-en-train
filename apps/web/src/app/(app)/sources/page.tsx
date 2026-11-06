import type { Metadata } from 'next';
import { TEXTES_SOURCES } from '@/features/presentation/contenu';
import { EcranSources } from '@/features/presentation/ui/ecran-sources';

export const metadata: Metadata = { title: TEXTES_SOURCES.titre };

export default function PageSources() {
  return <EcranSources />;
}
