$ErrorActionPreference='Stop'
$taskSource=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$taskDestination=Join-Path $env:LOCALAPPDATA 'CodexPearlLauncher'
if(Test-Path -LiteralPath $taskDestination){
 $taskBackup=$taskDestination+'.backup.'+(Get-Date -Format yyyyMMddHHmmss)
 Move-Item -LiteralPath $taskDestination -Destination $taskBackup
}
New-Item -ItemType Directory -Path $taskDestination -Force | Out-Null
Get-ChildItem -LiteralPath $taskSource -Force | Where-Object Name -ne '.git' | ForEach-Object {Copy-Item -LiteralPath $_.FullName -Destination $taskDestination -Recurse -Force}
$taskNode=Join-Path $taskDestination 'vendor/win-x64/node.exe'
if(-not (Test-Path -LiteralPath $taskNode)){throw 'Missing bundled Node runtime. Use the complete Windows release archive.'}
& $taskNode (Join-Path $taskDestination 'scripts/build.cjs')
if($LASTEXITCODE -ne 0){throw 'Build failed.'}
$taskShell=New-Object -ComObject WScript.Shell
$taskShortcutPath=Join-Path ([Environment]::GetFolderPath('Desktop')) 'Codex.lnk'
if(Test-Path -LiteralPath $taskShortcutPath){Copy-Item -LiteralPath $taskShortcutPath -Destination (Join-Path $taskDestination 'original-desktop-shortcut.lnk') -Force}
$taskLink=$taskShell.CreateShortcut($taskShortcutPath)
$taskLink.TargetPath=Join-Path $env:WINDIR 'System32/WindowsPowerShell/v1.0/powershell.exe'
$taskLink.Arguments='-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+(Join-Path $taskDestination 'launch.ps1')+'"'
$taskLink.WorkingDirectory=$taskDestination
$taskCodex=Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1
$taskIcon=Join-Path $taskDestination 'assets/icons/codex.ico'
if(Test-Path -LiteralPath $taskIcon){$taskLink.IconLocation=$taskIcon+',0'}
$taskLink.Description='Codex Pearl Launcher';$taskLink.Save()
Write-Output 'Installed. Desktop shortcut: Codex. No application was restarted.'
