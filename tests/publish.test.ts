import { describe, expect, it } from "bun:test";

import fs from "fs";
import os from "os";
import path from "path";

import { buildPublishArgs, resolvePublishAssets } from "../src/commands/publish";
import { UsageError } from "../src/lib/errors";

describe("publish args", () => {
  it("builds args with default notes", () => {
    const args = buildPublishArgs("v1.0.0", baseOptions());
    expect(args).toEqual([
      "release",
      "create",
      "v1.0.0",
      "--title",
      "v1.0.0",
      "--notes",
      "Release v1.0.0",
      "build/app.dmg",
    ]);
  });

  it("supports notes file and flags", () => {
    const args = buildPublishArgs("v1.2.3", {
      ...baseOptions(),
      notesFile: "notes.md",
      draft: true,
      prerelease: true,
    });
    expect(args).toEqual([
      "release",
      "create",
      "v1.2.3",
      "--title",
      "v1.2.3",
      "--notes-file",
      "notes.md",
      "--draft",
      "--prerelease",
      "build/app.dmg",
    ]);
  });

  it("rejects missing assets", () => {
    expect(() => buildPublishArgs("v1.0.0", { ...baseOptions(), assets: [] })).toThrow(UsageError);
  });

  it("rejects notes and notes file together", () => {
    expect(() =>
      buildPublishArgs("v1.0.0", {
        ...baseOptions(),
        notes: "text",
        notesFile: "notes.md",
      })
    ).toThrow(UsageError);
  });
});

describe("publish assets", () => {
  it("auto-detects assets in build/release", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "appdrop-publish-"));
    const releaseDir = path.join(tempDir, "build", "release");
    fs.mkdirSync(releaseDir, { recursive: true });
    fs.writeFileSync(path.join(releaseDir, "appcast.xml"), "");
    fs.writeFileSync(path.join(releaseDir, "char.dmg"), "");
    fs.writeFileSync(path.join(releaseDir, "notes.txt"), "");

    try {
      const assets = resolvePublishAssets([], tempDir);
      expect(assets).toEqual([
        path.join(releaseDir, "appcast.xml"),
        path.join(releaseDir, "char.dmg"),
      ]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function baseOptions() {
  return {
    tag: undefined,
    title: undefined,
    notes: undefined,
    notesFile: undefined,
    assets: ["build/app.dmg"],
    draft: false,
    prerelease: false,
  };
}
