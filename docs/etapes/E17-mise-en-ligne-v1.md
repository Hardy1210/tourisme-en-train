# E17 — Mise en ligne

> **Priorité :** phase 1 anticipée, phase 2 après le P0 · **Branche :** `etape/E17-mise-en-ligne`
> **Étapes préalables :** aucune pour la phase 1 ; la démo locale d'E16 reste le filet de sécurité · **État :** 🟡 phase 1 en cours
> **Version de la fiche** 2.1 · **Date** 07/11/2026 (audit du 06/11, décision D076)

## Contexte minimal
L'équipe est réduite à Hardy, qui porte aussi l'infrastructure. L'application part sur un VPS séparé géré par Coolify, en Docker Compose, à l'adresse `wagoo.hardylino.com`. Cette pré-production deviendra le déploiement officiel. Le domaine ne dépend que d'`URL_APP` et du réglage Coolify, pour en changer quand la marque sera validée.

## Documents à lire
- `CLAUDE.md` (§ 15)
- `docs/07-contrat-infra.md`
- `infra/README.md`

## Mesures du 06/11 (poste de Hardy)
| Mesure | Résultat |
|---|---|
| Export `pg_dump -Fc` | 18 Mo, en 4 s |
| Restauration dans une base neuve | 5 s |
| Base | 134 Mo (dossier sur disque : 221 à 272 Mo) |
| Dossier `data/` | 106 Mo |
| ETL `gtfs_sncf`, données hors ligne, base de test | Node 141 Mo, PostgreSQL 83 Mo, 23 s |
| Étape la plus gourmande de l'ETL | `contours` : Node 355 Mo |
| Application en `standalone` | 137 Mo après un essai léger ; 200 Mo au plus sur une version classique déjà utilisée ; 50 Mo sur disque |
| Construction Next.js | Passe avec 2 Go et 2 cœurs ; tuée avec 1 Go et 2 cœurs |
| Images Docker | PostGIS 853 Mo, ETL 889 Mo, `node:24-bookworm-slim` 333 Mo, **web 430 Mo** (construite en 151 s sur le poste) |
| Compose de production au repos, après un parcours | Web 95 à 115 Mo, PostgreSQL 30 à 83 Mo |

**Pas mesuré :** Coolify lui-même (sa documentation demande au moins 2 cœurs et 2 Go, et une page d'aide 30 Go de disque au total) et la construction de l'image sur un VPS.

**VPS retenu : 2 cœurs, 4 Go de mémoire, 40 Go de disque.** La construction a besoin de plus de 1 Go, et 2 Go ont suffi seule : avec Coolify, PostgreSQL et l'application en plus, 2 Go ne laissent aucune marge. Les mesures ne départagent pas Hetzner et OVH.

## Risques relevés par l'audit
- **Position dans les journaux :** une requête en échec écrivait ses paramètres, dont `lat` et `lon`, dans le journal (règle 5). Reproduit le 06/11 avec `/api/gares/proches`. ✅ Corrigé (PR #81).
- **Connexion à la base perdue :** aucun gestionnaire d'erreur, donc une erreur non gérée, imprimée en objet brut hors du format JSON, à chaque redémarrage de la base. Trouvé en coupant la base dans le compose de production. ✅ Corrigé au lot 1 : 453 lignes de journal avant, 10 après, sans position ni secret.
- **Construction sans variables :** elle échoue dans Docker, car `lib/env.ts` est lu à la collecte des pages. Avec des valeurs factices à la construction seulement, elle passe, sans base et sans trace de ces valeurs dans le résultat ; les vraies valeurs arrivent au démarrage.
- **`pg_restore --clean` seul :** il plante à cause des extensions de l'image PostGIS, après avoir supprimé les tables. Procédure qui a marché : `infra/README.md`.
- **Journal d'accès du proxy :** d'après le code de Coolify lu le 06/11, le journal d'accès dépend de l'option de statistiques de trafic. `/api/autour` reçoit `lat` et `lon` dans l'adresse : ce journal pourrait enregistrer la position. Ne pas activer l'option, et vérifier sur le VPS qu'il est coupé.
- **Image Docker :** ✅ construite et essayée au lot 1, avec le compose de production complet.

## Phase 1 (anticipée, en cours) : une adresse HTTPS qui marche
**Pourquoi maintenant :** une adresse fixe pour tester sur téléphone et la PWA, et une adresse pour le jury (D076). Aucune tâche planifiée, aucune supervision.

**Ce qui reste dès cette phase :** utilisateur non-root, base fermée, rôles séparés lecture et écriture, migrations, secrets hors de Git, HTTPS, `/api/sante`, redémarrage automatique.

| Lot | Claude Code | Hardy |
|---|---|---|
| 0. Ménage | D076, documents, tickets | Fusionner la PR, retirer Ethan des collaborateurs |
| 1. Dépôt | Correctif du journal avec test, `apps/web/Dockerfile`, `infra/compose.prod.yml`, scripts d'export et de restauration, essai complet en local | Fusionner la PR |
| 2. Serveur | Liste exacte des étapes | Créer le VPS, clé SSH, pare-feu 22, 80, 443 ; installer Coolify et protéger son panneau tout de suite |
| 3. Connexion | Réglages à saisir | Relier GitHub, saisir les secrets et `URL_APP`, ajouter sur Vercel l'enregistrement A `wagoo` vers l'IP |
| 4. Mise en ligne | Commandes de chargement | Copier l'export sur le VPS, déployer, charger la base ; donner le nom de l'hébergeur pour les mentions légales |
| 5. Contrôle | Liste des vérifications | HTTPS, `/api/sante` à 200, base fermée depuis l'extérieur, journal d'accès coupé, installation depuis Safari |

**Lots 0 à 4 ✅ · lot 5 🟡 : preuve sur les journaux et fermeture du panneau restantes.** Le suivi se fait dans les tickets « E17 phase 1 ».

**Essai du lot 1, 06/11, sur le poste, hors VPS :** utilisateur `node`, base sans port publié, compose qui refuse de démarrer sans ses variables, migrations relancées sans effet, 12 242 lieux et 268 025 liaisons restaurés. Routes essayées à 200 : santé, sources, gares proches, destinations, autour, lieux, géocodage, pages, manifest, service worker. Navigateur : 101 sorties depuis Dijon, fiche ouverte, aucune erreur, aucun cookie. Base coupée : santé à 503, route à 500, reprise seule au retour de la base.

### Pas-à-pas des lots 2 à 5 (Hardy, tickets #74 et #75)
1. ✅ PR #82 fusionnée.
2. Créer le VPS : Hetzner ou OVH, Ubuntu LTS, 2 cœurs, 4 Go, 40 Go, avec une clé SSH. Le système est une proposition : suivre la documentation de Coolify si elle demande autre chose.
3. Installer Coolify avec le script officiel (https://coolify.io/docs/start-with-self-hosted) et créer le compte administrateur **tout de suite**. Coolify utilise des ports en plus de 80 et 443 pour son panneau : les vérifier avec Claude Code avant de fermer le pare-feu.
4. Sur Vercel : enregistrement A `wagoo` vers l'IP du VPS.
5. Dans Coolify : relier le dépôt ; type Docker Compose ; dossier de base `/` ; fichier `/infra/compose.prod.yml` ; domaine `https://wagoo.hardylino.com` sur le service `web`, port 3000.
6. Saisir les variables de `infra/.env.prod.example`, avec de nouveaux mots de passe (`openssl rand -hex 24`). **Ne pas activer Traffic Analytics.** **Ne jamais coller un mot de passe dans une conversation.**
7. Prévenir Claude Code : commandes du lot 4 pour charger la base (`infra/README.md`). Lui donner le fournisseur choisi, pour l'hébergeur des mentions légales.
8. Lot 5 : contrôler chaque critère ci-dessous, et installer sur iPhone **depuis Safari**, « Ouvrir comme app web » activé.

### Critères d'acceptation
- [x] HTTPS valide sur `wagoo.hardylino.com` ; `/api/sante` → 200 (07/11).
- [x] Base inaccessible depuis Internet (07/11 : port 5432 fermé vu de l'extérieur, aucun port publié sur le VPS).
- [x] Image web sans droits d'administration (lot 1, en local).
- [ ] Aucune position dans les journaux de l'application ni du proxy.
- [x] Wagoo s'installe sur iPhone depuis Safari et s'ouvre en plein écran (07/11, essai de Hardy : sorties affichées, dernière vue lisible hors ligne).

## Phase 2 (après le P0, si le temps le permet)
| Élément | Si on ne le fait pas avant la soutenance |
|---|---|
| ETL planifié + alerte | Les horaires couvrent jusqu'au 31/12 (mesuré le 06/11), donc la soutenance reste couverte. Mais tout changement d'horaire publié après le chargement n'apparaît pas. Parade : refaire l'export et le recharger à la main |
| Sauvegardes + restauration testée | Si le VPS meurt, le site tombe, mais rien d'unique n'est perdu : la base ne contient que des données publiques et se recharge depuis l'export. La démo locale reste. Risque faible |
| En-têtes de sécurité | L'application fonctionne, mais un scan du jury ou `07` § 6 montre qu'ils manquent. Risque d'image surtout, et travail faible : à faire en premier |
| Limitation d'appels | Un robot pourrait surcharger le petit VPS ou saturer `/api/geocodage`. Risque faible pour un site aussi peu connu |
| Anonymisation des journaux | Sans conséquence tant que le journal d'accès reste coupé, ce que vérifie la phase 1 |

**Planification de l'ETL :** jamais `all` chaque nuit. Les sources une par une sans `osm`, et `osm` une fois par semaine au plus (D041), avec une alerte si le code retour n'est pas 0. **À vérifier dans Coolify :** alerte quand une tâche planifiée échoue, et sauvegarde d'une base déclarée dans un compose.

## À ne pas toucher
- `TZ` dans les conteneurs (`CLAUDE.md` § 3).
- Aucun secret dans Git, aucune position enregistrée.

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route — D025.
- 06/11/2026 : fiche réécrite. L'infrastructure passe à Hardy, et la phase 1 est anticipée sans nouvelle étape — D076.
- 07/11/2026 : mise en ligne sur OVH, 12 242 lieux et 268 025 liaisons retrouvés sur le VPS ; avancement et critères mis à jour — D076.
