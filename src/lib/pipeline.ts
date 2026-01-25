import fs from "fs";
import path from "path";
import { DEFAULT_BUILD_DIR, DEFAULT_OUTPUT_DIR } from "./constants";
import { ProjectInfo } from "./project";

export interface SparkleTools {
  signUpdate: string;
  generateAppcast: string;
}

export interface Pipeline {
  // Project type
  projectType: "xcode" | "swift-package";

  // Xcode app pipeline
  buildApp: boolean;
  signApp: boolean;
  notarizeApp: boolean;
  createDmg: boolean;
  notarizeDmg: boolean;
  sparkle: boolean;
  generateAppcast: boolean;
  sparkleEnabled: boolean;

  // CLI pipeline (Swift Package)
  buildCli: boolean;
  signCli: boolean;
  createZip: boolean;
  notarizeZip: boolean;
  executable?: string;
  architectures: string[];

  // Common
  outputDir: string;
  buildDir: string;
  infoPlistPath: string | null;
  entitlementsPath: string | null;
  sparkleTools: SparkleTools | null;
  missingEntitlements: boolean;
  missingInfoPlist: boolean;
}

export interface DetectionOptions {
  outputDir?: string;
  buildDir?: string;
  sparkleBin?: string;
}

export function detectPipeline(project: ProjectInfo, options: DetectionOptions = {}): Pipeline {
  const outputDir = path.resolve(project.root, options.outputDir ?? DEFAULT_OUTPUT_DIR);
  const buildDir = path.resolve(project.root, options.buildDir ?? DEFAULT_BUILD_DIR);

  // For Swift Package CLI projects, use CLI pipeline
  if (project.type === "swift-package") {
    return detectCliPipeline(project, outputDir, buildDir);
  }

  // Xcode app pipeline
  const infoPlistPath = locateInfoPlist(project.root);
  let missingInfoPlist = false;

  const entitlementsPath = locateEntitlements(project.root, `${project.name}.entitlements`);

  const sparkleEnabled = infoPlistPath ? hasSparkleKeys(infoPlistPath) : false;
  const sparkleTools = findSparkleTools(options.sparkleBin ?? process.env.SPARKLE_BIN);
  const sparkle = sparkleEnabled && Boolean(sparkleTools);
  missingInfoPlist = sparkleEnabled && !infoPlistPath;

  return {
    projectType: "xcode",
    buildApp: true,
    signApp: true,
    notarizeApp: true,
    createDmg: true,
    notarizeDmg: true,
    sparkle,
    generateAppcast: sparkle,
    sparkleEnabled,
    buildCli: false,
    signCli: false,
    createZip: false,
    notarizeZip: false,
    architectures: [],
    outputDir,
    buildDir,
    infoPlistPath,
    entitlementsPath,
    sparkleTools,
    missingEntitlements: !entitlementsPath,
    missingInfoPlist,
  };
}

export function detectCliPipeline(project: ProjectInfo, outputDir: string, buildDir: string): Pipeline {
  return {
    projectType: "swift-package",
    // Disable Xcode app pipeline
    buildApp: false,
    signApp: false,
    notarizeApp: false,
    createDmg: false,
    notarizeDmg: false,
    sparkle: false,
    generateAppcast: false,
    sparkleEnabled: false,
    // Enable CLI pipeline
    buildCli: true,
    signCli: true,
    createZip: true,
    notarizeZip: true,
    executable: project.executable,
    architectures: ["arm64", "x86_64"],
    // Common
    outputDir,
    buildDir,
    infoPlistPath: null,
    entitlementsPath: null,
    sparkleTools: null,
    missingEntitlements: false,
    missingInfoPlist: false,
  };
}

export function locateInfoPlist(root: string): string | null {
  const candidates = walk(root, (entry) => entry.endsWith("Info.plist"));
  return candidates[0] ?? null;
}

export function hasSparkleKeys(infoPlistPath: string): boolean {
  const content = fs.readFileSync(infoPlistPath, "utf8");
  return content.includes("SUFeedURL") && content.includes("SUPublicEDKey");
}

export function locateEntitlements(root: string, fileName: string): string | null {
  const candidates = walk(root, (entry) => entry.endsWith(fileName));
  return candidates[0] ?? null;
}

export function findSparkleTools(explicitBin?: string): SparkleTools | null {
  const candidates: string[] = [];
  if (explicitBin) {
    candidates.push(explicitBin);
  } else {
    candidates.push(path.join(process.env.HOME ?? "", ".local/bin"));

    for (const base of ["/opt/homebrew/Caskroom/sparkle", "/usr/local/Caskroom/sparkle"]) {
      if (!fs.existsSync(base)) continue;
      const versions = fs.readdirSync(base).sort().reverse();
      for (const version of versions) {
        candidates.push(path.join(base, version, "bin"));
      }
    }
  }

  for (const candidate of candidates) {
    const signUpdate = path.join(candidate, "sign_update");
    const generateAppcast = path.join(candidate, "generate_appcast");
    if (fs.existsSync(signUpdate) && fs.existsSync(generateAppcast)) {
      return { signUpdate, generateAppcast };
    }
  }

  return null;
}

function walk(root: string, predicate: (path: string) => boolean): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      results.push(...walk(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}
