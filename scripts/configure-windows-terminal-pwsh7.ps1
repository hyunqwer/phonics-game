$ErrorActionPreference = 'Stop'

$settingsPath = Join-Path $env:LOCALAPPDATA 'Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json'
if (-not (Test-Path $settingsPath)) {
    throw "Windows Terminal settings file was not found: $settingsPath"
}

$pwshPath = Join-Path $env:LOCALAPPDATA 'Programs\PowerShell\7\pwsh.exe'
if (-not (Test-Path $pwshPath)) {
    throw "PowerShell 7 executable was not found: $pwshPath"
}

$pwshGuid = '{574e775e-4f2a-5b96-ac1e-a2962a402336}'
$settings = Get-Content -Raw -Path $settingsPath | ConvertFrom-Json

if (-not $settings.profiles) {
    $settings | Add-Member -MemberType NoteProperty -Name profiles -Value ([pscustomobject]@{})
}

if (-not $settings.profiles.defaults) {
    $settings.profiles | Add-Member -MemberType NoteProperty -Name defaults -Value ([pscustomobject]@{})
}

if (-not $settings.profiles.list) {
    $settings.profiles | Add-Member -MemberType NoteProperty -Name list -Value @()
}

$existing = $settings.profiles.list | Where-Object { $_.guid -eq $pwshGuid } | Select-Object -First 1
$profile = [pscustomobject]@{
    guid = $pwshGuid
    name = 'PowerShell 7'
    commandline = '%LOCALAPPDATA%\Programs\PowerShell\7\pwsh.exe'
    startingDirectory = '%USERPROFILE%'
    hidden = $false
}

if ($existing) {
    $existing.name = $profile.name
    $existing.commandline = $profile.commandline
    $existing.startingDirectory = $profile.startingDirectory
    $existing.hidden = $false
} else {
    $settings.profiles.list = @($settings.profiles.list) + $profile
}

$settings.defaultProfile = $pwshGuid

if (-not $settings.profiles.defaults.font) {
    $settings.profiles.defaults | Add-Member -MemberType NoteProperty -Name font -Value ([pscustomobject]@{})
}

$settings.profiles.defaults.font | Add-Member -MemberType NoteProperty -Name face -Value 'Cascadia Mono' -Force

$json = $settings | ConvertTo-Json -Depth 100
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($settingsPath, $json + [Environment]::NewLine, $utf8NoBom)

Write-Host "Configured Windows Terminal default profile: PowerShell 7"
Write-Host "Settings path: $settingsPath"
