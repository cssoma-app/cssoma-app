#!/usr/bin/env bash
# Warns (non-blocking) when pushing to main. Receives the PreToolUse Bash payload
# on stdin (JSON, or a raw command in tests). Matches only an actual `git push`
# invocation, not a commit message that merely contains the words "git push".
set -uo pipefail
cmd="$(cat 2>/dev/null || true)"
case "$cmd" in
  *'"command":"git push'*|*'"command": "git push'*|"git push"*|*'&& git push'*|*'; git push'*|*';git push'*)
    b="$(git branch --show-current 2>/dev/null || true)"
    if [ "$b" = "main" ]; then echo "⚠️  Pushing to main. Confirm this is intended." >&2; fi
    ;;
esac
exit 0
