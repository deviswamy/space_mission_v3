#!/usr/bin/env bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_response.exit_code // 0')

if echo "$COMMAND" | grep -qE "bun test"; then
  if [ "$EXIT_CODE" = "0" ]; then
    echo "All tests passed. Now run the coding-documentation skill to verify documentation standards on any changed files before proceeding to code review."
  fi
fi
exit 0
