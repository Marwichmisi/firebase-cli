import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";
import { log } from "../lib/logger.js";

interface ListProjectsResponse {
  results?: unknown[];
  nextPageToken?: string;
}

interface ListAvailableProjectsResponse {
  projectInfo?: unknown[];
  nextPageToken?: string;
}

interface SearchAppsResponse {
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

interface SearchAppsOpts extends ListOpts {
  filter?: string;
}

interface UpdateProjectOpts extends CommonOpts {
  displayName?: string;
  annotations?: string;
  updateMask?: string;
}

interface AddFirebaseOpts extends CommonOpts {
  locationId?: string;
}

interface AddAnalyticsOpts extends CommonOpts {
  analyticsAccountId?: string;
  analyticsPropertyId?: string;
}

interface RemoveAnalyticsOpts extends CommonOpts {
  analyticsPropertyId?: string;
}

function toProjectRef(project: string): string {
  return project.startsWith("projects/") ? project : `projects/${project}`;
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

function outputList(
  rows: unknown[],
  nextPageToken: string | undefined,
  opts: CommonOpts,
  fields?: string[],
): void {
  if (wantsJson(opts)) {
    output({ results: rows, nextPageToken: nextPageToken ?? null }, { json: true });
    return;
  }

  output(rows, { format: opts.format, fields });
  if (nextPageToken) {
    log.info(`Next page token: ${nextPageToken}`);
  }
}

export const projectsResource = new Command("projects").description(
  "Manage Firebase projects and project-level metadata",
);

function parseAnnotations(raw?: string): Record<string, string> | undefined {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Annotations must be a JSON object");
    }

    const entries = Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]);
    return Object.fromEntries(entries);
  } catch {
    throw new CliError(
      2,
      "Invalid --annotations value.",
      "Use a JSON object, for example: --annotations '{\"env\":\"prod\"}'",
    );
  }
}

projectsResource
  .command("list")
  .description("List Firebase projects accessible to the caller")
  .option("--page-size <n>", "Maximum number of projects to return", "20")
  .option("--page-token <token>", "Token returned from a previous list call")
  .option("--show-deleted", "Include projects in DELETED state")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects list\n  firebase-cli projects list --page-size 50 --json",
  )
  .action(async (opts: ListOpts) => {
    try {
      const data = (await client.get("/v1beta1/projects", {
        pageSize: opts.pageSize ?? "20",
        ...(opts.pageToken && { pageToken: opts.pageToken }),
        ...(opts.showDeleted !== undefined && { showDeleted: String(opts.showDeleted) }),
      })) as ListProjectsResponse;

      const rows = Array.isArray(data.results) ? data.results : [];
      outputList(rows, data.nextPageToken, opts, parseFields(opts.fields));
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("available")
  .description("List Google Cloud projects that can be upgraded to Firebase")
  .option("--page-size <n>", "Maximum number of projects to return", "20")
  .option("--page-token <token>", "Token returned from a previous list call")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects available\n  firebase-cli projects available --json",
  )
  .action(async (opts: ListOpts) => {
    try {
      const data = (await client.get("/v1beta1/availableProjects", {
        pageSize: opts.pageSize ?? "20",
        ...(opts.pageToken && { pageToken: opts.pageToken }),
      })) as ListAvailableProjectsResponse;

      const rows = Array.isArray(data.projectInfo) ? data.projectInfo : [];
      outputList(rows, data.nextPageToken, opts, parseFields(opts.fields));
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("get")
  .description("Get a Firebase project by ID or project resource name")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExamples:\n  firebase-cli projects get my-project-id\n  firebase-cli projects get projects/my-project-id")
  .action(async (project: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toProjectRef(project)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("search-apps")
  .description("List all apps for a Firebase project across platforms")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--page-size <n>", "Maximum number of apps to return", "50")
  .option("--page-token <token>", "Token returned from a previous search call")
  .option("--show-deleted", "Include apps in DELETED state")
  .option("--filter <expr>", "AIP-160 filter expression")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects search-apps my-project-id\n  firebase-cli projects search-apps my-project-id --filter \"platform=WEB\" --json",
  )
  .action(async (project: string, opts: SearchAppsOpts) => {
    try {
      const data = (await client.get(`/v1beta1/${toProjectRef(project)}:searchApps`, {
        pageSize: opts.pageSize ?? "50",
        ...(opts.pageToken && { pageToken: opts.pageToken }),
        ...(opts.filter && { filter: opts.filter }),
        ...(opts.showDeleted !== undefined && { showDeleted: String(opts.showDeleted) }),
      })) as SearchAppsResponse;

      const rows = Array.isArray(data.apps) ? data.apps : [];
      outputList(rows, data.nextPageToken, opts, parseFields(opts.fields));
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("get-admin-config")
  .description("Get the Firebase Admin SDK config for a project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects get-admin-config my-project-id\n  firebase-cli projects get-admin-config projects/my-project-id --json",
  )
  .action(async (project: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toProjectRef(project)}/adminSdkConfig`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("get-analytics-details")
  .description("Get Google Analytics details linked to a Firebase project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects get-analytics-details my-project-id\n  firebase-cli projects get-analytics-details projects/my-project-id --json",
  )
  .action(async (project: string, opts: CommonOpts) => {
    try {
      const data = await client.get(`/v1beta1/${toProjectRef(project)}/analyticsDetails`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("update")
  .description("Update mutable project attributes")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--display-name <name>", "New display name")
  .option("--annotations <json>", "Annotations as JSON object")
  .option("--update-mask <mask>", "Explicit update mask, e.g. displayName,annotations")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects update my-project-id --display-name \"My Project\"\n  firebase-cli projects update my-project-id --annotations '{\"env\":\"prod\"}' --json",
  )
  .action(async (project: string, opts: UpdateProjectOpts) => {
    try {
      const annotations = parseAnnotations(opts.annotations);
      const body: Record<string, unknown> = {};
      const autoMask: string[] = [];

      if (opts.displayName) {
        body.displayName = opts.displayName;
        autoMask.push("displayName");
      }

      if (annotations) {
        body.annotations = annotations;
        autoMask.push("annotations");
      }

      const updateMask = opts.updateMask ?? autoMask.join(",");
      if (!updateMask) {
        throw new CliError(
          2,
          "No update field provided.",
          "Use --display-name, --annotations, or provide --update-mask explicitly.",
        );
      }

      const data = await client.patch(
        `/v1beta1/${toProjectRef(project)}?${new URLSearchParams({ updateMask }).toString()}`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("add-firebase")
  .description("Enable Firebase resources on an existing Google Cloud project")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--location-id <id>", "Deprecated default location field")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects add-firebase my-gcp-project\n  firebase-cli projects add-firebase projects/my-gcp-project --json",
  )
  .action(async (project: string, opts: AddFirebaseOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toProjectRef(project)}:addFirebase`, {
        ...(opts.locationId && { locationId: opts.locationId }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("add-analytics")
  .description("Link a Firebase project to Google Analytics")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--analytics-account-id <id>", "Existing Google Analytics account ID")
  .option("--analytics-property-id <id>", "Existing Google Analytics property ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects add-analytics my-project-id --analytics-account-id 123456\n  firebase-cli projects add-analytics my-project-id --analytics-property-id 456789 --json",
  )
  .action(async (project: string, opts: AddAnalyticsOpts) => {
    try {
      if (!opts.analyticsAccountId && !opts.analyticsPropertyId) {
        throw new CliError(
          2,
          "Missing analytics target.",
          "Provide --analytics-account-id or --analytics-property-id.",
        );
      }

      const data = await client.post(`/v1beta1/${toProjectRef(project)}:addGoogleAnalytics`, {
        ...(opts.analyticsAccountId && { analyticsAccountId: opts.analyticsAccountId }),
        ...(opts.analyticsPropertyId && { analyticsPropertyId: opts.analyticsPropertyId }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

projectsResource
  .command("remove-analytics")
  .description("Unlink a Firebase project from Google Analytics")
  .argument("<project>", "Project ID, project number, or projects/*")
  .option("--analytics-property-id <id>", "Optional expected linked property ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  firebase-cli projects remove-analytics my-project-id\n  firebase-cli projects remove-analytics my-project-id --analytics-property-id 456789 --json",
  )
  .action(async (project: string, opts: RemoveAnalyticsOpts) => {
    try {
      const data = await client.post(`/v1beta1/${toProjectRef(project)}:removeAnalytics`, {
        ...(opts.analyticsPropertyId && { analyticsPropertyId: opts.analyticsPropertyId }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
