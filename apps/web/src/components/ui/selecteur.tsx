'use client';

import { ToggleGroup } from 'radix-ui';
import { useId } from 'react';

export type OptionSelecteur = { valeur: string; libelle: string };

type Proprietes = {
  libelle: string;
  options: readonly OptionSelecteur[];
  valeur: string;
  surChangement: (valeur: string) => void;
};

/** Choix d'une option parmi quelques-unes, toutes visibles (rayon, durée maximale). */
export function Selecteur({ libelle, options, valeur, surChangement }: Proprietes) {
  const idLibelle = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={idLibelle} className="text-base font-semibold">
        {libelle}
      </span>
      <ToggleGroup.Root
        type="single"
        value={valeur}
        // Radix envoie une valeur vide si l'on retouche l'option active : un choix reste toujours fait.
        onValueChange={(choix) => {
          if (choix) surChangement(choix);
        }}
        aria-labelledby={idLibelle}
        className="grid auto-cols-fr grid-flow-col gap-2"
      >
        {options.map((option) => (
          <ToggleGroup.Item
            key={option.valeur}
            value={option.valeur}
            className="tabular h-touch cursor-pointer rounded-md border border-puce-border bg-puce-bg text-md font-semibold text-puce-foreground transition-colors hover:bg-surface-sunken data-[state=on]:border-selection-border data-[state=on]:bg-selection-bg data-[state=on]:text-selection-foreground"
          >
            {option.libelle}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
