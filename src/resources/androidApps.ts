import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";
import { log } from "../lib/logger.js";

interface ListAndroidAppsResponse {
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
  packageName: string;
  displayName?: string;
  apiKeyId?: string;
  sha1?: string;
  sha256?: string;
  json?: boolean;
  format?: string;
}

interface UpdateOpts extends CommonOpts {
  displayName?: string;
  apiKeyId?: string;
  sha1?: string;
  sha256?: string;
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

function toAndroidAppRef(app: string): string {
  if (app.startsWith("projects/") && app.includes("/androidApps/")) return app;
  return `projects/-/androidApps/${app}`;
}

function parseFields(fields?: string): string[] | undefined {
  if (!fields) return undefined;
  const parsed = fields
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

function splitHashes(hashes?: string): string[] | undefined {
  if (!hashes) return undefined;
  const values = hashes
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function wantsJson(opts: CommonOpts): boolean {
  return Boolean(opts.json || opts.format === "json");
}

export const androidAppsResource = new Command("android-apps").description(
  "Manage Firebase Android apps",
);

androidAppsResource
  .command("list")
  .description("List Android apps in a Firebase project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--page-size <n>", "Maximum number of apps to return", "50")
  .option("--page-token <token>", "Token returned from a previous list call")
  .option("--show-deleted", "Include apps in DELETED state")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli android-apps list my-project-id\n  firebase-cli android-apps list my-project-id --json",
  )
  .action(async (project: string, opts: ListOpts) => {
    try {
      const data = (await client.get(`/v1beta1/${toProjectRef(project)}/androidApps`, {
        pageSize: opts.pageSize ?? "50",
        ...(opts.pageToken && { pageToken: opts.pageToken }),
        ...(opts.showDeleted !== undefined && { showDeleted: String(opts.showDeleted) }),
      })) as ListAndroidAppsResponse;

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

androidAppsResource
  .command("get")
  .description("Get an Android app by resource name or app ID")
  .argument("<app>", "App resource name (projects/*/androidApps/*) or app ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli android-apps get 1:123456:android:abc\n  firebase-cli android-apps get projects/my-project-id/androidApps/1:123456:android:abc",
  )
  .action(async (app: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toAndroidAppRef(app)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

androidAppsResource
  .command("get-config")
  .description("Get the google-services.json config for an Android app")
  .argument("<app>", "App resource name (projects/*/androidApps/*) or app ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli android-apps get-config 1:123456:android:abc\n  firebase-cli android-apps get-config projects/my-project-id/androidApps/1:123456:android:abc --json",
  )
  .action(async (app: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toAndroidAppRef(app)}/config`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

androidAppsResource
  .command("create")
  .description("Create an Android app in a Firebase project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .requiredOption("--package-name <name>", "Android package name, e.g. com.example.app")
  .option("--display-name <name>", "Display name for the Android app")
  .option("--api-key-id <id>", "Existing API key UID to attach")
  .option("--sha1 <hashes>", "Comma-separated SHA-1 certificate fingerprints")
  .option("--sha256 <hashes>", "Comma-separated SHA-256 certificate fingerprints")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli android-apps create my-project-id --package-name com.acme.app --display-name \"Acme Android\"\n  firebase-cli android-apps create my-project-id --package-name com.acme.app --sha1 a1,b2 --json",
  )
  .action(async (project: string, opts: CreateOpts) => {
    try {
      const sha1Hashes = splitHashes(opts.sha1);
      const sha256Hashes = splitHashes(opts.sha256);

      const data = await client.post(`/v1beta1/${toProjectRef(project)}/androidApps`, {
        packageName: opts.packageName,
        ...(opts.displayName && { displayName: opts.displayName }),
        ...(opts.apiKeyId && { apiKeyId: opts.apiKeyId }),
        ...(sha1Hashes && { sha1Hashes }),
        ...(sha256Hashes && { sha256Hashes }),
      });

      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

androidAppsResource
  .command("update")
  .description("Update mutable attributes of an Android app")
  .argument("<app>", "App resource name (projects/*/androidApps/*) or app ID")
  .option("--display-name <name>", "New display name")
  .option("--api-key-id <id>", "New API key UID")
  .option("--sha1 <hashes>", "Comma-separated SHA-1 certificate fingerprints")
  .option("--sha256 <hashes>", "Comma-separated SHA-256 certificate fingerprints")
  .option("--update-mask <mask>", "Explicit update mask")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli android-apps update 1:123456:android:abc --display-name \"New Name\"\n  firebase-cli android-apps update 1:123456:android:abc --sha1 aa,bb --json",
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

      const sha1Hashes = splitHashes(opts.sha1);
      if (sha1Hashes) {
        body.sha1Hashes = sha1Hashes;
        autoMask.push("sha1Hashes");
      }

      const sha256Hashes = splitHashes(opts.sha256);
      if (sha256Hashes) {
        body.sha256Hashes = sha256Hashes;
        autoMask.push("sha256Hashes");
      }

      const updateMask = opts.updateMask ?? autoMask.join(",");
      if (!updateMask) {
        throw new CliError(
          2,
          "No update field provided.",
          "Use one of --display-name, --api-key-id, --sha1, --sha256, or --update-mask.",
        );
      }

      const data = await client.patch(
        `/v1beta1/${toAndroidAppRef(app)}?${new URLSearchParams({ updateMask }).toString()}`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

androidAppsResource
  .command("remove")
  .description("Remove an Android app from a Firebase project")
  .argument("<app>", "App resource name (projects/*/androidApps/*) or app ID")
  .option("--immediate", "Delete permanently instead of soft delete")
  .option("--allow-missing", "Succeed even if app is not found")
  .option("--validate-only", "Validate request without applying")
  .option("--etag <etag>", "Etag for optimistic concurrency")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli android-apps remove 1:123456:android:abc\n  firebase-cli android-apps remove 1:123456:android:abc --validate-only --json",
  )
  .action(async (app: string, opts: RemoveOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toAndroidAppRef(app)}:remove`, {
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

androidAppsResource
  .command("undelete")
  .description("Restore a previously removed Android app")
  .argument("<app>", "App resource name (projects/*/androidApps/*) or app ID")
  .option("--validate-only", "Validate request without applying")
  .option("--etag <etag>", "Etag for optimistic concurrency")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli android-apps undelete 1:123456:android:abc\n  firebase-cli android-apps undelete 1:123456:android:abc --json",
  )
  .action(async (app: string, opts: UndeleteOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toAndroidAppRef(app)}:undelete`, {
        ...(opts.validateOnly !== undefined && { validateOnly: opts.validateOnly }),
        ...(opts.etag && { etag: opts.etag }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
