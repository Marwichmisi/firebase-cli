---
name: firebase-cli
description: "Manage Firebase Management API via CLI (auth, projects, web-apps, android-apps, ios-apps, operations). Use when user asks to list/update Firebase projects, manage Firebase apps, link analytics, or track long-running Firebase operations."
category: devtools
---

# firebase-cli

## When To Use This Skill

Use the `firebase-cli` skill when you need to:

- List and inspect Firebase projects you can access.
- Find apps attached to a project across web, Android, and iOS.
- Create or update Firebase apps and retrieve config artifacts.
- Enable Firebase on an existing Google Cloud project.
- Link or unlink Google Analytics for a Firebase project.
- Poll long-running Firebase operations until completion.
- Perform scripted workflows with machine-readable JSON output.

## Capabilities

- Authentication lifecycle: set/show/remove/test an OAuth bearer token.
- Project read and discovery: list projects, list available GCP projects, get a project, search apps, get admin config.
- Project mutate flows: update project metadata, add Firebase to a project, add/remove Google Analytics linkage.
- Web app lifecycle: list/get/get-config/create/update/remove/undelete.
- Android app lifecycle: list/get/get-config/create/update/remove/undelete.
- iOS app lifecycle: list/get/get-config/create/update/remove/undelete.
- Operation tracking: get operation state and wait with polling/timeout controls.

## Common Use Cases

- "Liste tous mes projets Firebase en JSON."
- "Ajoute Firebase sur mon projet GCP existant."
- "Crée une Web App dans le projet et récupère sa config."
- "Mets à jour le display name de mon app Android."
- "Supprime puis restaure une app iOS."
- "Lie le projet Firebase avec un compte Google Analytics."
- "Attends la fin d'une opération Firebase et retourne le résultat JSON."

## Setup

If `firebase-cli` is not found, install and build it:
```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli bundle firebase
npx api2cli link firebase
```

`api2cli link` adds `~/.local/bin` to PATH automatically. The CLI is available in the next command.

Always use `--json` flag when calling commands programmatically.

## Working Rules

- Always use `--json` for agent-driven calls so downstream steps can parse the result.
- Start with `--help` if the exact action or flags are unclear instead of guessing.
- Prefer read commands first when you need to inspect current state before mutating data.

## Authentication

```bash
firebase-cli auth set "$(gcloud auth print-access-token)"
firebase-cli auth test
```

Auth commands: `auth set <token>`, `auth show`, `auth remove`, `auth test`

Token is stored in `~/.config/tokens/firebase-cli.txt`.

## Resources

### auth

| Action | Purpose | Key Flags |
|---|---|---|
| `set <token>` | Save OAuth token | none |
| `show` | Show current token (masked by default) | `--raw` |
| `remove` | Delete stored token | none |
| `test` | Validate token with Firebase API call | none |

### projects

| Action | Purpose | Key Flags |
|---|---|---|
| `list` | List accessible Firebase projects | `--page-size <n>`, `--page-token <token>`, `--show-deleted`, `--fields <cols>`, `--json`, `--format <fmt>` |
| `available` | List GCP projects eligible for Firebase enablement | `--page-size <n>`, `--page-token <token>`, `--fields <cols>`, `--json`, `--format <fmt>` |
| `get <project>` | Get a Firebase project | `--json`, `--format <fmt>` |
| `search-apps <project>` | List project apps across platforms | `--page-size <n>`, `--page-token <token>`, `--show-deleted`, `--filter <expr>`, `--fields <cols>`, `--json`, `--format <fmt>` |
| `get-admin-config <project>` | Get Admin SDK config artifact | `--json`, `--format <fmt>` |
| `get-analytics-details <project>` | Get linked Analytics details | `--json`, `--format <fmt>` |
| `update <project>` | Update project metadata | `--display-name <name>`, `--annotations <json>`, `--update-mask <mask>`, `--json`, `--format <fmt>` |
| `add-firebase <project>` | Enable Firebase on existing GCP project | `--location-id <id>`, `--json`, `--format <fmt>` |
| `add-analytics <project>` | Link Analytics account/property | `--analytics-account-id <id>`, `--analytics-property-id <id>`, `--json`, `--format <fmt>` |
| `remove-analytics <project>` | Unlink Analytics from project | `--analytics-property-id <id>`, `--json`, `--format <fmt>` |

### web-apps

| Action | Purpose | Key Flags |
|---|---|---|
| `list <project>` | List Web apps in project | `--page-size <n>`, `--page-token <token>`, `--show-deleted`, `--fields <cols>`, `--json`, `--format <fmt>` |
| `get <app>` | Get a Web app by ID/resource name | `--json`, `--format <fmt>` |
| `get-config <app>` | Get Web app config artifact | `--json`, `--format <fmt>` |
| `create <project>` | Create Web app | `--display-name <name>` (required), `--api-key-id <id>`, `--json`, `--format <fmt>` |
| `update <app>` | Update Web app fields | `--display-name <name>`, `--api-key-id <id>`, `--update-mask <mask>`, `--json`, `--format <fmt>` |
| `remove <app>` | Remove Web app | `--immediate`, `--allow-missing`, `--validate-only`, `--etag <etag>`, `--json`, `--format <fmt>` |
| `undelete <app>` | Restore removed Web app | `--validate-only`, `--etag <etag>`, `--json`, `--format <fmt>` |

### android-apps

| Action | Purpose | Key Flags |
|---|---|---|
| `list <project>` | List Android apps in project | `--page-size <n>`, `--page-token <token>`, `--show-deleted`, `--fields <cols>`, `--json`, `--format <fmt>` |
| `get <app>` | Get Android app by ID/resource name | `--json`, `--format <fmt>` |
| `get-config <app>` | Get Android config artifact | `--json`, `--format <fmt>` |
| `create <project>` | Create Android app | `--package-name <name>` (required), `--display-name <name>`, `--api-key-id <id>`, `--sha1 <hashes>`, `--sha256 <hashes>`, `--json`, `--format <fmt>` |
| `update <app>` | Update Android app fields | `--display-name <name>`, `--api-key-id <id>`, `--sha1 <hashes>`, `--sha256 <hashes>`, `--update-mask <mask>`, `--json`, `--format <fmt>` |
| `remove <app>` | Remove Android app | `--immediate`, `--allow-missing`, `--validate-only`, `--etag <etag>`, `--json`, `--format <fmt>` |
| `undelete <app>` | Restore removed Android app | `--validate-only`, `--etag <etag>`, `--json`, `--format <fmt>` |

### ios-apps

| Action | Purpose | Key Flags |
|---|---|---|
| `list <project>` | List iOS apps in project | `--page-size <n>`, `--page-token <token>`, `--show-deleted`, `--fields <cols>`, `--json`, `--format <fmt>` |
| `get <app>` | Get iOS app by ID/resource name | `--json`, `--format <fmt>` |
| `get-config <app>` | Get iOS config artifact | `--json`, `--format <fmt>` |
| `create <project>` | Create iOS app | `--bundle-id <id>` (required), `--display-name <name>`, `--app-store-id <id>`, `--team-id <id>`, `--api-key-id <id>`, `--json`, `--format <fmt>` |
| `update <app>` | Update iOS app fields | `--display-name <name>`, `--api-key-id <id>`, `--app-store-id <id>`, `--team-id <id>`, `--update-mask <mask>`, `--json`, `--format <fmt>` |
| `remove <app>` | Remove iOS app | `--immediate`, `--allow-missing`, `--validate-only`, `--etag <etag>`, `--json`, `--format <fmt>` |
| `undelete <app>` | Restore removed iOS app | `--validate-only`, `--etag <etag>`, `--json`, `--format <fmt>` |

### operations

| Action | Purpose | Key Flags |
|---|---|---|
| `get <name>` | Get current state of an operation | `--json`, `--format <fmt>` |
| `wait <name>` | Poll until operation is done | `--interval-ms <ms>`, `--timeout-ms <ms>`, `--no-progress`, `--json`, `--format <fmt>` |

## Output Format

`--json` returns a standardized envelope:
```json
{ "ok": true, "data": { ... } }
```

For list-like outputs, `meta.total` may be included.

On error:
```json
{ "ok": false, "error": { "code": 1, "message": "...", "suggestion": "..." } }
```

## Quick Reference

```bash
firebase-cli --help                    # List all resources and global flags
firebase-cli <resource> --help         # List all actions for a resource
firebase-cli <resource> <action> --help # Show flags for a specific action
firebase-cli projects list --json      # Validation command (read-only)
```

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error
