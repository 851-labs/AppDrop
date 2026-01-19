export type LogLevel = "quiet" | "normal" | "verbose";

export class Logger {
  constructor(private level: LogLevel) {}

  info(message: string) {
    if (this.level !== "quiet") {
      process.stdout.write(`${message}\n`);
    }
  }

  warn(message: string) {
    process.stderr.write(`${message}\n`);
  }

  verbose(message: string) {
    if (this.level === "verbose") {
      process.stdout.write(`${message}\n`);
    }
  }
}
