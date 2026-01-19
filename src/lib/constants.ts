export const APP_NAME_FALLBACK = "appdrop";
export const DEFAULT_OUTPUT_DIR = "build/release";
export const DEFAULT_BUILD_DIR = "build";

export const REQUIRED_ENV_VARS = [
  "DEVELOPER_ID_APPLICATION",
  "APP_STORE_CONNECT_KEY_ID",
  "APP_STORE_CONNECT_PRIVATE_KEY",
  "SPARKLE_PRIVATE_KEY",
] as const;

export const OPTIONAL_ENV_VARS = [
  "APP_STORE_CONNECT_ISSUER_ID",
  "SPARKLE_BIN",
  "XCODE_PATH",
] as const;
