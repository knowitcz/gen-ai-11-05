#!/usr/bin/env bash
# GitHub Copilot CLI logging hook runner (macOS / Linux).
#
# Usage (from a hook definition): run-copilot-logger.sh <copilotEventName>
# The event payload arrives on stdin and is forwarded to log-interaction.py.
#
# This must never fail a Copilot session: a non-zero exit from a preToolUse hook
# can block the tool, so we always exit 0 regardless of what happens.

hook_event="${1:-unknown}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
root="$(cd "$here/../.." >/dev/null 2>&1 && pwd)"
script="$here/log-interaction.py"

# The logger is stdlib-only, so any interpreter works. Prefer the project venv,
# then a system Python, and only fall back to `uv run` last (it is slower).
if [ -x "$root/.venv/bin/python" ]; then
  "$root/.venv/bin/python" "$script" "$hook_event"
elif [ -x "$root/venv/bin/python" ]; then
  "$root/venv/bin/python" "$script" "$hook_event"
elif command -v python3 >/dev/null 2>&1; then
  python3 "$script" "$hook_event"
elif command -v python >/dev/null 2>&1; then
  python "$script" "$hook_event"
elif command -v uv >/dev/null 2>&1; then
  (cd "$root" && uv run python "$script" "$hook_event")
fi

exit 0
