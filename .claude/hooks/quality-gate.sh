#!/usr/bin/env bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_response.exit_code // 0')
QUALITY_PATTERN="biome check|tsc --noEmit|bun test"

if echo "$COMMAND" | grep -qE "$QUALITY_PATTERN"; then
  if [ "$EXIT_CODE" != "0" ]; then
    echo "Quality gate FAILED: '$COMMAND' exited with code $EXIT_CODE."
    echo "Fix all errors before continuing to the next step."
    exit 2
  fi
fi
exit 0
