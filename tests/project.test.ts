import { describe, expect, it } from "bun:test";
import fs from "fs";
import os from "os";
import { findProject, findSwiftPackage } from "../src/lib/project";
import { UsageError } from "../src/lib/errors";
import path from "path";

const fixturesRoot = path.join(import.meta.dir, "fixtures");

describe("project detection", () => {
  it("detects Package.swift as swift-package type", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    expect(project.type).toBe("swift-package");
    expect(project.name).toBe("swift-cli");
    expect(project.projectPath).toEndWith("Package.swift");
  });

  it("detects .xcodeproj as xcode type", () => {
    const root = path.join(fixturesRoot, "sparkle-on");
    const project = findProject(root);
    expect(project.type).toBe("xcode");
    expect(project.projectPath).toEndWith(".xcodeproj");
  });

  it("prefers Package.swift over .xcodeproj when both exist", () => {
    const root = path.join(fixturesRoot, "mixed-project");
    const project = findProject(root);
    expect(project.type).toBe("swift-package");
    expect(project.projectPath).toEndWith("Package.swift");
  });

  it("allows explicit .xcodeproj override in mixed project", () => {
    const root = path.join(fixturesRoot, "mixed-project");
    const project = findProject(root, undefined, "mixed.xcodeproj");
    expect(project.type).toBe("xcode");
    expect(project.projectPath).toEndWith(".xcodeproj");
  });

  it("throws when no project found", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "appdrop-empty-"));
    try {
      expect(() => findProject(tempDir)).toThrow(UsageError);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("parses executable name from Package.swift", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    expect(project.executable).toBe("swift-cli");
  });

  it("allows --executable to override detected name", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root, undefined, undefined, "custom-name");
    expect(project.executable).toBe("custom-name");
  });
});

describe("findSwiftPackage", () => {
  it("extracts package name", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const packageSwift = path.join(root, "Package.swift");
    const project = findSwiftPackage(root, packageSwift);
    expect(project.name).toBe("swift-cli");
  });

  it("extracts executable target name", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const packageSwift = path.join(root, "Package.swift");
    const project = findSwiftPackage(root, packageSwift);
    expect(project.executable).toBe("swift-cli");
  });
});
