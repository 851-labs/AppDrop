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
  constructor(message: string) {
    super(message, 2);
  }
}
