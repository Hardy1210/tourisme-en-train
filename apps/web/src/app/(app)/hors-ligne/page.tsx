import type { Metadata } from 'next';
import { EcranHorsLigne } from '@/components/ui/ecran-hors-ligne';

export const metadata: Metadata = { title: 'Hors ligne' };

// Servie par le service worker à la place d'une page jamais ouverte, sous son adresse d'origine (D071).
export default function PageHorsLigne() {
  return <EcranHorsLigne />;
}
