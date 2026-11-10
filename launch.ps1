$ErrorActionPreference='Stop'
$taskNode=Join-Path $PSScriptRoot 'vendor/win-x64/node.exe'
if(-not (Test-Path -LiteralPath $taskNode)){$taskNode=(Get-Command node -ErrorAction Stop).Source}
if(-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'intro.html'))){throw 'Run npm run build first.'}
$taskScript=Join-Path $PSScriptRoot 'launcher.cjs'
Start-Process -FilePath $taskNode -ArgumentList @("`"$taskScript`"") -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
