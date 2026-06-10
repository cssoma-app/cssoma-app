#!/usr/bin/env bash
# Blocks commits that introduce secrets or a tracked .env file. Receives the
# PreToolUse Bash payload on stdin (JSON, or a raw command in tests); only acts
# on git commit. Honors DIFF_FILE (diff content) and DIFF_NAMES (staged file
# names) for testing.
set -uo pipefail
cmd="$(cat 2>/dev/null || true)"
case "$cmd" in *"git commit"*) ;; *) exit 0 ;; esac

if [ "${DIFF_FILE:-}" != "" ]; then
  content="$(cat "$DIFF_FILE")"
else
  content="$(git diff --cached 2>/dev/null || true)"
fi

if [ "${DIFF_NAMES:-}" != "" ]; then
  names="$DIFF_NAMES"
else
  names="$(git diff --cached --name-only 2>/dev/null || true)"
fi

# Secret value patterns. The Supabase service-role key is matched explicitly;
# the public NEXT_PUBLIC_* anon key (also a JWT) is intentionally NOT blocked,
# so committing .env.example with the anon key works.
patterns='sk_live_[A-Za-z0-9]{16,}|sk_test_[A-Za-z0-9]{16,}|rk_live_[A-Za-z0-9]{16,}|SUPABASE_SERVICE_ROLE_KEY=.+|-----BEGIN [A-Z ]*PRIVATE KEY-----'
if printf '%s' "$content" | grep -Eq "$patterns"; then
  echo "BLOCKED: possible secret in staged changes. Use env vars, never commit keys." >&2
  exit 1
fi
if printf '%s\n' "$names" | grep -E '(^|/)\.env($|\.)' | grep -qv '\.env\.example$'; then
  echo "BLOCKED: a real .env file is staged. Commit only .env.example; keep secrets in an untracked .env." >&2
  exit 1
fi
exit 0
