'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import type { Categorie } from '@tourisme/commun';
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import Map, { type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import { parametres } from '@/config/parametres';
import { formaterDuree } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';
import { useLieuxCarte } from '@/features/lieux/hooks';
import type { LieuResume } from '@/features/lieux/schemas';
import { useArretsTrain } from '@/features/trains/hooks';
import {
  centreDestination,
  clesEtiquetees,
  empriseDe,
  margesVerticales,
  pointsCadrage,
  pointsEtiquettes,
  ligneArrets,
  segmentsDepuis,
  type Point,
} from '../geometrie';
import { lireTokens } from '../couleurs';
import { useStyleCarte } from '../hooks';
import { enregistrerIconesCategories } from '../icones-categories';
import { AttributionFondCarte } from './attribution-fond-carte';
import { CommandesCarte } from './commandes-carte';
import { COUCHE_BULLES, COUCHE_ICONES, CoucheLieux, SOURCE_LIEUX } from './couche-lieux';
import { CouchesCarte } from './couches-carte';
import { MarqueurGareDepart, MarqueursDestinations, MarqueurUtilisateur } from './marqueurs-carte';
import { MiniFicheDestination, MiniFicheLieu, MiniFicheLieuCarte } from './mini-fiche';

type Selection = { type: 'destination'; uic: string } | { type: 'lieu'; cle: string } | null;

export type ProprietesCarte = {
  /** Position de l'utilisateur ; null s'il a choisi une gare. */
  utilisateur: Point | null;
  gareDepart: Point & { nom: string; uic: string };
  /** Date choisie ; null pour aujourd'hui. */
  date: string | null;
  destinations: readonly Destination[];
  /** Destination choisie dans la recherche (D084) : la carte se centre sur sa gare ; null sinon. */
  destinationCherchee: string | null;
  lieux: readonly LieuResume[];
  /** Catégories choisies : filtrent les bulles et les icônes de tous les lieux (D091). */
  categories: readonly Categorie[];
  lienDe: (destination: Destination) => string;
  /** Hauteur en pixels cachée en bas par la feuille de résultats, pour cadrer dans ce qui reste. */
  masqueEnBas: () => number;
  /** Même chose en haut, sous l'en-tête posé sur la carte (mobile). */
  masqueEnHaut: () => number;
  /** Carte plein écran sur mobile. */
  pleinEcran: { actif: boolean; bascule: () => void };
  /** Augmente à chaque carte touchée dans la liste : la mini-fiche ouverte se referme (D074). */
  carteTouchee: number;
  /** Survol croisé sur grand écran : la destination survolée ici ou dans la liste. */
  survolee: string | null;
  surSurvol: (uic: string | null) => void;
};

const MARGE_PX = 48;

/** Fond OpenFreeMap aux couleurs des tokens ; toute information figure aussi dans la liste (`06` § 6). */
export function CarteExplorer({
  utilisateur,
  gareDepart,
  date,
  destinations,
  destinationCherchee,
  lieux,
  categories,
  lienDe,
  masqueEnBas,
  masqueEnHaut,
  pleinEcran,
  carteTouchee,
  survolee,
  surSurvol,
}: ProprietesCarte) {
  const carte = useRef<MapRef>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const style = useStyleCarte();
  const tousLesLieux = useLieuxCarte();
  // Couleurs des bulles et icônes de catégorie, lues dans les tokens une fois la carte chargée.
  const [couleursBulles, setCouleursBulles] = useState<{
    bulle: string;
    texteBulle: string;
    halo: string;
  } | null>(null);

  const [derniereCarteTouchee, setDerniereCarteTouchee] = useState(carteTouchee);
  if (carteTouchee !== derniereCarteTouchee) {
    setDerniereCarteTouchee(carteTouchee);
    setSelection(null);
  }

  const emprise = empriseDe([
    ...pointsCadrage(
      gareDepart,
      destinations.map((d) => ({ lat: d.gare.lat, lon: d.gare.lon, dureeMin: d.dureeMin })),
      parametres.carte.dureeCadrageMin,
    ),
    ...(utilisateur ? [utilisateur] : []),
  ]);
  const uicChoisi = selection?.type === 'destination' ? selection.uic : null;
  // La carte touchée dans la liste, ou le point touché sur la carte : la ligne de son train (D074).
  const arrets = useArretsTrain(gareDepart.uic, survolee ?? uicChoisi, date);
  const marge = () => ({
    padding: {
      ...margesVerticales({
        haut: MARGE_PX + masqueEnHaut(),
        bas: MARGE_PX + masqueEnBas(),
        hauteur: carte.current?.getContainer().clientHeight ?? 0,
        minimum: 2 * MARGE_PX,
      }),
      left: MARGE_PX,
      right: MARGE_PX,
    },
    maxZoom: 12,
    duration: 0,
  });
  // Destination choisie : centrée sur sa gare ; sinon (ou « Recentrer ») le cadrage de départ.
  const centre = centreDestination(
    destinations.map((d) => ({ uic: d.gare.uic, lat: d.gare.lat, lon: d.gare.lon })),
    destinationCherchee,
  );
  const cadrer = () => {
    const instance = carte.current;
    if (!instance) return;
    // `easeTo` garde ses marges en mémoire, et `fitBounds` les ajouterait aux siennes : une fois la
    // feuille des résultats montée, le total dépasse la carte et MapLibre ne bouge plus.
    instance.getMap().setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
    if (centre)
      instance.easeTo({
        center: [centre.lon, centre.lat],
        zoom: parametres.carte.zoomDestination,
        padding: marge().padding,
        duration: 0,
      });
    else if (emprise) instance.fitBounds(emprise, marge());
  };
  const cleCentre = centre ? `${centre.lat},${centre.lon}` : null;
  const cadrerRef = useRef(cadrer);
  useEffect(() => {
    cadrerRef.current = cadrer;
  });
  const premierCadrage = useRef(true);
  useEffect(() => {
    // Le premier cadrage se fait au chargement de la carte (`onLoad`).
    if (premierCadrage.current) {
      premierCadrage.current = false;
      return;
    }
    cadrerRef.current();
  }, [cleCentre]);
  // Une couche n'est recalculée que si ses données changent : sinon la ligne du train attend les autres.
  const { lat: departLat, lon: departLon } = gareDepart;
  const segments = useMemo(
    () =>
      segmentsDepuis(
        { lat: departLat, lon: departLon },
        destinations.map((d) => ({ lat: d.gare.lat, lon: d.gare.lon })),
      ),
    [departLat, departLon, destinations],
  );
  const parcours = useMemo(() => ligneArrets(arrets.data?.arrets ?? []), [arrets.data]);
  const etiquettes = useMemo(() => {
    const cles = clesEtiquetees(
      destinations.map((d) => ({ uic: d.gare.uic, nbTrains: d.nbTrains, dureeMin: d.dureeMin })),
      uicChoisi,
      parametres.carte.etiquettesMax,
    );
    if (survolee !== null) cles.add(survolee);
    return pointsEtiquettes(
      destinations.map((d) => ({
        uic: d.gare.uic,
        lat: d.gare.lat,
        lon: d.gare.lon,
        etiquette: `${d.titre} ${formaterDuree(d.dureeMin)}`,
      })),
      cles,
      uicChoisi,
    );
  }, [destinations, uicChoisi, survolee]);
  const destinationChoisie = destinations.find((d) => d.gare.uic === uicChoisi);
  const lieuChoisi =
    selection?.type === 'lieu' ? lieux.find((l) => l.cle === selection.cle) : undefined;

  // Bulle touchée : la carte zoome jusqu'à ce qu'elle se divise ; icône touchée : la mini-fiche du lieu.
  const toucher = async (evenement: MapLayerMouseEvent) => {
    const touche = evenement.features?.[0];
    if (!touche) {
      setSelection(null);
      return;
    }
    if (touche.layer.id === COUCHE_BULLES && touche.geometry.type === 'Point') {
      const source = carte.current?.getSource(SOURCE_LIEUX) as GeoJSONSource | undefined;
      const zoom = await source?.getClusterExpansionZoom(Number(touche.properties.cluster_id));
      if (zoom === undefined) return;
      const [lon = 0, lat = 0] = touche.geometry.coordinates;
      carte.current?.easeTo({ center: [lon, lat], zoom });
      return;
    }
    setSelection({ type: 'lieu', cle: String(touche.properties.cle) });
  };

  if (style.isError) {
    return (
      <p className="h-full bg-surface-sunken p-4 text-sm text-muted-foreground">
        La carte n&apos;est pas disponible pour le moment. Toutes les informations restent dans la
        liste ci-dessous.
      </p>
    );
  }
  if (!style.data || !emprise) {
    return <div aria-hidden="true" className="h-full bg-map-land" />;
  }

  return (
    <div
      role="region"
      aria-label="Carte des lieux et des destinations"
      className="relative h-full overflow-hidden"
    >
      {/* Isolée : les épingles restent sous la mini-fiche et le bouton. */}
      <div className="absolute inset-0 isolate">
        <Map
          ref={carte}
          mapStyle={style.data.style as StyleSpecification}
          initialViewState={{
            bounds: emprise,
            fitBoundsOptions: { padding: MARGE_PX, maxZoom: 12 },
          }}
          attributionControl={false}
          interactiveLayerIds={couleursBulles ? [COUCHE_BULLES, COUCHE_ICONES] : []}
          onClick={(evenement) => void toucher(evenement)}
          onLoad={(evenement) => {
            cadrer();
            void enregistrerIconesCategories(evenement.target).then(() =>
              setCouleursBulles(
                lireTokens({
                  bulle: '--primary',
                  texteBulle: '--primary-foreground',
                  halo: '--map-halo',
                }),
              ),
            );
          }}
        >
          <CouchesCarte
            segments={segments}
            parcours={parcours}
            etiquettes={etiquettes}
            couleurs={style.data.couleurs}
          />
          {couleursBulles && tousLesLieux.data && (
            <CoucheLieux
              lieux={tousLesLieux.data.lieux}
              categories={categories}
              couleurs={couleursBulles}
            />
          )}
          <MarqueursDestinations
            destinations={destinations}
            uicChoisi={uicChoisi}
            survolee={survolee}
            surSurvol={surSurvol}
            surChoix={(uic) => setSelection({ type: 'destination', uic })}
          />
          <MarqueurGareDepart gare={gareDepart} />
          {utilisateur && <MarqueurUtilisateur position={utilisateur} />}
        </Map>
      </div>

      {/* Attribution exigée par la licence, toujours visible (config/sources.json). */}
      <p className="absolute inset-x-0 top-(--resultats-haut) hidden -translate-y-full bg-surface/80 px-2 py-0.5 text-2xs text-muted-foreground lg:block lg:pb-1">
        <AttributionFondCarte />
      </p>

      <CommandesCarte
        surRecentrer={() => {
          setSelection(null);
          cadrer();
        }}
        pleinEcran={pleinEcran}
      />

      {destinationChoisie && (
        <MiniFicheDestination
          destination={destinationChoisie}
          lien={lienDe(destinationChoisie)}
          surFermeture={() => setSelection(null)}
        />
      )}
      {lieuChoisi && <MiniFicheLieu lieu={lieuChoisi} surFermeture={() => setSelection(null)} />}
      {selection?.type === 'lieu' && !lieuChoisi && (
        <MiniFicheLieuCarte cle={selection.cle} surFermeture={() => setSelection(null)} />
      )}
    </div>
  );
}
