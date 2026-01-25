import { describe, expect, it } from "bun:test";
import { detectPipeline, detectCliPipeline } from "../src/lib/pipeline";
import { findProject } from "../src/lib/project";
import path from "path";

const fixturesRoot = path.join(import.meta.dir, "fixtures");

describe("pipeline detection", () => {
  it("detects sparkle enabled when keys + tools", () => {
    const root = path.join(fixturesRoot, "sparkle-on");
    const project = findProject(root, undefined, "sparkle-on.xcodeproj");
    const pipeline = detectPipeline(project, { sparkleBin: path.join(root, "tools") });
    expect(pipeline.sparkle).toBeTrue();
    expect(pipeline.generateAppcast).toBeTrue();
    expect(pipeline.missingEntitlements).toBeFalse();
  });

  it("disables sparkle when tools missing", () => {
    const root = path.join(fixturesRoot, "sparkle-on");
    const project = findProject(root, undefined, "sparkle-on.xcodeproj");
    const pipeline = detectPipeline(project, { sparkleBin: path.join(root, "missing-tools") });
    expect(pipeline.sparkle).toBeFalse();
  });

  it("allows missing info plist when sparkle off", () => {
    const root = path.join(fixturesRoot, "no-info");
    const project = findProject(root, undefined, "no-info.xcodeproj");
    const pipeline = detectPipeline(project, {});
    expect(pipeline.missingInfoPlist).toBeFalse();
  });

  it("handles sparkle disabled project", () => {
    const root = path.join(fixturesRoot, "sparkle-off");
    const project = findProject(root, undefined, "sparkle-off.xcodeproj");
    const pipeline = detectPipeline(project, {});
    expect(pipeline.sparkle).toBeFalse();
    expect(pipeline.generateAppcast).toBeFalse();
  });

  it("flags missing entitlements for non-sparkle projects", () => {
    const root = path.join(fixturesRoot, "missing-entitlements");
    const project = findProject(root, undefined, "missing-entitlements.xcodeproj");
    const pipeline = detectPipeline(project, {});
    expect(pipeline.missingEntitlements).toBeTrue();
  });
});

describe("CLI pipeline detection", () => {
  it("creates CLI pipeline for Swift Package", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    const pipeline = detectPipeline(project, {});
    expect(pipeline.projectType).toBe("swift-package");
  });

  it("enables buildCli, signCli, createZip, notarizeZip", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    const pipeline = detectPipeline(project, {});
    expect(pipeline.buildCli).toBeTrue();
    expect(pipeline.signCli).toBeTrue();
    expect(pipeline.createZip).toBeTrue();
    expect(pipeline.notarizeZip).toBeTrue();
  });

  it("disables buildApp, createDmg, sparkle for CLI", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    const pipeline = detectPipeline(project, {});
    expect(pipeline.buildApp).toBeFalse();
    expect(pipeline.createDmg).toBeFalse();
    expect(pipeline.sparkle).toBeFalse();
  });

  it("does not require entitlements for CLI projects", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    const pipeline = detectPipeline(project, {});
    expect(pipeline.missingEntitlements).toBeFalse();
  });

  it("sets default architectures to arm64 and x86_64", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    const pipeline = detectPipeline(project, {});
    expect(pipeline.architectures).toEqual(["arm64", "x86_64"]);
  });

  it("sets executable from project", () => {
    const root = path.join(fixturesRoot, "swift-cli");
    const project = findProject(root);
    const pipeline = detectPipeline(project, {});
    expect(pipeline.executable).toBe("swift-cli");
  });
});
