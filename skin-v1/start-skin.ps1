param()
$ErrorActionPreference='Stop'
$taskEngine=Join-Path $env:LOCALAPPDATA 'CodexDreamSkin/engine/scripts'
. (Join-Path $taskEngine 'common-windows.ps1')
$taskCodex=Get-DreamSkinCodexInstall
$taskPort=9335
$taskIdentity=Get-DreamSkinVerifiedCdpIdentity -Port $taskPort -Codex $taskCodex
$taskRunning=@(Get-DreamSkinCodexProcesses -Codex $taskCodex)
if(-not $taskIdentity -and $taskRunning.Count -gt 0){
 Write-Output 'Codex is running without a skin connection. Please restart it manually when convenient.'
 return
}
if(-not $taskIdentity){
 if(-not (Test-DreamSkinPortAvailable -Port $taskPort)){throw '本地皮肤端口被其他进程占用。'}
 $taskLaunch=Start-DreamSkinCodexDirect -Codex $taskCodex -Arguments @('--remote-debugging-address=127.0.0.1',"--remote-debugging-port=$taskPort")
 $taskUntil=[DateTime]::UtcNow.AddSeconds(35)
 do{$taskIdentity=Get-DreamSkinVerifiedCdpIdentity -Port $taskPort -Codex $taskCodex;if($taskIdentity){break};Start-Sleep -Milliseconds 200}while([DateTime]::UtcNow -lt $taskUntil)
 if(-not $taskIdentity){throw '当前 Codex 未提供皮肤连接；保持原应用，不再重启。'}
}
$taskNode=(Get-DreamSkinNodeRuntime).Path
$taskWatch=Join-Path $PSScriptRoot 'watch-skin.cjs'
Start-Process -FilePath $taskNode -ArgumentList @("`"$taskWatch`"",'--port',"$taskPort",'--browser-id',$taskIdentity.BrowserId) -WindowStyle Hidden
Write-Output ('CSS-only skin connected: '+$taskIdentity.BrowserId)
