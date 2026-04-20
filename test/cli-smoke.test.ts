import { describe, expect, it } from "bun:test";
import { projectsResource } from "../src/resources/projects.js";
import { webAppsResource } from "../src/resources/webApps.js";
import { androidAppsResource } from "../src/resources/androidApps.js";
import { iosAppsResource } from "../src/resources/iosApps.js";
import { operationsResource } from "../src/resources/operations.js";
import { authCommand } from "../src/commands/auth.js";

function namesOf(resource: { commands: Array<{ name: () => string }> }): string[] {
  return resource.commands.map((c) => c.name()).sort();
}

describe("firebase-cli command surface", () => {
  it("exposes auth commands", () => {
    expect(namesOf(authCommand)).toEqual(["remove", "set", "show", "test"]);
  });

  it("exposes project commands", () => {
    expect(namesOf(projectsResource)).toEqual([
      "add-analytics",
      "add-firebase",
      "available",
      "get",
      "get-admin-config",
      "get-analytics-details",
      "list",
      "remove-analytics",
      "search-apps",
      "update",
    ]);
  });

  it("exposes web app commands", () => {
    expect(namesOf(webAppsResource)).toEqual([
      "create",
      "get",
      "get-config",
      "list",
      "remove",
      "undelete",
      "update",
    ]);
  });

  it("exposes android app commands", () => {
    expect(namesOf(androidAppsResource)).toEqual([
      "create",
      "get",
      "get-config",
      "list",
      "remove",
      "undelete",
      "update",
    ]);
  });

  it("exposes ios app commands", () => {
    expect(namesOf(iosAppsResource)).toEqual([
      "create",
      "get",
      "get-config",
      "list",
      "remove",
      "undelete",
      "update",
    ]);
  });

  it("exposes operation commands", () => {
    expect(namesOf(operationsResource)).toEqual(["get", "wait"]);
  });
});
