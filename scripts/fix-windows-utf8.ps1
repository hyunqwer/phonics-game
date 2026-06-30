param(
    [switch]$SetConsoleRegistry
)

$ErrorActionPreference = 'Stop'

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$encodingName = if ($PSVersionTable.PSVersion.Major -ge 6) { 'utf8NoBOM' } else { 'utf8' }

$profileBlock = @"

# >>> codex utf8 defaults >>>
# Keep PowerShell, child tools, and Git-friendly output on UTF-8.
try {
    chcp 65001 > `$null
} catch {
}

`$script:CodexUtf8NoBom = New-Object System.Text.UTF8Encoding `$false
[Console]::InputEncoding = `$script:CodexUtf8NoBom
[Console]::OutputEncoding = `$script:CodexUtf8NoBom
`$OutputEncoding = `$script:CodexUtf8NoBom

`$PSDefaultParameterValues['Out-File:Encoding'] = '$encodingName'
`$PSDefaultParameterValues['Set-Content:Encoding'] = '$encodingName'
`$PSDefaultParameterValues['Add-Content:Encoding'] = '$encodingName'
`$PSDefaultParameterValues['Export-Csv:Encoding'] = '$encodingName'

`$env:PYTHONUTF8 = '1'
`$env:PYTHONIOENCODING = 'utf-8'
# <<< codex utf8 defaults <<<
"@

$profilePath = $PROFILE
$profileDir = Split-Path -Parent $profilePath
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

$startMarker = '# >>> codex utf8 defaults >>>'
$endMarker = '# <<< codex utf8 defaults <<<'

if (Test-Path $profilePath) {
    $existing = Get-Content -Raw -Path $profilePath
    $escapedStart = [regex]::Escape($startMarker)
    $escapedEnd = [regex]::Escape($endMarker)
    $pattern = "(?s)\r?\n?$escapedStart.*?$escapedEnd"

    if ($existing -match $pattern) {
        $updated = [regex]::Replace($existing, $pattern, $profileBlock.TrimEnd())
    } else {
        $updated = $existing.TrimEnd() + $profileBlock
    }
} else {
    $updated = $profileBlock.TrimStart()
}

[System.IO.File]::WriteAllText($profilePath, $updated + [Environment]::NewLine, $utf8NoBom)

git config --global core.quotepath false
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8

if ($SetConsoleRegistry) {
    New-Item -Path 'HKCU:\Console' -Force | Out-Null
    New-ItemProperty -Path 'HKCU:\Console' -Name CodePage -Value 65001 -PropertyType DWord -Force | Out-Null
}

Write-Host "Updated PowerShell profile: $profilePath"
Write-Host 'Updated Git global UTF-8 settings.'
if ($SetConsoleRegistry) {
    Write-Host 'Updated HKCU console default CodePage to 65001.'
}
Write-Host 'Open a new terminal window for the profile changes to take effect.'
