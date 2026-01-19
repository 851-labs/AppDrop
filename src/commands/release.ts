import { detectPipeline } from "../lib/pipeline";
import { findProject } from "../lib/project";
import { Logger } from "../lib/logger";
import { loadEnv } from "../lib/env";
import { UsageError } from "../lib/errors";

export interface ReleaseOptions {
  root: string;
  scheme?: string;
  project?: string;
  output?: string;
  dryRun: boolean;
  noNotarize: boolean;
  noDmg: boolean;
  json: boolean;
}

export function runRelease(options: ReleaseOptions, logger: Logger) {
  const project = findProject(options.root, options.scheme, options.project);
  const pipeline = detectPipeline(project, { outputDir: options.output, sparkleBin: process.env.SPARKLE_BIN });

  if (options.json) {
    logger.info(JSON.stringify({ project, pipeline }, null, 2));
  } else {
    logger.info(`Project: ${project.projectPath}`);
    logger.info(`Scheme: ${project.scheme}`);
    logger.info(`Pipeline: build=${pipeline.buildApp} dmg=${pipeline.createDmg} sparkle=${pipeline.sparkle}`);
  }

  if (options.dryRun) {
    return;
  }

  if (pipeline.missingEntitlements || pipeline.missingInfoPlist) {
    throw new UsageError("Missing project configuration. Run `appdrop doctor --fix`.");
  }

  loadEnv();

  logger.info("Release pipeline execution not implemented yet.");
}
