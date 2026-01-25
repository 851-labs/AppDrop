import fs from "fs";
import path from "path";
import { UsageError } from "./errors";

export interface ProjectInfo {
  root: string;
  projectPath: string;
  scheme: string;
  name: string;
  type: "xcode" | "swift-package";
  executable?: string;
}

export function findProject(root: string, scheme?: string, projectPath?: string, executable?: string): ProjectInfo {
  // If explicit .xcodeproj is given, use Xcode mode
  if (projectPath?.endsWith(".xcodeproj")) {
    const resolved = path.resolve(root, projectPath);
    if (!fs.existsSync(resolved)) {
      throw new UsageError(`Project not found at ${resolved}`);
    }
    return {
      root,
      projectPath: resolved,
      scheme: scheme ?? path.basename(resolved, ".xcodeproj"),
      name: scheme ?? path.basename(resolved, ".xcodeproj"),
      type: "xcode",
    };
  }

  // Check Package.swift first (Swift Package mode)
  const packageSwift = path.join(root, "Package.swift");
  if (fs.existsSync(packageSwift)) {
    return findSwiftPackage(root, packageSwift, executable);
  }

  // Fall back to .xcodeproj detection
  const candidates = fs.readdirSync(root).filter((entry) => entry.endsWith(".xcodeproj"));
  if (candidates.length === 0) {
    throw new UsageError("No Package.swift or .xcodeproj found in repo root");
  }

  const project = path.join(root, candidates[0]);
  const name = scheme ?? path.basename(project, ".xcodeproj");

  return {
    root,
    projectPath: project,
    scheme: scheme ?? name,
    name,
    type: "xcode",
  };
}

export function findSwiftPackage(root: string, packageSwift: string, executable?: string): ProjectInfo {
  // Parse Package.swift to get the package name
  const content = fs.readFileSync(packageSwift, "utf8");
  const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
  const name = nameMatch ? nameMatch[1] : path.basename(root);

  // Find executable target name - look for .executableTarget patterns
  const executableMatch = content.match(/\.executableTarget\s*\(\s*name:\s*["']([^"']+)["']/);
  const detectedExecutable = executableMatch ? executableMatch[1] : name;

  return {
    root,
    projectPath: packageSwift,
    scheme: name,
    name,
    type: "swift-package",
    executable: executable ?? detectedExecutable,
  };
}
