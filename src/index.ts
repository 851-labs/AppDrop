import { parseArgs } from "./lib/cli";
import { Logger } from "./lib/logger";
import { AppdropError } from "./lib/errors";
import { runRelease } from "./commands/release";
import { runDoctor } from "./commands/doctor";

const VERSION = "0.1.0";

const { command, flags } = parseArgs(process.argv.slice(2));

if (flags.version) {
  process.stdout.write(`${VERSION}\n`);
  process.exit(0);
}

if (flags.help) {
  process.stdout.write(helpText());
  process.exit(0);
}

const logger = new Logger(flags.quiet ? "quiet" : flags.verbose ? "verbose" : "normal");

try {
  switch (command) {
    case "release":
      runRelease(
        {
          root: process.cwd(),
          scheme: flags.scheme,
          project: flags.project,
          output: flags.output,
          dryRun: flags.dryRun,
          noNotarize: flags.noNotarize,
          noDmg: flags.noDmg,
          json: flags.json,
        },
        logger
      );
      break;
    case "doctor":
      runDoctor(
        {
          root: process.cwd(),
          scheme: flags.scheme,
          project: flags.project,
          fix: flags.fix,
        },
        logger
      );
      break;
    default:
      logger.warn(`Unknown command: ${command}`);
      process.exit(2);
  }
} catch (error) {
  if (error instanceof AppdropError) {
    logger.warn(error.message);
    process.exit(error.code);
  }
  logger.warn(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function helpText() {
  return `appdrop - zero-config macOS release CLI\n\nUSAGE:\n  appdrop release [--dry-run]\n  appdrop doctor [--fix]\n\nFLAGS:\n  --scheme <name>   Override scheme\n  --project <path>  Override xcodeproj\n  --output <dir>    Output directory\n  -n, --dry-run     Print pipeline only\n  --fix             Apply project fixes (doctor)\n  --json            JSON output\n  -q, --quiet       Errors only\n  -v, --verbose     Verbose output\n  --version         Print version\n  -h, --help        Show help\n`;
}
