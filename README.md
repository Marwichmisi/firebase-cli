# firebase-cli

CLI for the Firebase Management API. Made with [api2cli.dev](https://api2cli.dev).

## Install

```bash
npx api2cli install <user>/firebase-cli
```

This clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill to your coding agents.

## Install AgentSkill only

```bash
npx skills add <user>/firebase-cli
```

## Usage

```bash
firebase-cli auth set "$(gcloud auth print-access-token)"
firebase-cli auth test
firebase-cli --help
```

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

## Quick Reference

```bash
firebase-cli --help
firebase-cli projects --help
firebase-cli projects list --help
firebase-cli projects list --json
firebase-cli operations wait operations/my-op-id --interval-ms 1000 --timeout-ms 300000 --json
```

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

## Testing

```bash
bun run build
bun run test
```

The test suite contains command-surface smoke tests to ensure critical commands stay available.
