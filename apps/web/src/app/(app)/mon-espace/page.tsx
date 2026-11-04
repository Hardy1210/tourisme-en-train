// Page provisoire : Mon espace est un aperçu fictif, sans fonctionnalité réelle en v1 (D054).
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { EtatVide } from '@/components/ui/etat-vide';

export const metadata: Metadata = { title: 'Mon espace' };

export default function PageMonEspace() {
  return (
    <div className="p-4 safe-top">
      <EtatVide
        titre="Mon espace"
        texte="Sans compte : vos favoris et vos récompenses resteront sur cet appareil."
        mention={<Badge>Aperçu · bientôt</Badge>}
      />
    </div>
  );
}
