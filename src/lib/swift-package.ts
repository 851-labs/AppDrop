import path from "path";
import { run } from "./exec";
import { AppdropError } from "./errors";

export interface SwiftPackageInfo {
  name: string;
  executableTargets: string[];
}

export interface SwiftPackageDescribe {
  name: string;
  targets: Array<{
    name: string;
    type: string;
  }>;
}

export function parsePackageSwift(root: string): SwiftPackageInfo {
  try {
    const result = run("swift", ["package", "describe", "--type", "json"], { cwd: root, quiet: true });
    const parsed = JSON.parse(result.stdout) as SwiftPackageDescribe;

    const executableTargets = parsed.targets
      .filter((t) => t.type === "executable")
      .map((t) => t.name);

    return {
      name: parsed.name,
      executableTargets,
    };
  } catch (error) {
    throw new AppdropError(`Failed to parse Package.swift: ${error instanceof Error ? error.message : String(error)}`, 1);
  }
}

export function getSwiftBuildPath(root: string, arch: string): string {
  // Swift build output path varies by platform
  // On macOS: .build/arm64-apple-macosx/release or .build/x86_64-apple-macosx/release
  return path.join(root, ".build", `${arch}-apple-macosx`, "release");
}

export function getBuiltBinaryPath(root: string, arch: string, executable: string): string {
  return path.join(getSwiftBuildPath(root, arch), executable);
}

export const DEFAULT_ARCHITECTURES = ["arm64", "x86_64"] as const;
