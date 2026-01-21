import { describe, expect, it } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";

import { loadEnv } from "../src/lib/env";

describe("env loading", () => {
  it("loads .env values without overriding existing env", () => {
    const originalCwd = process.cwd();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "appdrop-env-"));
    const envPath = path.join(tempDir, ".env");
    const content = [
      "FOO=bar",
      "MULTI=\"line1",
      "line2\"",
      "EXISTING=from-file",
    ].join("\n");
    fs.writeFileSync(envPath, content);

    const previous = {
      FOO: process.env.FOO,
      MULTI: process.env.MULTI,
      EXISTING: process.env.EXISTING,
    };

    process.env.EXISTING = "from-env";
    process.chdir(tempDir);

    try {
      const env = loadEnv(["FOO", "MULTI", "EXISTING"]);
      expect(env.FOO).toBe("bar");
      expect(env.MULTI).toBe("line1\nline2");
      expect(env.EXISTING).toBe("from-env");
    } finally {
      process.chdir(originalCwd);
      restoreEnv(previous);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function restoreEnv(previous: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
