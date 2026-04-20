import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";
import { log } from "../lib/logger.js";

interface ListIosAppsResponse {
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
  bundleId: string;
  displayName?: string;
  appStoreId?: string;
  teamId?: string;
  apiKeyId?: string;
  json?: boolean;
  format?: string;
}

interface UpdateOpts extends CommonOpts {
  displayName?: string;
  apiKeyId?: string;
  appStoreId?: string;
  teamId?: string;
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

function toIosAppRef(app: string): string {
  if (app.startsWith("projects/") && app.includes("/iosApps/")) return app;
  return `projects/-/iosApps/${app}`;
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

export const iosAppsResource = new Command("ios-apps").description(
  "Manage Firebase iOS apps",
);

iosAppsResource
  .command("list")
  .description("List iOS apps in a Firebase project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--page-size <n>", "Maximum number of apps to return", "50")
  .option("--page-token <token>", "Token returned from a previous list call")
  .option("--show-deleted", "Include apps in DELETED state")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli ios-apps list my-project-id\n  firebase-cli ios-apps list my-project-id --json",
  )
  .action(async (project: string, opts: ListOpts) => {
    try {
      const data = (await client.get(`/v1beta1/${toProjectRef(project)}/iosApps`, {
        pageSize: opts.pageSize ?? "50",
        ...(opts.pageToken && { pageToken: opts.pageToken }),
        ...(opts.showDeleted !== undefined && { showDeleted: String(opts.showDeleted) }),
      })) as ListIosAppsResponse;

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

iosAppsResource
  .command("get")
  .description("Get an iOS app by resource name or app ID")
  .argument("<app>", "App resource name (projects/*/iosApps/*) or app ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli ios-apps get 1:123456:ios:abc\n  firebase-cli ios-apps get projects/my-project-id/iosApps/1:123456:ios:abc",
  )
  .action(async (app: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toIosAppRef(app)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

iosAppsResource
  .command("get-config")
  .description("Get the GoogleService-Info.plist config for an iOS app")
  .argument("<app>", "App resource name (projects/*/iosApps/*) or app ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli ios-apps get-config 1:123456:ios:abc\n  firebase-cli ios-apps get-config projects/my-project-id/iosApps/1:123456:ios:abc --json",
  )
  .action(async (app: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toIosAppRef(app)}/config`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

iosAppsResource
  .command("create")
  .description("Create an iOS app in a Firebase project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .requiredOption("--bundle-id <id>", "iOS bundle ID, e.g. com.example.app")
  .option("--display-name <name>", "Display name for the iOS app")
  .option("--app-store-id <id>", "Apple App Store ID")
  .option("--team-id <id>", "Apple Developer Team ID")
  .option("--api-key-id <id>", "Existing API key UID to attach")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli ios-apps create my-project-id --bundle-id com.acme.ios --display-name \"Acme iOS\"\n  firebase-cli ios-apps create my-project-id --bundle-id com.acme.ios --json",
  )
  .action(async (project: string, opts: CreateOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toProjectRef(project)}/iosApps`, {
        bundleId: opts.bundleId,
        ...(opts.displayName && { displayName: opts.displayName }),
        ...(opts.appStoreId && { appStoreId: opts.appStoreId }),
        ...(opts.teamId && { teamId: opts.teamId }),
        ...(opts.apiKeyId && { apiKeyId: opts.apiKeyId }),
      });

      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

iosAppsResource
  .command("update")
  .description("Update mutable attributes of an iOS app")
  .argument("<app>", "App resource name (projects/*/iosApps/*) or app ID")
  .option("--display-name <name>", "New display name")
  .option("--api-key-id <id>", "New API key UID")
  .option("--app-store-id <id>", "Apple App Store ID")
  .option("--team-id <id>", "Apple Developer Team ID")
  .option("--update-mask <mask>", "Explicit update mask")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli ios-apps update 1:123456:ios:abc --display-name \"New Name\"\n  firebase-cli ios-apps update 1:123456:ios:abc --app-store-id 123456789 --json",
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

      if (opts.appStoreId) {
        body.appStoreId = opts.appStoreId;
        autoMask.push("appStoreId");
      }

      if (opts.teamId) {
        body.teamId = opts.teamId;
        autoMask.push("teamId");
      }

      const updateMask = opts.updateMask ?? autoMask.join(",");
      if (!updateMask) {
        throw new CliError(
          2,
          "No update field provided.",
          "Use --display-name, --api-key-id, --app-store-id, --team-id, or --update-mask.",
        );
      }

      const data = await client.patch(
        `/v1beta1/${toIosAppRef(app)}?${new URLSearchParams({ updateMask }).toString()}`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

iosAppsResource
  .command("remove")
  .description("Remove an iOS app from a Firebase project")
  .argument("<app>", "App resource name (projects/*/iosApps/*) or app ID")
  .option("--immediate", "Delete permanently instead of soft delete")
  .option("--allow-missing", "Succeed even if app is not found")
  .option("--validate-only", "Validate request without applying")
  .option("--etag <etag>", "Etag for optimistic concurrency")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli ios-apps remove 1:123456:ios:abc\n  firebase-cli ios-apps remove 1:123456:ios:abc --validate-only --json",
  )
  .action(async (app: string, opts: RemoveOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toIosAppRef(app)}:remove`, {
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

iosAppsResource
  .command("undelete")
  .description("Restore a previously removed iOS app")
  .argument("<app>", "App resource name (projects/*/iosApps/*) or app ID")
  .option("--validate-only", "Validate request without applying")
  .option("--etag <etag>", "Etag for optimistic concurrency")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli ios-apps undelete 1:123456:ios:abc\n  firebase-cli ios-apps undelete 1:123456:ios:abc --json",
  )
  .action(async (app: string, opts: UndeleteOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toIosAppRef(app)}:undelete`, {
        ...(opts.validateOnly !== undefined && { validateOnly: opts.validateOnly }),
        ...(opts.etag && { etag: opts.etag }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
