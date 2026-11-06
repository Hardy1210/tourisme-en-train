import type { ReactNode } from 'react';

/** Page de lecture : plein écran sur mobile (au-dessus de la navigation), à côté du rail sur grand écran. */
export function CadrePage({ enTete, children }: { enTete: ReactNode; children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-0 z-overlay flex h-(--hauteur-app) flex-col bg-background safe-top lg:static lg:z-auto lg:h-full lg:pt-0">
      <div className="flex-none border-b px-4 py-2 lg:px-6">{enTete}</div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-(--page-lecture-largeur) flex-col gap-5 px-4 pt-5 safe-bottom lg:gap-6 lg:px-6 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
