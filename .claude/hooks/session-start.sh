#!/usr/bin/env bash
set -uo pipefail
echo "🏗  SaaS Studio — branch: $(git branch --show-current 2>/dev/null || echo n/a)"
echo "Recent commits:"; git --no-pager log --oneline -3 2>/dev/null || true
for f in idea-validation prd architecture data-model pricing qa-plan security-audit; do
  test -f "docs/specs/$f.md" && echo "  ✓ $f" || echo "  · $f (todo)"
done
echo "Run /start or /studio-status to continue."
exit 0
