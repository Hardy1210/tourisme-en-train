'use client';

import { CATEGORIES, type Categorie } from '@tourisme/commun';
import { Moon, SlidersHorizontal, TriangleAlert, WifiOff } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bandeau } from '@/components/ui/bandeau';
import { Bouton, BoutonFermer, BoutonRetour } from '@/components/ui/bouton';
import { Carte } from '@/components/ui/carte';
import { ChampRecherche } from '@/components/ui/champ-recherche';
import { EtatVide } from '@/components/ui/etat-vide';
import { Feuille } from '@/components/ui/feuille';
import { Interrupteur } from '@/components/ui/interrupteur';
import { Logo } from '@/components/ui/logo';
import { Onglets } from '@/components/ui/onglets';
import { Puce } from '@/components/ui/puce';
import { Selecteur } from '@/components/ui/selecteur';
import { Squelette } from '@/components/ui/squelette';
import { APPARENCE_CATEGORIE, IconeCategorie } from '@/features/lieux/ui/icone-categorie';

// Textes d'exemple, pour la planche uniquement.
const RAYONS = ['1', '2', '5', '10'].map((v) => ({ valeur: v, libelle: `${v} km` }));
const TEMPS = [
  ['bg-map-time-1', '≤ 30 min'],
  ['bg-map-time-2', '≤ 1 h'],
  ['bg-map-time-3', '≤ 1 h 30'],
  ['bg-map-time-4', '> 1 h 30'],
] as const;
const TAILLES = ['text-2xs', 'text-xs', 'text-sm', 'text-md', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">{titre}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export function Planche({ sombreAuDepart }: { sombreAuDepart: boolean }) {
  const [sombre, setSombre] = useState(sombreAuDepart);
  const [categories, setCategories] = useState<readonly Categorie[]>(['nature']);
  const [rayon, setRayon] = useState('2');
  const [onglet, setOnglet] = useState('lieux');
  const [faisable, setFaisable] = useState(true);
  const [feuille, setFeuille] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', sombre);
    return () => document.documentElement.classList.remove('dark');
  }, [sombre]);

  const basculer = (categorie: Categorie) =>
    setCategories((liste) =>
      liste.includes(categorie) ? liste.filter((c) => c !== categorie) : [...liste, categorie],
    );

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Planche</h1>
        <Bouton variante="secondaire" onClick={() => setSombre((s) => !s)}>
          <Moon aria-hidden="true" className="size-4.5" />
          {sombre ? 'Mode clair' : 'Mode sombre'}
        </Bouton>
      </header>

      <Section titre="Logo">
        <Logo />
        <span className="rounded-md bg-hero-bg p-3">
          <Logo surHero />
        </span>
      </Section>

      <Section titre="Boutons">
        <Bouton>Acheter mon billet</Bouton>
        <Bouton variante="sortie">Voir la sortie</Bouton>
        <Bouton variante="secondaire">Tout afficher</Bouton>
        <Bouton variante="fantome">Changer de gare</Bouton>
        <Bouton disabled>Indisponible</Bouton>
        <BoutonRetour />
        <BoutonFermer />
      </Section>

      <Section titre="Puces">
        <Puce selectionnee={categories.length === 0} onClick={() => setCategories([])}>
          Tout
        </Puce>
        {CATEGORIES.map((categorie) => (
          <Puce
            key={categorie}
            selectionnee={categories.includes(categorie)}
            onClick={() => basculer(categorie)}
            icone={<IconeCategorie categorie={categorie} />}
          >
            {APPARENCE_CATEGORIE[categorie].libelle}
          </Puce>
        ))}
        <Puce selectionnee={false} icone={<SlidersHorizontal aria-hidden="true" />}>
          Filtres
        </Puce>
      </Section>

      <Section titre="Sélecteur et interrupteurs">
        <div className="flex w-full flex-col gap-2">
          <Selecteur
            libelle="Distance autour de vous"
            options={RAYONS}
            valeur={rayon}
            surChangement={setRayon}
          />
          <Interrupteur
            libelle="Faisable dans la journée"
            description="Aller et retour le même jour"
            actif={faisable}
            surChangement={setFaisable}
          />
          <Interrupteur
            libelle="Adapté aux poussettes"
            mention={<Badge>Bientôt</Badge>}
            actif={false}
            desactive
          />
        </div>
      </Section>

      <Section titre="Onglets">
        <div className="w-full">
          <Onglets
            valeur={onglet}
            surChangement={setOnglet}
            onglets={[
              { valeur: 'lieux', libelle: 'Lieux', contenu: <p>Contenu de l’onglet Lieux.</p> },
              { valeur: 'trains', libelle: 'Trains', contenu: <p>Contenu de l’onglet Trains.</p> },
              { valeur: 'place', libelle: 'Sur place', contenu: <p>Contenu de l’onglet Sur place.</p> },
            ]}
          />
        </div>
      </Section>

      <Section titre="Carte et badges">
        <Carte className="w-full">
          <h3 className="text-xl font-bold">Beaune</h3>
          <p className="tabular text-sm text-muted-foreground">Exemple · 22 min · 14 trains/jour</p>
          <div className="flex flex-wrap gap-2">
            <Badge>Bientôt</Badge>
            <Badge variante="eco">−3,2 kg CO₂</Badge>
            <Badge variante="transit">Bus</Badge>
            <Badge variante="avertissement">+5 min</Badge>
            <Badge variante="danger">Supprimé</Badge>
            <Badge variante="info">Temps réel</Badge>
          </div>
        </Carte>
      </Section>

      <Section titre="Squelettes">
        <Squelette className="h-24 w-44 rounded-carte" />
        <Squelette className="h-4 w-32" />
      </Section>

      <Section titre="Bandeaux">
        <div className="flex w-full flex-col gap-2">
          <Bandeau variante="avertissement" icone={<WifiOff aria-hidden="true" />}>
            Vous êtes hors ligne : voici vos dernières recherches
          </Bandeau>
          <Bandeau variante="info">Horaires théoriques pour cette date.</Bandeau>
          <Bandeau variante="danger" icone={<TriangleAlert aria-hidden="true" />}>
            Exemple d’erreur importante.
          </Bandeau>
        </div>
      </Section>

      <Section titre="Champ de recherche">
        <ChampRecherche
          libelle="Rechercher une ville ou une gare"
          placeholder="Rechercher une ville ou une gare"
          className="w-full"
        />
      </Section>

      <Section titre="État vide">
        <EtatVide
          className="w-full"
          titre="Aucun lieu pour ces envies"
          texte="Essayez d’autres catégories ou élargissez la durée du trajet."
        >
          <Bouton variante="secondaire">Tout afficher</Bouton>
        </EtatVide>
      </Section>

      <Section titre="Feuille">
        <Bouton variante="secondaire" onClick={() => setFeuille(true)}>
          Ouvrir la feuille
        </Bouton>
        <Feuille ouverte={feuille} surChangement={setFeuille} titre="Filtres">
          <p>Contenu d’exemple de la feuille.</p>
        </Feuille>
      </Section>

      <Section titre="Temps de trajet">
        {TEMPS.map(([classe, libelle]) => (
          <span key={libelle} className="tabular inline-flex items-center gap-2 text-sm">
            <span aria-hidden="true" className={`size-3 rounded-pill ${classe}`} />
            {libelle}
          </span>
        ))}
      </Section>

      <Section titre="Tailles de texte">
        <div className="flex flex-col gap-1">
          {TAILLES.map((taille) => (
            <span key={taille} className={taille}>
              {taille} : Une sortie en train
            </span>
          ))}
        </div>
      </Section>
    </main>
  );
}
