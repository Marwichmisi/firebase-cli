#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { projectsResource } from "./resources/projects.js";
import { webAppsResource } from "./resources/webApps.js";
import { androidAppsResource } from "./resources/androidApps.js";
import { iosAppsResource } from "./resources/iosApps.js";
import { operationsResource } from "./resources/operations.js";

const program = new Command();

program
  .name("firebase-cli")
  .description("CLI for the firebase API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

// Built-in commands
program.addCommand(authCommand);

// Firebase resources
program.addCommand(projectsResource);
program.addCommand(webAppsResource);
program.addCommand(androidAppsResource);
program.addCommand(iosAppsResource);
program.addCommand(operationsResource);

program.parse();
