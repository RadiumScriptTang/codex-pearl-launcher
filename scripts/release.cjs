'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),version='v'+require('../package.json').version;
const dest=path.resolve(root,'../codex-pearl-release',version);fs.mkdirSync(dest,{recursive:true});
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc(b){let c=0xffffffff;for(const n of b)c=table[(c^n)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function files(dir,prefix=''){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','runtime','launch-browser-profile','preview-browser-profile'].includes(e.name))continue;const p=prefix+e.name;if(e.isDirectory())out.push(...files(path.join(dir,e.name),p+'/'));else if(!/\.log$|\.lnk$|^启动日志\.txt$|^验证-|live-status\.json$|-live\.png$|^\.env/.test(p))out.push(p)}return out.sort()}
function zip(name,list){
 const fd=fs.openSync(path.join(dest,name),'w'),central=[];let offset=0;
 try{for(const entry of list){
  const data=entry.source?fs.readFileSync(path.join(root,entry.source)):Buffer.from(entry.text,'utf8');
  const compressed=zlib.deflateRawSync(data,{level:6}),filename=Buffer.from(entry.name),sum=crc(data),local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(0x0021,12);local.writeUInt32LE(sum,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(filename.length,26);
  for(const b of [local,filename,compressed])fs.writeSync(fd,b);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(0x0314,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(8,10);c.writeUInt16LE(0x0021,14);c.writeUInt32LE(sum,16);c.writeUInt32LE(compressed.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(filename.length,28);
  const executable=entry.name.endsWith('.command')||entry.name.endsWith('/bin/node');c.writeUInt32LE(((executable?0o100755:0o100644)<<16)>>>0,38);c.writeUInt32LE(offset,42);central.push(c,filename);offset+=local.length+filename.length+compressed.length;
 }
 const start=offset;for(const c of central){fs.writeSync(fd,c);offset+=c.length}
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(list.length,8);end.writeUInt16LE(list.length,10);end.writeUInt32LE(offset-start,12);end.writeUInt32LE(start,16);fs.writeSync(fd,end);
 }finally{fs.closeSync(fd)}
 console.log(name,list.length,fs.statSync(path.join(dest,name)).size);return name;
}
function instructions(platform){return `Codex Pearl ${version} 使用说明\n\n`+(platform==='mac'?`适用：Apple Silicon（M 系列）Mac。\n1. 先将整个压缩包解压，不要只取出部署入口。\n2. 双击同目录的「01 一键部署 Codex（macOS）.command」。它会在终端中运行安装。\n   若没有在终端打开，可右键选择「打开方式 → 终端」。\n3. 等待安装完成提示；安装不会自动打开或重启 Codex。\n4. 双击桌面的「Codex Pearl.app」，或在 Finder 中按 Command+Shift+G，\n   输入 ~/Applications，打开其中的 Codex Pearl.app；可将它拖到 Dock。\n\n首次使用由系统提示确认。本应用未签名、未公证；不要关闭系统安全保护。\n本版保留原有 Mac 启动实现，已收到点击无反应的反馈，尚未确认根因或完成修复。\n`:`适用：Windows x64。\n1. 右键压缩包，选择「全部解压」，保留整个文件夹。\n2. 双击同目录的「01 一键部署 Codex（Windows）.cmd」。\n3. 等待安装完成提示；安装不会自动打开或重启 Codex。\n4. 双击桌面的「Codex」快捷方式。\n\n程序安装到 %LOCALAPPDATA%\\CodexPearlLauncher，无需管理员权限。\n`)+`\n使用前需已安装并能正常打开官方 Codex；ChatGPT 是另一个应用。\n图片、三条原始语音、混音和 Node.js 运行时均在包内，无需另外下载素材或安装 Node。\n皮肤为实验附加功能，支持边界见「程序文件/README.md」。\n\n【安装后无反应 / 需要适配】\n在出问题的电脑上，用 Codex 打开本包的「程序文件」文件夹作为项目，\n打开 docs/REPAIR_PROMPT.zh-CN.md，复制其中的提示词到新聊天。\n让本机 Codex 直接读取代码与日志、修复并验证，不必跨电脑搬运日志。\nMac 日志通常在 ~/Applications/Codex Pearl.app/Contents/Resources/app/启动日志.txt；\nWindows 日志通常在 %LOCALAPPDATA%\\CodexPearlLauncher\\启动日志.txt。\n启动过早失败时可能尚未生成日志，请让本机 Codex 从启动入口捕获错误。\n\n保留「程序文件」与部署入口的相对位置；安装前不要移动、重命名或删掉子文件。\n代码和素材的来源、许可范围见「程序文件/ASSETS.md」。\n项目：https://github.com/RadiumScriptTang/codex-pearl-launcher\n`}
const winEntry={name:'01 一键部署 Codex（Windows）.cmd',text:'@echo off\r\nchcp 65001 >nul\r\ncall "%~dp0程序文件\\windows\\Install.cmd"\r\n'};
const macEntry={name:'01 一键部署 Codex（macOS）.command',text:'#!/bin/zsh\nset -u\nROOT="$(cd "$(dirname "$0")" && pwd)"\n/bin/zsh "$ROOT/程序文件/mac/Install.command"\nRESULT=$?\nif [[ "$RESULT" -ne 0 ]]; then\n  print "安装失败（退出码 $RESULT）。请保留上方错误，并查看同目录的 02 使用说明.txt。"\n  read "?按回车关闭。"\nfi\nexit "$RESULT"\n'};
const all=files(root),base=all.filter(x=>!x.startsWith('vendor/'));
const payload=list=>list.filter(x=>!['Install Windows.cmd','Install macOS.command'].includes(x)).map(source=>({name:'程序文件/'+source,source}));
const win=[winEntry,{name:'02 使用说明.txt',text:'\ufeff'+instructions('win')},...payload([...base,...all.filter(x=>x.startsWith('vendor/win-x64/')||x==='vendor/NODE-SHASUMS256.txt')])];
const mac=[macEntry,{name:'02 使用说明.txt',text:'\ufeff'+instructions('mac')},...payload([...base,...all.filter(x=>x.startsWith('vendor/darwin-arm64/')||x==='vendor/NODE-SHASUMS256.txt')])];
const source=[{name:'01 源码说明.txt',text:'\ufeff这是完整源码与素材包，不含平台 Node.js 运行时。\n要一键安装，请下载 windows-x64 或 macos-arm64 完整安装包。\n源码位于「程序文件」，开发方式见其中 README.md，本机适配提示词位于 docs/REPAIR_PROMPT.zh-CN.md。\n'},...base.map(p=>({name:'程序文件/'+p,source:p}))];
for(const [label,list] of [['Windows',win],['macOS',mac]]){
 const top=new Set(list.map(e=>e.name.split('/')[0]));if(top.size!==3||!list[0].name.startsWith('01 一键部署'))throw Error(label+' layout mismatch');
}
for(const required of ['intro.html','assets/local/soundtrack.wav','docs/REPAIR_PROMPT.zh-CN.md','vendor/win-x64/node.exe','vendor/darwin-arm64/bin/node'])if(!all.includes(required))throw Error('Missing release file: '+required);
const built=[];for(const [label,list]of [['windows-x64',win],['macos-arm64',mac],['source',source]])built.push(zip(`Codex-Pearl-${version}-${label}.zip`,list));
fs.writeFileSync(path.join(dest,'SHA256SUMS.txt'),built.map(f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dest,f))).digest('hex')+'  '+f).join('\n')+'\n');
fs.writeFileSync(path.join(dest,'release-manifest.json'),JSON.stringify({version,layout:{installerFirst:true,platformTopLevelItems:3,payloadFolder:'程序文件',repairPrompt:'程序文件/docs/REPAIR_PROMPT.zh-CN.md'},windows:{architecture:'x64',fileCount:win.length,bundledNode:true},mac:{architecture:'arm64',fileCount:mac.length,bundledNode:true,requiresNodeInstall:false,realMacTested:false,knownStartupIssue:true},assets:{pictures:true,rawVoices:true,mixedAudio:true},macIntelIncluded:false},null,2));
