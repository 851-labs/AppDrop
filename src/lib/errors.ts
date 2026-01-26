export class AppdropError extends Error {
  readonly code: number;

  constructor(message: string, code = 1) {
    super(message);
    this.code = code;
  }
}

export class MissingEnvError extends AppdropError {
  constructor(message: string) {
    super(message, 3);
  }
}

export class UsageError extends AppdropError {
  readonly hint?: string;
  readonly command?: string;

  constructor(message: string, options?: { hint?: string; command?: string }) {
    super(message, 2);
    this.hint = options?.hint;
    this.command = options?.command;
  }
}
