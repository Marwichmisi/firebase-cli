# firebase-cli

CLI for the firebase API. Made with [api2cli.dev](https://api2cli.dev).

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
firebase-cli auth set "your-token"
firebase-cli auth test
firebase-cli --help
```

## Resources

Run `firebase-cli --help` to see available resources.

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`
