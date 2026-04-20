import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";
import { log } from "../lib/logger.js";

interface CommonOpts {
  json?: boolean;
  format?: string;
}

interface WaitOpts extends CommonOpts {
  intervalMs?: string;
  timeoutMs?: string;
  progress?: boolean;
}

function parsePositiveInt(raw: string | undefined, fallback: number, label: string): number {
  const value = Number(raw ?? String(fallback));
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new CliError(2, `Invalid ${label}.`, `Provide a positive integer for ${label}.`);
  }
  return value;
}

function toOperationRef(name: string): string {
  return name.startsWith("operations/") ? name : `operations/${name}`;
}

export const operationsResource = new Command("operations").description(
  "Inspect long-running Firebase operations",
);

operationsResource
  .command("get")
  .description("Get the latest state of a long-running operation")
  .argument("<name>", "Operation name, with or without the operations/ prefix")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli operations get operations/project-12345/operation-6789\n  firebase-cli operations get project-12345/operation-6789 --json",
  )
  .action(async (name: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toOperationRef(name)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

operationsResource
  .command("wait")
  .description("Poll a long-running operation until it is done")
  .argument("<name>", "Operation name, with or without the operations/ prefix")
  .option("--interval-ms <ms>", "Polling interval in milliseconds", "2000")
  .option("--timeout-ms <ms>", "Max time to wait in milliseconds", "120000")
  .option("--no-progress", "Disable polling progress logs")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli operations wait operations/project-12345/operation-6789\n  firebase-cli operations wait project-12345/operation-6789 --interval-ms 1000 --timeout-ms 300000 --json",
  )
  .action(async (name: string, opts: WaitOpts) => {
    try {
      const intervalMs = parsePositiveInt(opts.intervalMs, 2000, "--interval-ms");
      const timeoutMs = parsePositiveInt(opts.timeoutMs, 120000, "--timeout-ms");
      const startedAt = Date.now();
      const operationRef = toOperationRef(name);

      while (true) {
        const data = (await client.get(`/v1beta1/${operationRef}`)) as Record<string, unknown>;
        if (data.done === true) {
          output(data, { json: opts.json, format: opts.format });
          return;
        }

        const elapsed = Date.now() - startedAt;
        if (elapsed >= timeoutMs) {
          throw new CliError(
            1,
            `Operation is still running after ${timeoutMs}ms.`,
            "Increase --timeout-ms or call operations get later.",
          );
        }

        if (opts.progress !== false && !opts.json && opts.format !== "json") {
          log.info(`Operation not done yet. Elapsed: ${elapsed}ms. Next poll in ${intervalMs}ms...`);
        }

        await Bun.sleep(intervalMs);
      }
    } catch (err) {
      handleError(err, opts.json);
    }
  });
