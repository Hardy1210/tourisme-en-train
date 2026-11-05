'use client';

import { WifiOff } from 'lucide-react';
import { useEnLigne } from '@/lib/use-en-ligne';
import { Bandeau } from './bandeau';

export function BandeauHorsLigne() {
  if (useEnLigne()) return null;
  return (
    <Bandeau
      variante="avertissement"
      icone={<WifiOff aria-hidden="true" className="size-4 flex-none" />}
      className="bandeau-hors-ligne flex-none rounded-none"
    >
      Vous êtes hors ligne : voici vos dernières recherches
    </Bandeau>
  );
}
