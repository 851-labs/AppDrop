import fs from "fs";
import path from "path";

import { Logger } from "../lib/logger";
import { AppdropError, UsageError } from "../lib/errors";
import { run } from "../lib/exec";
import { loadEnv } from "../lib/env";

export interface PublishOptions {
  tag?: string;
  title?: string;
  notes?: string;
  notesFile?: string;
  assets: string[];
  draft: boolean;
  prerelease: boolean;
}

export function runPublish(options: PublishOptions, logger: Logger) {
  loadEnv([]);
  const tag = resolveTag(options.tag);
  const assets = resolvePublishAssets(options.assets, process.cwd());
  const args = buildPublishArgs(tag, { ...options, assets });

  ensureGhCli();
  logger.info(`Creating GitHub release ${tag}`);
  run("gh", args);
}

export function buildPublishArgs(tag: string, options: PublishOptions): string[] {
  if (!options.assets.length) {
    throw new UsageError("At least one --asset is required.");
  }

  if (options.notes && options.notesFile) {
    throw new UsageError("Use either --notes or --notes-file, not both.");
  }

  const args = ["release", "create", tag, "--title", options.title ?? tag];
  if (options.notesFile) {
    args.push("--notes-file", options.notesFile);
  } else {
    args.push("--notes", options.notes ?? `Release ${tag}`);
  }

  if (options.draft) {
    args.push("--draft");
  }
  if (options.prerelease) {
    args.push("--prerelease");
  }

  args.push(...options.assets);
  return args;
}

export function resolvePublishAssets(assets: string[], root: string): string[] {
  if (assets.length) {
    return assets;
  }

  const releaseDir = path.join(root, "build", "release");
  if (!fs.existsSync(releaseDir)) {
    return [];
  }

  const entries = fs.readdirSync(releaseDir);
  const selected = entries.filter((entry) => entry.endsWith(".dmg") || entry.endsWith(".pkg") || entry === "appcast.xml");
  return selected.sort().map((entry) => path.join(releaseDir, entry));
}

function resolveTag(explicitTag?: string): string {
  if (explicitTag) {
    return explicitTag;
  }

  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }

  try {
    const result = run("git", ["describe", "--tags", "--exact-match"], { quiet: true });
    const tag = result.stdout.trim();
    if (tag) {
      return tag;
    }
  } catch {
    // ignore
  }

  throw new UsageError("Missing release tag. Pass --tag or set GITHUB_REF_NAME.");
}

function ensureGhCli() {
  try {
    run("/usr/bin/which", ["gh"], { quiet: true });
  } catch {
    throw new AppdropError("GitHub CLI not found. Install gh to use appdrop publish.", 1);
  }
}
