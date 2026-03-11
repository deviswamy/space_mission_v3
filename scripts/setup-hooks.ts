// bun scripts/setup-hooks.ts — run once after cloning
import { writeFileSync, chmodSync } from "fs";

// Pre-commit: fast checks only (lint + typecheck + unit tests)
const preCommit = `#!/bin/sh
echo "Pre-commit: lint + typecheck"
bunx biome check . || exit 1
bun run typecheck || exit 1
echo "Pre-commit passed."
`;

// TODO: Add once test are added - bun test tests/unit/ || exit 1

// Pre-push: full quality gate including integration tests
const prePush = `#!/bin/sh
echo "Pre-push: full quality gate (this may take ~30s)..."
bunx biome check . || exit 1
bun run typecheck || exit 1
echo "Pre-push passed. Safe to push."
`;

// bun test tests/unit/ || exit 1
// bun test tests/integration/ || exit 1

writeFileSync(".git/hooks/pre-commit", preCommit);
chmodSync(".git/hooks/pre-commit", 0o755);

writeFileSync(".git/hooks/pre-push", prePush);
chmodSync(".git/hooks/pre-push", 0o755);

console.log("Git hooks installed: pre-commit + pre-push");
