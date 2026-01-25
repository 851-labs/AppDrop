import { describe, expect, it } from "bun:test";
import { getBuiltBinaryPath, getSwiftBuildPath } from "../src/lib/swift-package";
import path from "path";

describe("getSwiftBuildPath", () => {
  it("returns correct path for arm64", () => {
    const result = getSwiftBuildPath("/project", "arm64");
    expect(result).toBe(path.join("/project", ".build", "arm64-apple-macosx", "release"));
  });

  it("returns correct path for x86_64", () => {
    const result = getSwiftBuildPath("/project", "x86_64");
    expect(result).toBe(path.join("/project", ".build", "x86_64-apple-macosx", "release"));
  });
});

describe("getBuiltBinaryPath", () => {
  it("returns correct path for arm64", () => {
    const result = getBuiltBinaryPath("/project", "arm64", "mycli");
    expect(result).toBe(path.join("/project", ".build", "arm64-apple-macosx", "release", "mycli"));
  });

  it("returns correct path for x86_64", () => {
    const result = getBuiltBinaryPath("/project", "x86_64", "mycli");
    expect(result).toBe(path.join("/project", ".build", "x86_64-apple-macosx", "release", "mycli"));
  });
});
