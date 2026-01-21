import fs from "fs";
import path from "path";

import { REQUIRED_ENV_VARS } from "./constants";
import { MissingEnvError } from "./errors";

export type Env = Record<string, string>;

let dotenvLoaded = false;

export function loadEnv(required: readonly string[] = REQUIRED_ENV_VARS): Env {
  loadDotEnv();
  const env: Env = {};
  for (const name of required) {
    const value = process.env[name];
    if (!value) {
      throw new MissingEnvError(`Missing ${name}`);
    }
    env[name] = value;
  }
  return env;
}

function loadDotEnv() {
  if (dotenvLoaded) {
    return;
  }
  dotenvLoaded = true;

  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  const parsed = parseDotEnv(content);
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseDotEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }

    const separator = rawLine.indexOf("=");
    if (separator === -1) {
      index += 1;
      continue;
    }

    const key = rawLine.slice(0, separator).trim();
    let value = rawLine.slice(separator + 1).trim();

    if (value.startsWith("\"") || value.startsWith("'")) {
      const quote = value[0];
      value = value.slice(1);

      if (value.endsWith(quote)) {
        value = value.slice(0, -1);
        result[key] = value;
        index += 1;
        continue;
      }

      let buffer = value;
      index += 1;
      while (index < lines.length) {
        const nextLine = lines[index];
        const quoteIndex = nextLine.indexOf(quote);
        if (quoteIndex !== -1) {
          buffer += `\n${nextLine.slice(0, quoteIndex)}`;
          result[key] = buffer;
          break;
        }
        buffer += `\n${nextLine}`;
        index += 1;
      }
    } else {
      result[key] = value;
    }

    index += 1;
  }

  return result;
}
