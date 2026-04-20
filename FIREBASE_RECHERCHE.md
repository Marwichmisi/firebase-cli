# Recherche Firebase Management API (demarrage)

Date: 2026-04-20

## Objectif

Lancer un firebase-cli utile des maintenant, base sur la Firebase Management API.

## Constat de recherche

- Registre api2cli: aucun package trouve pour firebase ou firebase-cli.
- API cible retenue: Firebase Management API v1beta1.
- Endpoint de service: https://firebase.googleapis.com
- Discovery document: https://firebase.googleapis.com/$discovery/rest?version=v1beta1
- Auth: OAuth2 (Bearer token) avec scopes Google.

## Scopes OAuth observes

- https://www.googleapis.com/auth/firebase
- https://www.googleapis.com/auth/firebase.readonly
- https://www.googleapis.com/auth/cloud-platform
- https://www.googleapis.com/auth/cloud-platform.read-only

## Ressources importantes identifiees

- projects
  - list, get, searchApps, getAdminSdkConfig, addFirebase, patch
- availableProjects
  - list
- projects.webApps
  - list, get, getConfig, create, patch, remove, undelete
- projects.androidApps
  - list, get, getConfig, create, patch, remove, undelete
- projects.iosApps
  - list, get, getConfig, create, patch, remove, undelete
- operations
  - get

## Ce qui a ete commence dans le code

- Ressource projects:
  - list
  - available
  - get
  - search-apps
  - get-admin-config
  - get-analytics-details
  - update
  - add-firebase
  - add-analytics
  - remove-analytics
- Ressource web-apps:
  - list
  - get
  - get-config
  - create
  - update
  - remove
  - undelete
- Ressource android-apps:
  - list
  - get
  - get-config
  - create
  - update
  - remove
  - undelete
- Ressource ios-apps:
  - list
  - get
  - get-config
  - create
  - update
  - remove
  - undelete
- Ressource operations:
  - get
  - wait
- Auth test:
  - appel de verification sur /v1beta1/projects?pageSize=1

## Validation locale executee

- build Bun: OK
- tests smoke Bun: OK

## Skill finalise

- Fichier complete sans placeholders: skills/firebase-cli/SKILL.md
- Tables de commandes remplies avec actions et flags reels
- Exemples Quick Reference verifies via:
  - bun dist/index.js projects --help
  - bun dist/index.js operations wait --help

## README harmonise

- README aligne sur la structure du SKILL (tables par ressource et actions)
- Commandes de reference ajoutees pour projects, web-apps, operations
- Validation executee apres MAJ:
  - bun run build
  - bun run test
  - bun dist/index.js web-apps update --help

## Prochaines etapes recommandees

1. Ajouter les commandes de mutation avancees:
   - patch, remove, undelete pour web-apps, android-apps, ios-apps
2. Ajouter projects add-firebase et projects add/remove-analytics
3. Ajouter polling operation wait dans operations
4. Completer skills/firebase-cli/SKILL.md avec introspection --help
5. Ajouter tests d integration CLI (a minima smoke tests JSON)
