import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";
import { log } from "../lib/logger.js";

interface ListWebAppsResponse {
  apps?: unknown[];
  nextPageToken?: string;
}

interface CommonOpts {
  json?: boolean;
  format?: string;
  fields?: string;
}

interface ListOpts extends CommonOpts {
  pageSize?: string;
  pageToken?: string;
  showDeleted?: boolean;
}

interface CreateOpts {
  displayName: string;
  apiKeyId?: string;
  json?: boolean;
  format?: string;
}

interface UpdateOpts extends CommonOpts {
  displayName?: string;
  apiKeyId?: string;
  updateMask?: string;
}

interface RemoveOpts extends CommonOpts {
  immediate?: boolean;
  allowMissing?: boolean;
  validateOnly?: boolean;
  etag?: string;
}

interface UndeleteOpts extends CommonOpts {
  validateOnly?: boolean;
  etag?: string;
}

function toProjectRef(project: string): string {
  return project.startsWith("projects/") ? project : `projects/${project}`;
}

function toWebAppRef(app: string): string {
  if (app.startsWith("projects/") && app.includes("/webApps/")) return app;
  return `projects/-/webApps/${app}`;
}

function parseFields(fields?: string): string[] | undefined {
  if (!fields) return undefined;
  const parsed = fields
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

function wantsJson(opts: CommonOpts): boolean {
  return Boolean(opts.json || opts.format === "json");
}

export const webAppsResource = new Command("web-apps").description(
  "Manage Firebase Web apps",
);

webAppsResource
  .command("list")
  .description("List Web apps in a Firebase project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--page-size <n>", "Maximum number of apps to return", "50")
  .option("--page-token <token>", "Token returned from a previous list call")
  .option("--show-deleted", "Include apps in DELETED state")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli web-apps list my-project-id\n  firebase-cli web-apps list my-project-id --json",
  )
  .action(async (project: string, opts: ListOpts) => {
    try {
      const data = (await client.get(`/v1beta1/${toProjectRef(project)}/webApps`, {
        pageSize: opts.pageSize ?? "50",
        ...(opts.pageToken && { pageToken: opts.pageToken }),
        ...(opts.showDeleted !== undefined && { showDeleted: String(opts.showDeleted) }),
      })) as ListWebAppsResponse;

      const rows = Array.isArray(data.apps) ? data.apps : [];
      if (wantsJson(opts)) {
        output({ apps: rows, nextPageToken: data.nextPageToken ?? null }, { json: true });
      } else {
        output(rows, { format: opts.format, fields: parseFields(opts.fields) });
        if (data.nextPageToken) {
          log.info(`Next page token: ${data.nextPageToken}`);
        }
      }
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webAppsResource
  .command("get")
  .description("Get a Web app by resource name or app ID")
  .argument("<app>", "App resource name (projects/*/webApps/*) or app ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli web-apps get 1:123456:web:abc\n  firebase-cli web-apps get projects/my-project-id/webApps/1:123456:web:abc",
  )
  .action(async (app: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toWebAppRef(app)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webAppsResource
  .command("get-config")
  .description("Get the config object for a Web app")
  .argument("<app>", "App resource name (projects/*/webApps/*) or app ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli web-apps get-config 1:123456:web:abc\n  firebase-cli web-apps get-config projects/my-project-id/webApps/1:123456:web:abc --json",
  )
  .action(async (app: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toWebAppRef(app)}/config`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webAppsResource
  .command("create")
  .description("Create a Web app in a Firebase project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .requiredOption("--display-name <name>", "Display name for the Web app")
  .option("--api-key-id <id>", "Existing API key UID to attach")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli web-apps create my-project-id --display-name \"Web App\"\n  firebase-cli web-apps create my-project-id --display-name \"Web App\" --json",
  )
  .action(async (project: string, opts: CreateOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toProjectRef(project)}/webApps`, {
        displayName: opts.displayName,
        ...(opts.apiKeyId && { apiKeyId: opts.apiKeyId }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webAppsResource
  .command("update")
  .description("Update mutable attributes of a Web app")
  .argument("<app>", "App resource name (projects/*/webApps/*) or app ID")
  .option("--display-name <name>", "New display name")
  .option("--api-key-id <id>", "New API key UID")
  .option("--update-mask <mask>", "Explicit update mask, e.g. displayName,apiKeyId")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli web-apps update 1:123456:web:abc --display-name \"New Name\"\n  firebase-cli web-apps update projects/my-project/webApps/1:123456:web:abc --api-key-id my-key --json",
  )
  .action(async (app: string, opts: UpdateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      const autoMask: string[] = [];

      if (opts.displayName) {
        body.displayName = opts.displayName;
        autoMask.push("displayName");
      }

      if (opts.apiKeyId) {
        body.apiKeyId = opts.apiKeyId;
        autoMask.push("apiKeyId");
      }

      const updateMask = opts.updateMask ?? autoMask.join(",");
      if (!updateMask) {
        throw new CliError(
          2,
          "No update field provided.",
          "Use --display-name, --api-key-id, or provide --update-mask.",
        );
      }

      const data = await client.patch(
        `/v1beta1/${toWebAppRef(app)}?${new URLSearchParams({ updateMask }).toString()}`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webAppsResource
  .command("remove")
  .description("Remove a Web app from a Firebase project")
  .argument("<app>", "App resource name (projects/*/webApps/*) or app ID")
  .option("--immediate", "Delete permanently instead of soft delete")
  .option("--allow-missing", "Succeed even if app is not found")
  .option("--validate-only", "Validate request without applying")
  .option("--etag <etag>", "Etag for optimistic concurrency")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli web-apps remove 1:123456:web:abc\n  firebase-cli web-apps remove 1:123456:web:abc --validate-only --json",
  )
  .action(async (app: string, opts: RemoveOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toWebAppRef(app)}:remove`, {
        ...(opts.immediate !== undefined && { immediate: opts.immediate }),
        ...(opts.allowMissing !== undefined && { allowMissing: opts.allowMissing }),
        ...(opts.validateOnly !== undefined && { validateOnly: opts.validateOnly }),
        ...(opts.etag && { etag: opts.etag }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webAppsResource
  .command("undelete")
  .description("Restore a previously removed Web app")
  .argument("<app>", "App resource name (projects/*/webApps/*) or app ID")
  .option("--validate-only", "Validate request without applying")
  .option("--etag <etag>", "Etag for optimistic concurrency")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli web-apps undelete 1:123456:web:abc\n  firebase-cli web-apps undelete 1:123456:web:abc --json",
  )
  .action(async (app: string, opts: UndeleteOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toWebAppRef(app)}:undelete`, {
        ...(opts.validateOnly !== undefined && { validateOnly: opts.validateOnly }),
        ...(opts.etag && { etag: opts.etag }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
