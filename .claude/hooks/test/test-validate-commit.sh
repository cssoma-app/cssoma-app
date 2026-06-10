#!/usr/bin/env bash
set -u
HOOK=.claude/hooks/validate-commit.sh
tmp=$(mktemp); fail=0

assert_blocked() { if eval "$2" >/dev/null 2>&1; then echo "FAIL: $1 (not blocked)"; fail=1; else echo "ok: $1"; fi; }
assert_passed()  { if eval "$2" >/dev/null 2>&1; then echo "ok: $1"; else echo "FAIL: $1 (wrongly blocked)"; fail=1; fi; }

# Fake keys are assembled at runtime so this fixture file contains no literal
# token that would trip secret scanners (e.g. GitHub push protection), while the
# value the hook actually scans is still a complete, contiguous key.
SK_LIVE="sk_$(printf 'live')_ABCDEF0123456789abcdef01"

# A: Stripe secret key must be blocked
printf 'const k = "%s"\n' "$SK_LIVE" > "$tmp"
assert_blocked "stripe secret blocked" "echo 'git commit' | DIFF_FILE='$tmp' bash '$HOOK'"

# B: clean content must pass
echo 'const k = process.env.STRIPE_SECRET_KEY' > "$tmp"
assert_passed "clean content passes" "echo 'git commit' | DIFF_FILE='$tmp' bash '$HOOK'"

# C: Supabase service-role key must be blocked
echo 'SUPABASE_SERVICE_ROLE_KEY=eyJsomethingsecretvaluehere.payload.signature' > "$tmp"
assert_blocked "service-role key blocked" "echo 'git commit' | DIFF_FILE='$tmp' bash '$HOOK'"

# D: public anon key must NOT be blocked (false-positive guard)
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payloadpayloadpayload.signaturepart' > "$tmp"
assert_passed "public anon key passes" "echo 'git commit' | DIFF_FILE='$tmp' bash '$HOOK'"

# E: a staged .env filename must be blocked (via DIFF_NAMES)
echo 'clean content' > "$tmp"
assert_blocked ".env filename blocked" "echo 'git commit' | DIFF_FILE='$tmp' DIFF_NAMES='.env.local' bash '$HOOK'"

# F: a non-commit command must be ignored even with a secret present
printf '%s\n' "$SK_LIVE" > "$tmp"
assert_passed "non-commit command ignored" "echo 'git status' | DIFF_FILE='$tmp' bash '$HOOK'"

# G: .env.example may be committed (must pass) even though .env.local is blocked
echo 'SUPABASE_URL=' > "$tmp"
assert_passed ".env.example allowed" "echo 'git commit' | DIFF_FILE='$tmp' DIFF_NAMES='.env.example' bash '$HOOK'"

rm -f "$tmp"; exit $fail
