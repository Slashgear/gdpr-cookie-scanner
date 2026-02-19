# gdpr-cookie-scanner

CLI pour auditer automatiquement la conformité RGPD d'un site web : modale de consentement, dark patterns, cookies déposés avant/après interaction, trackers réseau. Produit un rapport Markdown détaillé.

## Installation

```bash
# Installer les dépendances
pnpm install

# Installer les navigateurs Playwright (uniquement au premier setup)
npx playwright install chromium

# Compiler
pnpm build
```

## Usage

```bash
node dist/cli.js scan <url> [options]
```

### Options

| Option                  | Défaut           | Description                            |
| ----------------------- | ---------------- | -------------------------------------- |
| `-o, --output <dir>`    | `./gdpr-reports` | Répertoire de sortie du rapport        |
| `-t, --timeout <ms>`    | `30000`          | Timeout de navigation                  |
| `--no-screenshots`      | —                | Désactive les captures d'écran         |
| `-l, --locale <locale>` | `fr-FR`          | Locale du navigateur                   |
| `-v, --verbose`         | —                | Affiche la stack trace en cas d'erreur |

### Exemples

```bash
# Scan basique
node dist/cli.js scan https://example.com

# Avec répertoire de sortie personnalisé
node dist/cli.js scan https://example.com -o ./rapports

# Scan en anglais, sans screenshots
node dist/cli.js scan https://example.com --locale en-US --no-screenshots

# Voir la base de trackers intégrée
node dist/cli.js list-trackers
```

## Comment ça fonctionne

Le scanner exécute **4 phases** avec un vrai navigateur Chromium (Playwright) :

1. **Chargement initial** — La page est chargée sans aucune interaction. Tous les cookies et requêtes réseau sont capturés (`before-interaction`).
2. **Analyse de la modale** — La bannière de consentement est détectée (sélecteurs CSS des CMP connus + heuristiques DOM). Les boutons sont extraits avec leurs propriétés visuelles (taille, couleur, ratio de contraste).
3. **Test du refus** — Le bouton « Refuser » est cliqué. Les cookies et requêtes sont capturés (`after-reject`).
4. **Test de l'acceptation** — Une nouvelle session navigateur (état vierge) charge la page et clique « Accepter ». Les cookies et requêtes sont capturés (`after-accept`).

## Rapport généré

Le rapport Markdown contient :

- **Score global** (0–100) et **note** A/B/C/D/F
- Résumé exécutif
- Analyse de la modale : boutons, cases à cocher, taille de police, captures d'écran
- Dark patterns détectés (bouton refus absent, asymétrie visuelle, cases pré-cochées, formulations trompeuses…)
- Tableau des cookies avant interaction, après refus, après acceptation
- Requêtes réseau trackers par phase
- Recommandations ciblées
- Références légales (RGPD, directive ePrivacy, lignes directrices CEPD, CNIL 2022)

Le fichier est créé sous : `<output-dir>/gdpr-report-<domaine>-<date>.md`

## Scoring

Le score est composé de 4 critères (25 points chacun) :

| Critère                      | Ce qui est évalué                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Validité du consentement** | Cases pré-cochées, formulations ambiguës, informations manquantes                                      |
| **Facilité de refus**        | Bouton refus absent ou enterré, asymétrie de clics, asymétrie visuelle                                 |
| **Transparence**             | Contrôles granulaires, mention des finalités / tiers / durée / droit de retrait                        |
| **Comportement des cookies** | Cookies non essentiels avant consentement, cookies persistant après refus, trackers avant consentement |

**Grille de notes :** A ≥ 90 · B ≥ 75 · C ≥ 55 · D ≥ 35 · F < 35

Le processus termine avec le code de sortie `1` si la note est F, `2` en cas d'erreur de scan.

## Dark patterns détectés

| Type                    | Sévérité               | Description                                             |
| ----------------------- | ---------------------- | ------------------------------------------------------- |
| `no-reject-button`      | Critique               | Aucune option de refus dans la modale                   |
| `buried-reject`         | Critique               | Bouton refus absent au premier niveau                   |
| `click-asymmetry`       | Critique               | Refuser nécessite plus de clics qu'accepter             |
| `pre-ticked`            | Critique               | Cases pré-cochées (invalide selon RGPD Considérant 32)  |
| `auto-consent`          | Critique               | Cookies/trackers non essentiels avant tout consentement |
| `asymmetric-prominence` | Avertissement          | Bouton accepter nettement plus grand que refuser        |
| `nudging`               | Avertissement          | Police du bouton accepter plus grande que refuser       |
| `misleading-wording`    | Avertissement/Critique | Libellés ambigus (« OK », « Continuer »…)               |
| `missing-info`          | Avertissement          | Informations obligatoires absentes du texte             |

## CMPs reconnues automatiquement

Axeptio, Cookiebot, OneTrust, Didomi, Tarteaucitron, Usercentrics, et une vingtaine d'autres via leurs sélecteurs CSS spécifiques. Un fallback heuristique (élément fixe/sticky avec texte cookie-related) couvre les banières custom.

## Développement

```bash
pnpm dev          # Compilation en mode watch
pnpm typecheck    # Vérification des types sans compilation
pnpm lint         # ESLint
pnpm test         # Jest
```
