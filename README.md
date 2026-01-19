# appdrop

Zero-config macOS release CLI for building, signing, notarizing, and publishing Sparkle-enabled apps.

## Quick Start

```
export DEVELOPER_ID_APPLICATION="Developer ID Application: Your Name (TEAMID)"
export APP_STORE_CONNECT_KEY_ID="YOUR_KEY_ID"
export APP_STORE_CONNECT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
export SPARKLE_PRIVATE_KEY="BASE64_KEY"

bun run src/index.ts release --dry-run
```

## Docs

- `docs/spec.md`
- `docs/testing.md`
