# Pitch : textes de la page « L'âme du produit »

> **État : BROUILLON, à valider par Hardy.** Rien de cette page n'est encore affiché dans l'application.
> **Version** 0.4 · **Date** 19/11/2026
> **Dépend de :** `docs/00-vision.md` § 1 à 3
> **Utilisé par :** `apps/web/src/features/presentation/` (E13), `docs/06-interface.md` § 5
> **Document de référence pour :** les textes et les chiffres de la page (source unique, fiche E13).

**Règle de ce brouillon :** les textes viennent de `00` § 1 à 3, sans invention. Un chiffre non confirmé n'est pas affiché. Une section sans texte dans ces paragraphes reste marquée « À écrire ».

---

## Accroche
> Trouver une sortie en 30 secondes, et y aller en train.

## Le constat
Organiser une sortie, un week-end ou des vacances sans voiture oblige aujourd'hui à passer d'un site à l'autre : un pour les châteaux, un pour les aires de jeux, un pour la nature, un pour les horaires de train, un pour les bus sur place. Chaque site ne répond qu'à une question. Et surtout, on ne sait pas ce qui existe, ni près de chez soi, ni ailleurs.

Résultat : une à deux heures d'organisation, du stress, et souvent on reprend la voiture.

> ⚠️ **« Une à deux heures » : aucune source dans `00`.** Ce n'est pas un des 3 chiffres sourcés, mais la fiche demande une source pour chaque chiffre affiché. À Hardy de trouver une source, ou de retirer cette durée.

## Pourquoi c'est important : 3 chiffres
Tous de l'ADEME.

| Chiffre affiché | Ce qu'a dit la page lue | Lien à afficher | État de la vérification (06/11/2026) |
|---|---|---|---|
| **97 Mt CO₂e** : émissions du tourisme en France en 2022 | « 97 millions de tonnes de CO2 équivalent en 2022 », d'après le bilan de l'ADEME | [Communiqué de l'ADEME](https://www.ademe.fr/presse/communique-national/journee-mondiale-du-tourisme-bilan-des-emissions-de-ges-du-secteur-du-tourisme-en-france/) | Texte lu sur la [page du ministère de l'Économie](https://www.entreprises.gouv.fr/mobilites-tourisme-durable). ✅ Lu dans le communiqué de l'ADEME, texte copié par Hardy le 07/11 |
| **69 %** dus au transport | « 69% de l'empreinte carbone de nos vacances provient des transports » | Le même communiqué | Infographie de la même page du ministère ; son texte dit « près de 70 % ». ✅ Lu dans le communiqué de l'ADEME, texte copié par Hardy le 07/11 |
| **14 kg contre 2,8 kg** de CO₂e pour 100 km, par personne : voiture thermique moyenne (diesel), une personne à bord, contre TER | Voiture thermique « 14,2 kg CO₂e » pour 100 km ; TER « 27,7 g CO₂e » par km, soit 2,77 kg pour 100 km | [Impact CO2, transport](https://impactco2.fr/outils/transport) et [TER](https://impactco2.fr/outils/transport/ter) | ✅ Lu sur les pages de l'ADEME |

**Pourquoi « à ouvrir » :** les sites `ademe.fr` refusent la lecture automatique (erreur 403). La fiche du rapport sur la [librairie de l'ADEME](https://librairie.ademe.fr/changement-climatique/7637-bilan-des-emissions-de-gaz-a-effet-de-serre-du-secteur-du-tourisme-en-france-en-2022.html) existe, mais son texte ne donne pas ces chiffres.

**À garder en tête :**
- « par personne » : la page du TER ne le précise pas, mais le calculateur d'Impact CO2 annonce un impact « par personne ».
- Le 14,2 kg et le 2,77 kg comptent la construction et l'usage. L'API d'Impact CO2 donne par défaut l'usage seul (11,06 et 2,29 kg) : ne pas les mélanger.
- Limite à dire au jury : l'avantage du train dépend du remplissage de la voiture. Pour 100 km et par personne : 14,2 kg seul, 3,6 kg à quatre, 2,8 kg en TER (`00` § 2). L'application montre aussi la voiture partagée.
- Méthode : « même principe que la SNCF », distance × facteur moyen ; pas « même méthode », car la SNCF retient d'autres facteurs voiture et un autre remplissage. Arguments : `LECONS.md`, dossier CO₂.

**Texte du communiqué de l'ADEME, copié par Hardy le 07/11 :**
> « Le secteur du tourisme en France a émis 97 millions de tonnes de CO2 équivalent en 2022. »
> « Le transport représente 69% de l'empreinte carbone du secteur du tourisme, et le transport aérien 29% à lui seul. »
> « Le secteur du tourisme émet en France 46 millions de tCO2e, soit 11% de l'inventaire national d'émissions de GES. »

**Ne pas mélanger :**
- **11 % :** ils portent sur les 46 Mt émises sur le territoire, pas sur les 97 Mt. La [page du ministère](https://www.entreprises.gouv.fr/mobilites-tourisme-durable) écrit pourtant « soit 11 % » juste après les 97 Mt et ne cite pas les 46 Mt : elle n'est pas citée sur le site. Ces 11 % ne sont pas affichés.
- **Avion :** 29 % de l'empreinte selon l'ADEME. Le ministère écrit « 29 % des distances » et « 44 % des émissions ». Rien sur l'avion n'est affiché.

## La solution
L'application répond à deux questions :
1. « Qu'est-ce que je peux faire autour de moi ? »
2. « Où puis-je aller aujourd'hui en train direct, et qu'y a-t-il à voir ? »

Ordre d'importance des transports : 1. le train · 2. les transports en ville à l'arrivée · 3. la marche depuis la gare.

> **À écrire : les 3 étapes.** La page en demande 3, avec leurs captures, et `00` § 1 à 3 n'en décrit pas. L'ordre des transports ci-dessus n'est pas un parcours.

## Pour qui
> **À écrire.** Rien dans `00` § 1 à 3 (le sujet est traité en `00` § 5, hors de ce que ce brouillon reprend).

## Ce que ça change
> **À écrire.** Rien dans `00` § 1 à 3.

## Conclusion
> Trouver une sortie en 30 secondes, et y aller en train.

Bouton : « Ouvrir l'application ».

---

## One-pager (fiche d'une page, 19/11/2026)

> Texte remis à Claude Design par Hardy, qui en fait le design. **Chiffres mesurés le 19/11** dans la base locale (données du 01/11) et dans `config/`. À relire par Hardy après le design.

**Chiffres corrigés :**

| Ancien texte | Mesuré | Pourquoi |
|---|---|---|
| 268 025 liaisons en train direct | **4 367** liaisons au départ des 196 gares, vers **350 gares** | 268 025 = une ligne par liaison **et par jour** (61 jours) |
| 16 réseaux de bus et tram | **13** réseaux urbains (tram à Dijon et Besançon) + cars Mobigo + **2** vélos en libre-service = **16 réseaux de transport sur place** | Le total est juste, le libellé non |
| « en 30 secondes » (titre) | Jamais mesuré (objectif de `00` § 4) | À mesurer sur l'iPhone (5 essais au chronomètre) avant de l'écrire |
| « 1 à 2 h d'organisation » | Expérience de Hardy, pas une mesure | Gardé pour l'oral, retiré de l'écrit |
| v0.3.1 | Production en 0.4.0 | Numéro en ligne le 03/12 à mettre |

Inchangés et vérifiés : 196 gares, 11 180 lieux affichés, 3 322 photos, 122 gares avec un parking vélo, 14 / 2,8 / 0,3 kg (facteurs 142 / 27,7 / 2,93 g/km), 97 Mt et 69 %. Autres mesures : 3 853 lieux avec une description (après la 0.5.0), 278 avec des horaires (pas mis en avant), descriptions DATAtourisme en anglais 3 825, allemand 3 822.

**Choix de Hardy :** la région dans le titre ; le problème = des sorties à un train de chez soi qu'on ne connaît pas ; « Pour qui » sans « cible principale » ni « célibataire » (la famille = persona, racontée à l'oral) ; étrangers en perspective (l'app est en français seulement) ; « Nos engagements » → « Nos choix », sans « Rien recommandé sans preuve » ; « Photos créditées » sort des fonctionnalités ; « Carte en bulles » → « Carte interactive » ; « Vélo prouvé » → « Vélo depuis la gare ».

**Texte :**
1. **Titre :** Que faire en Bourgogne-Franche-Comté ? *Allez-y en train.* — **Sous-titre :** Ouvrez l'application : elle vous montre ce qu'il y a à faire autour de vous, les trains directs pour y aller et comment vous déplacer sur place.
2. **Chiffres :** 196 gares de la région · 350 gares desservies en train direct · 11 180 lieux à visiter · 3 322 lieux avec photo · 16 réseaux de transport sur place.
3. **Le problème :** Beaucoup de sorties de la région sont à un seul train de chez soi, mais on ne le sait pas. Pour le vérifier, il faut croiser plusieurs sites : horaires, gares, lieux à visiter, bus à l'arrivée. Alors on reprend la voiture. Or le transport pèse 69 % des 97 Mt CO₂e du tourisme en France. — Graphique : Voiture (1 personne) ≈ 14 kg · TER ≈ 2,8 kg · TGV ≈ 0,3 kg ; CO₂e pour 100 km, par personne · ADEME Impact CO2.
4. **Pour qui ?** Tous ceux qui veulent sortir sans voiture. En famille (une sortie du week-end avec les enfants) · À deux ou entre amis (une idée de sortie rapide, depuis sa gare) · Habitants de la région (découvrir les environs sans passer une soirée à s'organiser) · En visite dans la région (que faire ici, aujourd'hui ?) · Préparer un séjour (repérer une destination et ses trains à l'avance).
5. **Fonctionnalités :** Autour de moi (les lieux à visiter près de vous, dès l'ouverture) · Trains directs (toutes les destinations sans correspondance depuis votre gare, aller et retour) · Carte interactive (un aperçu de tous les lieux autour de vous, d'un coup d'œil) · Fiche destination (trains aller et retour, lieux à pied depuis la gare, transports sur place) · Fiche lieu (photo, description, adresse, site officiel, gare la plus proche et trajet à pied) · Transports sur place (bus, tram, cars régionaux et vélos en libre-service près de la gare d'arrivée) · Vélo depuis la gare (proposé seulement quand un parking vélo est signalé près de la gare, 122 gares) · CO₂ et prix (le CO₂ économisé face à la voiture et un prix estimé, toujours signalé comme tel, avec le lien vers la billetterie).
6. **Données ouvertes utilisées :** SNCF (gares de voyageurs) · Horaires SNCF (TER, Intercités, TGV) · Tarifs SNCF (prix estimé) · DATAtourisme · Qualité Tourisme · OpenStreetMap · Wikimedia Commons, Wikidata, Wikipédia · 13 réseaux urbains et cars Mobigo (GTFS) · Vélos en libre-service (GBFS) · Aménagements cyclables · ADEME Impact CO2 · Ministère de la Culture (lieux culturels, festivals) · INSEE, IGN, API Adresse · OpenFreeMap.
7. **Nos choix :** uniquement des trains directs, sans correspondance · votre position n'est jamais enregistrée par Wagoo (ni base, ni journaux, journal d'accès coupé) · un prix toujours présenté comme une estimation · chaque source est citée, jusqu'à l'auteur de chaque photo.
8. **Et après :** l'anglais et l'allemand (DATAtourisme fournit déjà les descriptions en 6 langues), puis d'autres régions : il suffit de changer un paramètre. *À l'oral :* « un paramètre, puis on relance le traitement ».
9. **Pied de page :** wagoo.hardylino.com · Hardy Lino — Défi data.gouv.fr « Tourisme en train » · version en ligne le 03/12.

---

## Historique
| Date | Version | Modification |
|---|---|---|
| 06/11/2026 | 0.1 | Brouillon tiré de `00` § 1 à 3 ; chiffres vérifiés sur les pages sources |
| 06/11/2026 | 0.2 | 14 kg confirmé (Hardy), voiture précisée, règle d'honnêteté chiffrée — D075 |
| 07/11/2026 | 0.3 | 97 Mt et 69 % affichés ; pièges des 11 % et de l'avion notés — D078 |
| 19/11/2026 | 0.4 | One-pager : texte pour Claude Design, chiffres mesurés et corrigés (268 025 → 4 367 et 350 gares ; 16 réseaux de transport sur place ; 30 secondes et 1 à 2 h non mesurés) |
