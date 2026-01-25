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
  executable?: string;
  noNotarize: boolean;
  noDmg: boolean;
  noSparkle: boolean;
  fix: boolean;
  appPath?: string;
  dmgPath?: string;
  zipPath?: string;
  appcastUrl?: string;
  xcodeOnly: boolean;
  keychainOnly: boolean;
  xcodePath?: string;
  keychainName?: string;
  writeGithubEnv: boolean;
  force: boolean;
  installSparkle: boolean;
  publishTag?: string;
  publishTitle?: string;
  publishNotes?: string;
  publishNotesFile?: string;
  publishAssets: string[];
  publishDraft: boolean;
  publishPrerelease: boolean;
}

export interface ParsedArgs {
  command: string;
  flags: GlobalFlags;
  helpCommand?: string;
}

export const VALID_COMMANDS = [
  "release",
  "build",
  "dmg",
  "notarize",
  "appcast",
  "doctor",
  "setup-ci",
  "publish",
] as const;

const COMMAND_HELP: Record<
  string,
  { description: string; usage: string; flags: string[] }
> = {
  release: {
    description: "Build, sign, notarize, and package your macOS app or CLI",
    usage: "appdrop release [options]",
    flags: [
      "--scheme <name>       Override scheme",
      "--project <path>      Override xcodeproj",
      "--executable <name>   Override CLI executable name (Swift Package only)",
      "--output <dir>        Output directory",
      "--no-dmg              Skip DMG creation",
      "--no-notarize         Skip notarization",
      "--no-sparkle          Skip Sparkle signing + appcast",
      "-n, --dry-run         Print pipeline only",
      "--json                JSON output",
    ],
  },
  build: {
    description: "Build and export the app bundle",
    usage: "appdrop build [options]",
    flags: [
      "--scheme <name>       Override scheme",
      "--project <path>      Override xcodeproj",
      "--output <dir>        Output directory",
      "--json                JSON output",
    ],
  },
  dmg: {
    description: "Create a DMG from an app bundle",
    usage: "appdrop dmg --app-path <path> [options]",
    flags: [
      "--app-path <path>     Path to .app bundle (required)",
      "--scheme <name>       Override scheme",
      "--project <path>      Override xcodeproj",
      "--output <dir>        Output directory",
      "--json                JSON output",
    ],
  },
  notarize: {
    description: "Notarize a DMG or ZIP with Apple",
    usage: "appdrop notarize --zip-path <path> | --dmg-path <path>",
    flags: [
      "--zip-path <path>     Path to .zip",
      "--dmg-path <path>     Path to .dmg",
      "--json                JSON output",
    ],
  },
  appcast: {
    description: "Generate a Sparkle appcast entry",
    usage: "appdrop appcast --dmg-path <path> [options]",
    flags: [
      "--dmg-path <path>     Path to .dmg (required)",
      "--appcast-url <url>   Override appcast URL",
      "--output <dir>        Output directory",
      "--json                JSON output",
    ],
  },
  doctor: {
    description: "Check project configuration for issues",
    usage: "appdrop doctor [options]",
    flags: [
      "--scheme <name>       Override scheme",
      "--project <path>      Override xcodeproj",
      "--fix                 Apply project fixes",
    ],
  },
  "setup-ci": {
    description: "Configure CI environment (Xcode + keychain)",
    usage: "appdrop setup-ci [options]",
    flags: [
      "--xcode-only          Only run Xcode selection",
      "--keychain-only       Only run keychain setup",
      "--xcode-path <path>   Override Xcode.app location",
      "--keychain-name <n>   Override keychain name",
      "--write-github-env    Emit KEYCHAIN_* lines for GitHub Actions",
      "--force               Recreate keychain if it exists",
      "--install-sparkle     Install Sparkle tools if missing",
    ],
  },
  publish: {
    description: "Create a GitHub release with assets",
    usage: "appdrop publish --asset <path> [options]",
    flags: [
      "--tag <tag>           Release tag",
      "--title <title>       Release title",
      "--notes <text>        Release notes",
      "--notes-file <path>   Release notes file",
      "--asset <path>        Release asset (repeatable)",
      "--draft               Create a draft release",
      "--prerelease          Mark release as prerelease",
    ],
  },
};

export function commandHelpText(command: string): string {
  const help = COMMAND_HELP[command];
  if (!help) {
    return `Unknown command: ${command}\n\nRun 'appdrop --help' for usage.\n`;
  }

  const lines = [
    `${help.description}`,
    "",
    "USAGE:",
    `  ${help.usage}`,
    "",
    "FLAGS:",
    ...help.flags.map((f) => `  ${f}`),
    "",
    "GLOBAL FLAGS:",
    "  -q, --quiet           Errors only",
    "  -v, --verbose         Verbose output",
    "  --json                JSON output",
    "  -h, --help            Show help",
    "",
  ];

  return lines.join("\n");
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
    noSparkle: false,
    fix: false,
    appPath: undefined,
    dmgPath: undefined,
    zipPath: undefined,
    appcastUrl: undefined,
    xcodeOnly: false,
    keychainOnly: false,
    xcodePath: undefined,
    keychainName: undefined,
    writeGithubEnv: false,
    force: false,
    installSparkle: false,
    publishTag: undefined,
    publishTitle: undefined,
    publishNotes: undefined,
    publishNotesFile: undefined,
    publishAssets: [],
    publishDraft: false,
    publishPrerelease: false,
  };

  let helpCommand: string | undefined;

  // Pre-scan for global flags (position-independent)
  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") {
      flags.help = true;
    } else if (arg === "--version") {
      flags.version = true;
    }
  }

  // Filter out pre-scanned global flags for command determination
  const args = argv.filter((arg) => arg !== "-h" && arg !== "--help" && arg !== "--version");

  // Determine the command
  let command: string;
  const firstArg = args[0];

  if (!firstArg || firstArg.startsWith("-")) {
    // No command specified or starts with flag, default to release
    command = "release";
  } else if (firstArg === "help") {
    // Handle `appdrop help [command]`
    flags.help = true;
    command = "help";
    const secondArg = args[1];
    if (secondArg && !secondArg.startsWith("-")) {
      helpCommand = secondArg;
    }
    args.shift(); // Remove "help"
    if (helpCommand) {
      args.shift(); // Remove the command name
    }
  } else {
    command = args.shift()!;
    // Track helpCommand for `appdrop <command> --help`
    if (flags.help) {
      helpCommand = command;
    }
  }

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
      case "--executable":
        flags.executable = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--no-notarize":
        flags.noNotarize = true;
        break;
      case "--no-dmg":
        flags.noDmg = true;
        break;
      case "--no-sparkle":
        flags.noSparkle = true;
        break;
      case "--fix":
        flags.fix = true;
        break;
      case "--app-path":
        flags.appPath = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--dmg-path":
        flags.dmgPath = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--zip-path":
        flags.zipPath = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--appcast-url":
        flags.appcastUrl = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--xcode-only":
        flags.xcodeOnly = true;
        break;
      case "--keychain-only":
        flags.keychainOnly = true;
        break;
      case "--xcode-path":
        flags.xcodePath = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--keychain-name":
        flags.keychainName = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--write-github-env":
        flags.writeGithubEnv = true;
        break;
      case "--force":
        flags.force = true;
        break;
      case "--install-sparkle":
        flags.installSparkle = true;
        break;
      case "--tag":
        flags.publishTag = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--title":
        flags.publishTitle = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--notes":
        flags.publishNotes = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--notes-file":
        flags.publishNotesFile = consumeValue(args, index, arg);
        index += 1;
        break;
      case "--asset":
        flags.publishAssets.push(consumeValue(args, index, arg));
        index += 1;
        break;
      case "--draft":
        flags.publishDraft = true;
        break;
      case "--prerelease":
        flags.publishPrerelease = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new UsageError(`Unknown flag: ${arg}`);
        }
        break;
    }
  }

  return { command, flags, helpCommand };
}

function consumeValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new UsageError(`Missing value for ${flag}`);
  }
  return value;
}
