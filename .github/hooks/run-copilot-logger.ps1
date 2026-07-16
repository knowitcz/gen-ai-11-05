# GitHub Copilot CLI logging hook runner (Windows / PowerShell).
#
# Usage (from a hook definition): run-copilot-logger.ps1 <copilotEventName>
# The event payload arrives on stdin and is forwarded to log-interaction.py.
#
# This must never fail a Copilot session, so it always exits 0.

$ErrorActionPreference = 'SilentlyContinue'

$hookEvent = if ($args.Count -ge 1) { $args[0] } else { 'unknown' }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $here '..\..')).Path
$script = Join-Path $here 'log-interaction.py'

# The logger is stdlib-only, so any interpreter works. Prefer the project venv,
# then a system Python, and only fall back to `uv run` last (it is slower).
$dotVenvPython = Join-Path $root '.venv\Scripts\python.exe'
$venvPython = Join-Path $root 'venv\Scripts\python.exe'

if (Test-Path $dotVenvPython) {
    & $dotVenvPython $script $hookEvent
}
elseif (Test-Path $venvPython) {
    & $venvPython $script $hookEvent
}
elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python $script $hookEvent
}
elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    & python3 $script $hookEvent
}
elseif (Get-Command uv -ErrorAction SilentlyContinue) {
    Push-Location $root
    try { & uv run python $script $hookEvent } finally { Pop-Location }
}

exit 0
