param([Parameter(Mandatory=$true)][string]$Profile,[Parameter(Mandatory=$true)][string]$Control,[Parameter(Mandatory=$true)][string]$Status,[switch]$DryRun)
$ErrorActionPreference='Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class TidalHandoff {
 [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h,IntPtr after,int x,int y,int w,int hgt,uint flags);
 [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h,int n);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
 [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a,uint b,bool attach);
 [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
 [DllImport("user32.dll")] public static extern IntPtr SetFocus(IntPtr h);
 public static bool Activate(IntPtr h) {
  uint owner,foregroundOwner;
  uint target=GetWindowThreadProcessId(h,out owner),fg=GetWindowThreadProcessId(GetForegroundWindow(),out foregroundOwner),current=GetCurrentThreadId();
  bool a=false,b=false;
  try {
   if(fg!=current)a=AttachThreadInput(current,fg,true);
   if(target!=current && target!=fg)b=AttachThreadInput(current,target,true);
   BringWindowToTop(h);SetForegroundWindow(h);SetFocus(h);
  } finally {
   if(b)AttachThreadInput(current,target,false);
   if(a)AttachThreadInput(current,fg,false);
  }
  uint activeOwner;GetWindowThreadProcessId(GetForegroundWindow(),out activeOwner);return activeOwner==owner;
 }
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")] public static extern IntPtr GetWindowLongPtr(IntPtr h,int index);
 [DllImport("user32.dll",EntryPoint="SetWindowLongPtrW")] public static extern IntPtr SetWindowLongPtr(IntPtr h,int index,IntPtr value);
 [DllImport("user32.dll")] public static extern bool SetLayeredWindowAttributes(IntPtr h,uint key,byte alpha,uint flags);
 [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h,uint msg,IntPtr w,IntPtr l);
}
'@
$taskBrowser=$null;$taskWindow=[IntPtr]::Zero;$taskOriginalStyle=0L;$taskCovered=$false;$taskPrepared=$false;$taskStarted=$false;$taskDone=$false;$taskCodex=$null;$taskNewChatOpened=$false
function Write-State([string]$Phase,[hashtable]$Extra=@{}){
 $taskRecord=@{phase=$Phase;time=[DateTime]::UtcNow.ToString('o')};foreach($taskKey in $Extra.Keys){$taskRecord[$taskKey]=$Extra[$taskKey]}
 $taskJson=$taskRecord | ConvertTo-Json -Compress
 [IO.File]::WriteAllText($Status+'.new',$taskJson,[Text.UTF8Encoding]::new($false));Move-Item -LiteralPath ($Status+'.new') -Destination $Status -Force
 Write-Output $taskJson
}
function Get-CodexWindow {
 @(Get-Process -Name ChatGPT,Codex -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and $_.Path -match 'OpenAI.Codex_' }) | Sort-Object StartTime | Select-Object -Last 1
}
function Start-CodexBehind {
 $script:taskCodex=Get-CodexWindow
 if($script:taskCodex -or $script:taskStarted){return}
 $taskShortcut=Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs\Codex Dream Skin.lnk'
 $taskSkinStart=Join-Path $PSScriptRoot 'skin-v1/start-skin.ps1'
 if((Test-Path -LiteralPath $taskSkinStart) -and (Test-Path -LiteralPath (Join-Path $env:LOCALAPPDATA 'CodexDreamSkin/engine/scripts/common-windows.ps1'))){
  Start-Process powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$taskSkinStart`"") -WindowStyle Hidden
 }elseif(Test-Path -LiteralPath $taskShortcut){Start-Process -FilePath $taskShortcut}else{
  $taskApp=Get-StartApps | Where-Object { $_.Name -eq 'Codex' -or $_.AppID -like 'OpenAI.Codex_*!App' } | Select-Object -First 1
  if(-not $taskApp){throw '未找到 Codex 启动入口。'}
  Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($taskApp.AppID)" -WindowStyle Hidden
 }
 $script:taskStarted=$true;Write-State 'codex-starting'
}
function Prepare-Codex {
 Start-CodexBehind
 $taskUntil=[DateTime]::UtcNow.AddSeconds(45)
 do{$script:taskCodex=Get-CodexWindow;if($script:taskCodex){break};Start-Sleep -Milliseconds 150}while([DateTime]::UtcNow -lt $taskUntil)
 if(-not $script:taskCodex){throw 'Codex 未能及时显示，请检查原始启动入口。'}
 if(-not $script:taskNewChatOpened){
  Start-Process -FilePath 'codex://threads/new'
  $script:taskNewChatOpened=$true
  Write-State 'new-chat-requested' @{route='codex://threads/new'}
  Start-Sleep -Milliseconds 350
 }
 if([TidalHandoff]::IsIconic($script:taskCodex.MainWindowHandle)){[void][TidalHandoff]::ShowWindowAsync($script:taskCodex.MainWindowHandle,9)}
 [void][TidalHandoff]::Activate($script:taskCodex.MainWindowHandle)
 # Keep the intro above the ready workspace until the crossfade has finished.
 [void][TidalHandoff]::SetWindowPos($script:taskWindow,[IntPtr](-1),0,0,0,0,0x13)
 [void][TidalHandoff]::Activate($script:taskWindow)
 $script:taskPrepared=$true;Write-State 'workspace-ready' @{codexPid=$script:taskCodex.Id;codexWindow=$script:taskCodex.MainWindowHandle.ToInt64()}
}
try{
 if(-not $DryRun){
  $taskForegroundOwner=[uint32]0
  [void][TidalHandoff]::GetWindowThreadProcessId([TidalHandoff]::GetForegroundWindow(),[ref]$taskForegroundOwner)
  $taskForegroundProcess=Get-Process -Id $taskForegroundOwner -ErrorAction SilentlyContinue
  if($taskForegroundProcess.ProcessName -in @('LockApp','LogonUI')){Write-State 'locked' @{message='请先解锁 Windows，再启动开场。'};exit 0}
 }
 Write-State 'launch-ready'
 $taskDeadline=[DateTime]::UtcNow.AddMinutes(10)
 while([DateTime]::UtcNow -lt $taskDeadline){
  $taskCommand=$null;if(Test-Path -LiteralPath $Control){try{$taskCommand=[IO.File]::ReadAllText($Control) | ConvertFrom-Json}catch{}}
  if($taskCommand.stage -eq 'abort'){break}
  if($DryRun){
   if($taskCommand.stage -eq 'ready' -and -not $taskCovered){$taskCovered=$true;Write-State 'intro-visible'}
   if($taskCommand.stage -eq 'prepare' -and -not $taskPrepared){$taskPrepared=$true;Write-State 'workspace-ready'}
   if($taskCommand.stage -eq 'complete'){Write-State 'done' @{fadeMs=900;dryRun=$true};$taskDone=$true;break}
   Start-Sleep -Milliseconds 40;continue
  }
  if(-not $taskCovered){
   $taskRoot=Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Profile) -and $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
   if($taskRoot){$taskBrowser=Get-Process -Id $taskRoot.ProcessId -ErrorAction SilentlyContinue;if($taskBrowser){$taskWindow=$taskBrowser.MainWindowHandle}}
   if($taskWindow -ne [IntPtr]::Zero){$taskOriginalStyle=[TidalHandoff]::GetWindowLongPtr($taskWindow,-20).ToInt64();[void][TidalHandoff]::SetWindowPos($taskWindow,[IntPtr](-1),0,0,0,0,0x13);$taskCovered=$true;Write-State 'intro-visible' @{browserPid=$taskBrowser.Id}}
  }elseif(-not [TidalHandoff]::IsWindow($taskWindow)){Write-State 'cancelled';break}
  if($taskCovered -and $taskCommand.stage -eq 'ready'){Start-CodexBehind}
  if($taskCovered -and $taskCommand.stage -eq 'prepare' -and -not $taskPrepared){Prepare-Codex}
  if($taskCovered -and $taskCommand.stage -eq 'complete'){
   if(-not $taskPrepared){Prepare-Codex}
   [void][TidalHandoff]::SetWindowLongPtr($taskWindow,-20,[IntPtr]($taskOriginalStyle -bor 0x80000))
   if(-not [TidalHandoff]::SetLayeredWindowAttributes($taskWindow,0,255,2)){throw '无法开启窗口交叉淡出。'}
   Write-State 'crossfading' @{fadeMs=900;codexPid=$taskCodex.Id}
   $taskClock=[Diagnostics.Stopwatch]::StartNew()
   while($taskClock.ElapsedMilliseconds -lt 900){$taskP=[Math]::Min(1,$taskClock.ElapsedMilliseconds/900.0);$taskEase=$taskP*$taskP*(3-2*$taskP);[void][TidalHandoff]::SetLayeredWindowAttributes($taskWindow,0,[byte][Math]::Round(255*(1-$taskEase)),2);Start-Sleep -Milliseconds 16}
   [void][TidalHandoff]::SetLayeredWindowAttributes($taskWindow,0,0,2)
   [void][TidalHandoff]::PostMessage($taskWindow,0x10,[IntPtr]::Zero,[IntPtr]::Zero)
   $taskCloseUntil=[DateTime]::UtcNow.AddSeconds(3);while([TidalHandoff]::IsWindow($taskWindow) -and [DateTime]::UtcNow -lt $taskCloseUntil){Start-Sleep -Milliseconds 40}
   if([TidalHandoff]::IsWindow($taskWindow)){throw '开场窗口未能关闭。'}
   $taskFocused=[TidalHandoff]::Activate($taskCodex.MainWindowHandle)
   Start-Sleep -Milliseconds 80
   if(-not $taskFocused){throw 'Codex 焦点激活未成功。'}
   $taskDone=$true;Write-State 'done' @{fadeMs=$taskClock.ElapsedMilliseconds;introClosed=$true;workspaceFocused=$taskFocused;codexPid=$taskCodex.Id;codexWindow=$taskCodex.MainWindowHandle.ToInt64();foregroundWindow=[TidalHandoff]::GetForegroundWindow().ToInt64()};break
  }
  Start-Sleep -Milliseconds 50
 }
}catch{Write-State 'error' @{message=$_.Exception.Message};throw}finally{
 if(-not $DryRun -and $taskCovered -and [TidalHandoff]::IsWindow($taskWindow)){
  [void][TidalHandoff]::SetLayeredWindowAttributes($taskWindow,0,255,2);[void][TidalHandoff]::SetWindowLongPtr($taskWindow,-20,[IntPtr]$taskOriginalStyle);[void][TidalHandoff]::SetWindowPos($taskWindow,[IntPtr](-2),0,0,0,0,0x13)
 }
}
