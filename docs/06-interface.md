# 06 — Interface, design system et PWA

> **Version** 1.3 · **Date** 09/10/2026
> **Dépend de :** `00-vision.md`, `05-api.md`, `GLOSSAIRE.md`, `apps/web/src/styles/globals.css`
> **Utilisé par :** fiches E10 → E14
> **Document de référence pour :** écrans, états, composants, règles d'usage du design system, carte, PWA, accessibilité, textes.
> **Si ce document dépasse ~400 lignes**, il devient un dossier `06-interface/` (un fichier par écran + `composants.md`) avec un sommaire.

---

## 1. Principes UX

1. **Zéro recherche** : à l'ouverture, des résultats s'affichent sans que l'utilisateur tape quoi que ce soit.
2. **Tout se modifie en un geste** : lieu, rayon ou durée de train, catégories, date.
3. **Révélation progressive** : l'essentiel d'abord (où, combien de temps, quoi faire), le détail au toucher.
4. **Au pouce, d'une main** : actions importantes dans la moitié basse de l'écran.
5. **Mobile d'abord** (390 × 844), puis desktop (1440 × 900).
6. **Honnêteté** : estimation annoncée comme telle, données manquantes signalées sans alarmer.
7. **Train d'abord**, puis transports en ville, puis marche.

---

## 2. Design system

- **Source unique :** `apps/web/src/styles/globals.css` (Tailwind CSS 4). La section 1 du fichier contient les réglages de marque ; tout le reste en découle.
- **Interdit :** toute couleur, rayon, ombre, police ou durée en dur. Un besoin nouveau = un nouveau token dans `globals.css`.
- **Rôle des couleurs :**

| Token | Usage | Jamais pour |
|---|---|---|
| `primary` | Train, marque, navigation active | Actions d'achat |
| `action` | **Une seule** action principale visible : « Voir la sortie », « Acheter mon billet » | Décoration |
| `transit` | Bus, tram, vélos, trottinettes | Train |
| `cat-*` | Les 5 catégories, **toujours avec une icône** | Autre chose que des lieux |
| `eco` | CO₂ économisé | Succès génériques |
| `danger` | Erreurs réelles (train supprimé) | Retard modéré (→ `warning`) |

- **Typographie :** `font-display` (titres, noms de lieux), `font-sans` (reste). Classe `tabular` sur **tous** les horaires, durées, distances, prix.
- **Icônes :** Lucide, trait 1,75 px. Catégories : `enfants` → `FerrisWheel`, `nature` → `Mountain`, `parcs` → `Trees`, `patrimoine` → `Castle`, `culture` → `Theater`. Transports : `TrainFront`, `Bus`, `TramFront`, `Bike`.
- **Composants de base** (`components/ui/`, shadcn/ui adaptés aux tokens) : `Bouton`, `Puce` (filtre), `Feuille` (bottom sheet), `Onglets`, `Carte` (conteneur), `Badge`, `Squelette`, `Bandeau`, `ChampRecherche`, `Interrupteur`, `Selecteur`.
- **Mode sombre** (P1) : uniquement par les tokens `.dark`.
- **Maquettes Claude Design** : conseil visuel. On copie l'aspect, jamais le comportement sans vérification.

---

## 3. Écran « Explorer » (page d'accueil)

### Structure mobile, de haut en bas
1. **En-tête collant** : logo (`marque.nom`), puce de localisation « 📍 Autour de <commune> ▾ » (→ Ma position / Une autre ville ; `<commune>` vient de `/api/geocodage/inverse`, voir `05` § 3.11 bis ; en attendant la réponse : « Autour de vous »), puce de date « Aujourd'hui ▾ » (Aujourd'hui · Demain · Ce week-end · Choisir). **« Ce week-end »** = samedi (ou aujourd'hui si on est déjà le week-end), voir `05` § A.3.
2. **Rangée de filtres** (défilement horizontal) : « Tout » + 5 catégories (multi-sélection) ; bouton « Filtres » avec compteur → feuille : rayon (`autourDeMoiOptionsM`), durée de train max (`trainMaxOptionsMin`), « Faisable dans la journée » (P1).
3. **Carte (~40 % de la hauteur)** : point pulsant de l'utilisateur, gare la plus proche, lieux proches (épingles par catégorie), gares de destination **colorées par tranche de temps** ; mini-fiche au toucher ; boutons « Recentrer » et « Plein écran ».
   - **Liaisons :** en P0, **segments droits** de la gare de départ vers chaque destination ; en P1, vrais tracés (`/api/lignes`). *La maquette montre des lignes « bien rangées » : c'est un dessin, la vraie carte ne l'est pas.*
   - **Étiquettes « Beaune 22 min » :** affichées pour les 5 destinations les plus proches, au survol et pour la destination sélectionnée ; les autres gares restent des points. Collisions gérées par MapLibre.
   - **Survol croisé (desktop) :** survoler une carte de destination met la gare en évidence sur la carte, et inversement.
4. **Feuille de résultats (glissante, par-dessus la carte)** :
   - **a. Votre gare** : nom, distance, durée vélo ; prochain départ direct ; « Changer de gare ».
   - **b. À deux pas de vous** : lieux à pied, cartes horizontales (image ou illustration de catégorie, nom, puce, « 🚶 8 min · 650 m »).
   - **c. En train direct depuis <gare>** : cartes de destination triées par **durée de train** : nom, durée, trains/jour, premier départ et dernier retour, compteurs par catégorie sélectionnée, « ✓ Faisable dans la journée » **ou** « 🌙 Retour tôt, plutôt sur 2 jours » (P1), CO₂ économisé, prochain train « 10:12 → 10:34 », prix estimé **uniquement s'il est calibré** (sinon la ligne disparaît, sans espace vide), bouton `action` « Voir la sortie ».
5. **Navigation basse** : Explorer · Menu (→ À propos · Sources des données). Pas de « Mes sorties » en v1 (favoris = P2), comme la fiche E10.

### Desktop
Panneau gauche de 440 px (en-tête, filtres, résultats) + carte pleine hauteur à droite ; la fiche destination s'ouvre en panneau latéral de 480 px.

### États (obligatoires)
| État | Affichage |
|---|---|
| Chargement | Squelettes + « On cherche ce qu'il y a autour de vous… » |
| Localisation refusée ou impossible | Grand champ « Dans quelle ville êtes-vous ? » + suggestions de villes de la région |
| Hors région pilote | Message clair : « Pour l'instant, <marque> couvre <région> » (`marque.nom` et `parametres.region.nom`, jamais écrits en dur) + choix d'une ville de la région |
| Aucun résultat | Message utile + action (« Élargir à 1 h de train ») |
| Hors ligne | Bandeau discret + dernières recherches |
| Erreur serveur | Message simple + « Réessayer » |

---

## 4. Fiche destination

- **Mobile :** feuille plein écran. **Desktop :** panneau latéral.
- **En-tête :** nom de la gare, durée, trains/jour, sélecteur de date ; si « Ce week-end » : bascule **Samedi / Dimanche** ; bouton **Partager** (P1 : partage natif du téléphone, sinon copie du lien + message « Lien copié »).
- **Onglets :**
  - **Lieux** : mini-carte + liste par catégorie (nom, durée à pied, description courte, horaires si connus, badge Qualité Tourisme). **Lieu sans description ni horaires** (fréquent pour OpenStreetMap) : nom, catégorie, durée à pied et lien « Voir sur la carte », sans case vide. Hors région : « Les lieux de cette destination ne sont pas encore disponibles. »
  - **Trains** : deux colonnes Aller / Retour ; départ, arrivée, durée, type ; **dernier retour** mis en évidence. **Par défaut : horaires théoriques, sans statut.** Statut « À l'heure / +5 min / Supprimé » (P1) **seulement** pour les trains des 3 prochaines heures **aujourd'hui**, si la clé API SNCF est disponible ; un train supprimé reste visible, barré.
  - **Sur place** : bus et tram (numéros de lignes), stations vélos/trottinettes, distance à pied ; **nombre de vélos disponibles** en direct (P1, villes avec flux GBFS, sinon pas de nombre) ; aménagements cyclables (P1). **Pas de transport à la demande** (données non fiables, voir `00` § 9).
- **Pied collant :** bloc `eco` (« 🌱 Vous économisez 5,2 kg de CO₂ par rapport à la voiture ») avec lien « Comparer » (voiture partagée, avion) ; prix estimé si calibré ; bouton `action` « Acheter mon billet » (lien externe vers la billetterie officielle).

---

## 4 bis. Maquettes et variantes

- Maquettes de référence (Claude Design) : Explorer mobile et desktop, avec la fiche destination intégrée. Captures et liens : `design/README.md`.
- **Variantes à concevoir** (avant E11–E12) :
  1. carte avec **une vingtaine de destinations** (lisibilité des étiquettes) ;
  2. **lieu sans description ni horaires** ;
  3. **carte de destination et pied de fiche sans prix** ;
  4. **onglet Trains sans statut** (cas par défaut) ;
  5. bascule **Samedi / Dimanche** ;
  6. station de vélos **sans nombre** disponible.
- À **retirer** de la maquette : le transport à la demande, le bouton « Mes sorties » (favoris, P2), remplacé par l'entrée « Menu » de la navigation basse (§ 3).
- **Écrans complémentaires à concevoir** (prompts : `design/prompts-ecrans.md`) : fiche lieu · calendrier « Choisir une date » · utilisateur hors région · destination hors région · écran Sources + menu · erreurs (sortie expirée, 404, panne) · détail « Comparer » (CO₂) · écran avant la localisation · invitation à installer l'app.

## 5. Page « L'âme du produit » et écran Sources

- Accessible depuis « À propos ».
- Sections : accroche · le constat · pourquoi c'est important (3 chiffres sourcés) · la solution en 3 étapes (captures) · pour qui · ce que ça change · conclusion + bouton « Ouvrir l'application ».
- Textes de référence : `docs/equipe/pitch.md` (à créer à l'E13 à partir du pitch validé).
- **Écran Sources** : liste issue de `/api/sources` (nom, producteur, licence, lien, date) + attributions OSM / OpenFreeMap + mention du défi data.gouv.fr.

---

## 6. Carte

- **MapLibre GL** + `react-map-gl`, style **OpenFreeMap** personnalisé : couleurs du fond lues depuis les tokens (`--map-*`), labels réduits.
- Les **épingles et le point utilisateur sont des composants à nous** (couleurs `cat-*`, `map-user`, `map-station`).
- **Isochrone simplifiée :** couleur des gares de destination selon `trancheTemps`, légende visible.
- **Accessibilité :** la carte est toujours doublée d'une liste ; aucune information n'existe uniquement sur la carte.
- **Attribution** visible en bas de la carte.
- Hors ligne (option E16) : fichier PMTiles régional.

---

## 7. PWA

| Élément | Règle |
|---|---|
| Manifest | Généré par `app/manifest.ts` depuis `config/marque.ts` ; icônes 192/512 + maskable ; `display: standalone` ; `lang: fr` |
| Service worker | Serwist : précache de l'interface ; `StaleWhileRevalidate` pour `/api/destinations`, `/api/lieux`, `/api/trains`, `/api/mobilites` (24 h, 50 entrées) ; `NetworkFirst` pour le temps réel ; `CacheFirst` pour les tuiles (7 j, 500) et les images (30 j, 100) |
| Hors ligne | Dernières recherches lisibles ; bandeau « Vous êtes hors ligne » |
| Installation | Invitation discrète après une première recherche réussie, jamais au premier affichage |

---

## 8. Accessibilité (WCAG 2.1 AA)

Contraste AA · cibles tactiles ≥ 44 px (`h-touch`) · navigation clavier complète · libellés ARIA sur les icônes seules · focus visible (token `ring`) · `prefers-reduced-motion` respecté · couleur jamais seule porteuse d'information · textes lisibles à 16 px.

---

## 9. Textes

- Tutoiement ou vouvoiement : **vouvoiement**.
- Ton : chaleureux, simple, sans jargon (« train direct », pas « liaison directe » dans l'interface).
- Nom de marque : **toujours** via `marque.nom`.
- Estimations : « ≈ 8–12 € (estimation) ».
- Horaires : « 10:12 » ; après minuit : « 00:35 (+1) ».

---

## 10. Processus de design

Un écran à la fois, celui que Hardy indique ; montré avant de passer au suivant. Hardy apporte l'expérience d'usage ; l'implémentation est proposée par Claude Code. Une demande de design qui toucherait la logique ou les données est signalée avant.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Alignement sur la maquette Explorer : carte en segments + étiquettes, week-end, partage, vélos disponibles, temps réel limité, états sans description / sans prix / sans statut, variantes à concevoir — D017 à D021 |
| 02/10/2026 | 1.2 | Nom de la commune de la puce de localisation par `/api/geocodage/inverse` — D022 ; écrans complémentaires listés en § 4 bis |
| 09/10/2026 | 1.3 | Navigation basse alignée sur E10 (Explorer · Menu) ; message « hors région » tiré de `marque` et `parametres.region` |
