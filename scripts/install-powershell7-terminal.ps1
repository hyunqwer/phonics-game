param(
    [string]$InstallRoot = "$env:LOCALAPPDATA\Programs"
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Get-LatestRelease {
    param([Parameter(Mandatory)][string]$Repo)

    Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers @{
        'User-Agent' = 'codex-windows-utf8-setup'
    }
}

function Save-Asset {
    param(
        [Parameter(Mandatory)]$Release,
        [Parameter(Mandatory)][string]$NamePattern,
        [Parameter(Mandatory)][string]$Destination
    )

    $asset = $Release.assets | Where-Object { $_.name -like $NamePattern } | Select-Object -First 1
    if (-not $asset) {
        throw "No asset matching '$NamePattern' found in release $($Release.tag_name)."
    }

    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $Destination -Headers @{
        'User-Agent' = 'codex-windows-utf8-setup'
    }

    return $asset
}

function Add-UserPath {
    param([Parameter(Mandatory)][string]$PathToAdd)

    $current = [Environment]::GetEnvironmentVariable('Path', 'User')
    $parts = @()
    if ($current) {
        $parts = $current -split ';' | Where-Object { $_ }
    }

    if ($parts -notcontains $PathToAdd) {
        $next = (@($parts) + $PathToAdd) -join ';'
        [Environment]::SetEnvironmentVariable('Path', $next, 'User')
    }

    $env:Path = ($env:Path, $PathToAdd) -join ';'
}

function Set-PwshUtf8Profile {
    param([Parameter(Mandatory)][string]$PwshExe)

    $pwshProfile = & $PwshExe -NoLogo -NoProfile -Command '$PROFILE'
    $profileDir = Split-Path -Parent $pwshProfile
    New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

    $profileBlock = @'

# >>> codex utf8 defaults >>>
try {
    chcp 65001 > $null
} catch {
}

$script:CodexUtf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $script:CodexUtf8NoBom
[Console]::OutputEncoding = $script:CodexUtf8NoBom
$OutputEncoding = $script:CodexUtf8NoBom

$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8NoBOM'
$PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8NoBOM'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8NoBOM'
$PSDefaultParameterValues['Export-Csv:Encoding'] = 'utf8NoBOM'

$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
# <<< codex utf8 defaults <<<
'@

    $startMarker = '# >>> codex utf8 defaults >>>'
    $endMarker = '# <<< codex utf8 defaults <<<'

    if (Test-Path $pwshProfile) {
        $existing = Get-Content -Raw -Path $pwshProfile
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

    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($pwshProfile, $updated + [Environment]::NewLine, $utf8NoBom)
    Write-Host "Updated PowerShell 7 profile: $pwshProfile"
}

$downloadDir = Join-Path $env:TEMP 'codex-pwsh-terminal-install'
New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null
New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null

Write-Host 'Fetching latest PowerShell release...'
$psRelease = Get-LatestRelease -Repo 'PowerShell/PowerShell'
$psZip = Join-Path $downloadDir 'PowerShell-win-x64.zip'
$psAsset = Save-Asset -Release $psRelease -NamePattern 'PowerShell-*-win-x64.zip' -Destination $psZip

$psInstallDir = Join-Path $InstallRoot 'PowerShell\7'
if (Test-Path $psInstallDir) {
    Remove-Item -LiteralPath $psInstallDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $psInstallDir | Out-Null
Expand-Archive -LiteralPath $psZip -DestinationPath $psInstallDir -Force

$pwshExe = Join-Path $psInstallDir 'pwsh.exe'
if (-not (Test-Path $pwshExe)) {
    throw "PowerShell executable was not found after extraction: $pwshExe"
}

Add-UserPath -PathToAdd $psInstallDir
Set-PwshUtf8Profile -PwshExe $pwshExe

Write-Host 'Fetching latest Windows Terminal release...'
$terminalRelease = Get-LatestRelease -Repo 'microsoft/terminal'
$terminalBundle = Join-Path $downloadDir 'Microsoft.WindowsTerminal.msixbundle'
$terminalAsset = Save-Asset -Release $terminalRelease -NamePattern 'Microsoft.WindowsTerminal_*_8wekyb3d8bbwe.msixbundle' -Destination $terminalBundle

try {
    Add-AppxPackage -Path $terminalBundle -ForceApplicationShutdown
    Write-Host 'Installed Windows Terminal MSIX bundle.'
} catch {
    Write-Warning "Windows Terminal MSIX install failed: $($_.Exception.Message)"
    Write-Warning 'PowerShell 7 is installed; install Windows Terminal later from Microsoft Store or GitHub release if needed.'
}

Write-Host "Installed PowerShell asset: $($psAsset.name)"
Write-Host "Installed Windows Terminal asset: $($terminalAsset.name)"
Write-Host "PowerShell 7 path: $pwshExe"
Write-Host 'Open a new terminal window so PATH and profile changes are picked up.'
