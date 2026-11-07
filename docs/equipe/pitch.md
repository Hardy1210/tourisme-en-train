# Pitch : textes de la page « L'âme du produit »

> **État : BROUILLON, à valider par Hardy.** Rien de cette page n'est encore affiché dans l'application.
> **Version** 0.3 · **Date** 07/11/2026
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

## Historique
| Date | Version | Modification |
|---|---|---|
| 06/11/2026 | 0.1 | Brouillon tiré de `00` § 1 à 3 ; chiffres vérifiés sur les pages sources |
| 06/11/2026 | 0.2 | 14 kg confirmé (Hardy), voiture précisée, règle d'honnêteté chiffrée — D075 |
| 07/11/2026 | 0.3 | 97 Mt et 69 % affichés ; pièges des 11 % et de l'avion notés — D078 |
