#!/usr/bin/env python3
"""Append a one-line record of a GitHub Copilot CLI interaction to logs/copilot.log.

Invoked by the hook runner scripts (run-copilot-logger.sh / .ps1). The Copilot
event name is passed as argv[1]; the event payload (JSON) is read from stdin.

Design rules (do not break these):
* Only the standard library is used, so any Python works -- no project deps.
* Nothing is written to stdout, so the script can never influence a preToolUse
  decision or a postToolUse result.
* The script never raises and always exits 0 -- logging must not break a session.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# logs/copilot.log, resolved relative to the repo root (.github/hooks/ -> root).
LOG_PATH = Path(__file__).resolve().parents[2] / "logs" / "copilot.log"


def _timestamp(payload: dict) -> str:
    """ISO-8601 local time. Prefer the payload timestamp (Unix ms), else now."""
    ts = payload.get("timestamp")
    if isinstance(ts, (int, float)):
        try:
            return (
                datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
                .astimezone()
                .isoformat(timespec="seconds")
            )
        except (OverflowError, OSError, ValueError):
            pass
    return datetime.now().astimezone().isoformat(timespec="seconds")


def _describe(event: str, payload: dict) -> str:
    """Render the human-readable message for one event (tool name only, no args)."""
    tool = payload.get("tool_name") or payload.get("toolName") or payload.get("tool") or "?"
    agent = payload.get("agentDisplayName") or payload.get("agentName") or "?"
    return {
        "sessionStart": f"SESSION START     source={payload.get('source', '?')}",
        "agentStop": "RESPONSE END",
        "preToolUse": f"TOOL CALL         {tool}",
        "postToolUse": f"TOOL DONE         {tool}",
        "postToolUseFailure": f"TOOL FAILED       {tool}",
        "subagentStart": f"SUBAGENT START    {agent}",
        "subagentStop": f"SUBAGENT STOP     {agent}",
    }.get(event, f"{event}")


def main() -> int:
    # stdin is a pipe under a hook; guard against a hang if run manually in a TTY.
    raw = "" if sys.stdin.isatty() else sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
        if not isinstance(payload, dict):
            payload = {}
    except (ValueError, TypeError):
        payload = {}

    event = (
        sys.argv[1]
        if len(sys.argv) > 1
        else payload.get("hookEventName") or payload.get("hook_event_name") or "unknown"
    )

    session = (str(payload.get("sessionId", "")) or "-" * 8)[:8]
    line = f"{_timestamp(payload)} [{session}] {_describe(event, payload)}\n"

    try:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a", encoding="utf-8") as fh:
            fh.write(line)
    except OSError:
        pass  # never let a logging failure surface to Copilot
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:  # noqa: BLE001 - a logging hook must never crash a session
        sys.exit(0)
