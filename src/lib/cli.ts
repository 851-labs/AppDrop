import { UsageError } from "./errors";

export interface GlobalFlags {
  help: boolean;
  version: boolean;
  quiet: boolean;
  verbose: boolean;
  json: boolean;
  plain: boolean;
  dryRun: boolean;
  noInput: boolean;
  scheme?: string;
  project?: string;
  output?: string;
  noNotarize: boolean;
  noDmg: boolean;
  fix: boolean;
}

export interface ParsedArgs {
  command: string;
  flags: GlobalFlags;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags: GlobalFlags = {
    help: false,
    version: false,
    quiet: false,
    verbose: false,
    json: false,
    plain: false,
    dryRun: false,
    noInput: false,
    noNotarize: false,
    noDmg: false,
    fix: false,
  };

  const args = [...argv];
  const command = args.shift() ?? "release";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "-h":
      case "--help":
        flags.help = true;
        break;
      case "--version":
        flags.version = true;
        break;
      case "-q":
      case "--quiet":
        flags.quiet = true;
        break;
      case "-v":
      case "--verbose":
        flags.verbose = true;
        break;
      case "--json":
        flags.json = true;
        break;
      case "--plain":
        flags.plain = true;
        break;
      case "-n":
      case "--dry-run":
        flags.dryRun = true;
        break;
      case "--no-input":
        flags.noInput = true;
        break;
      case "--scheme":
        flags.scheme = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--project":
        flags.project = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--output":
        flags.output = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--no-notarize":
        flags.noNotarize = true;
        break;
      case "--no-dmg":
        flags.noDmg = true;
        break;
      case "--fix":
        flags.fix = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new UsageError(`Unknown flag: ${arg}`);
        }
        break;
    }
  }

  return { command, flags };
}

function consumeValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new UsageError(`Missing value for ${flag}`);
  }
  return value;
}
