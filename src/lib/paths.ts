import path from "path";

export const resolveRoot = (cwd: string) => cwd;

export const resolveOutputDir = (root: string, output?: string) =>
  path.resolve(root, output ?? "build/release");
