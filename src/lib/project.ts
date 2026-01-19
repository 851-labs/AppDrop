import fs from "fs";
import path from "path";
import { UsageError } from "./errors";

export interface ProjectInfo {
  root: string;
  projectPath: string;
  scheme: string;
  name: string;
}

export function findProject(root: string, scheme?: string, projectPath?: string): ProjectInfo {
  if (projectPath) {
    const resolved = path.resolve(root, projectPath);
    if (!fs.existsSync(resolved)) {
      throw new UsageError(`Project not found at ${resolved}`);
    }
    return {
      root,
      projectPath: resolved,
      scheme: scheme ?? path.basename(resolved, ".xcodeproj"),
      name: scheme ?? path.basename(resolved, ".xcodeproj"),
    };
  }

  const candidates = fs.readdirSync(root).filter((entry) => entry.endsWith(".xcodeproj"));
  if (candidates.length === 0) {
    throw new UsageError("No .xcodeproj found in repo root");
  }

  const project = path.join(root, candidates[0]);
  const name = scheme ?? path.basename(project, ".xcodeproj");

  return {
    root,
    projectPath: project,
    scheme: scheme ?? name,
    name,
  };
}
