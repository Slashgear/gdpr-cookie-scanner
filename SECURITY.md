# Politique de sécurité

## Signaler une vulnérabilité

Si tu découvres une vulnérabilité de sécurité, **ne pas ouvrir d'issue publique**.

Envoie un rapport via [GitHub Security Advisories](https://github.com/Slashgear/gdpr-report/security/advisories/new) en incluant :

- Une description de la vulnérabilité
- Les étapes pour la reproduire
- L'impact potentiel

## Périmètre

Cet outil fait tourner un navigateur Chromium contrôlé sur des URLs fournies par l'utilisateur. Il est conçu pour être exécuté en local ou en environnement CI maîtrisé — ne pas exposer la CLI comme service web sans isolation appropriée.
