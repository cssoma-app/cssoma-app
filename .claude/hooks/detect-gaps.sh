#!/usr/bin/env bash
# Utility script: reports missing docs/specs artifacts. Skills with Bash access
# (e.g. /studio-status, /start) may call it, or run it manually for a gap check.
set -uo pipefail
missing=0
for f in idea-validation prd architecture data-model pricing launch-checklist qa-plan security-audit; do
  if [ ! -f "docs/specs/$f.md" ]; then echo "GAP: docs/specs/$f.md missing"; missing=1; fi
done
[ "$missing" = 0 ] && echo "No gaps: core artifacts present."
exit 0
