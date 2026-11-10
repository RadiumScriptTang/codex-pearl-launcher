'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawn}=require('child_process');
const isMac=process.platform==='darwin';const root=__dirname,test=process.argv.includes('--test'),token=crypto.randomBytes(24).toString('hex'),profile=path.join(root,'launch-browser-profile'),runtime=path.join(root,'runtime');fs.mkdirSync(runtime,{recursive:true});
const control=path.join(runtime,`handoff-${token.slice(0,8)}.json`),status=control+'.status',lock=path.join(runtime,'launcher.lock');let browser,worker,completed=false,preparing=false,ready=false,browserUrl;
function log(s){fs.appendFileSync(path.join(root,'启动日志.txt'),new Date().toISOString()+' '+s+'\n');if(test)console.log(s)}
function watchWorker(child){child.on('error',e=>{log('Native helper failed: '+e.message);server.close()});child.on('exit',code=>{if(code){log('Native helper failed: '+code);server.close()}});}
if(!test){try{if(fs.existsSync(lock)){const old=Number(fs.readFileSync(lock,'utf8'));try{process.kill(old,0);log('Intro already running');process.exit(0)}catch{fs.unlinkSync(lock)}}fs.writeFileSync(lock,String(process.pid),{flag:'wx'})}catch(e){log('Launcher lock: '+e.message);process.exit(1)}}
function signal(stage){fs.writeFileSync(control+'.new',JSON.stringify({stage}));fs.renameSync(control+'.new',control)}
signal('starting');
if(!test&&!isMac){worker=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'handoff.ps1'),'-Profile',profile,'-Control',control,'-Status',status],{windowsHide:true});watchWorker(worker);worker.stdout.on('data',s=>log(s.toString().trim()));worker.stderr.on('data',s=>log(s.toString().trim()));}
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');if(u.searchParams.get('token')!==token){res.writeHead(403);return res.end('Forbidden')}
 if(req.method==='POST'&&['/ready','/prepare','/complete'].includes(u.pathname)){
  if(u.pathname==='/ready'&&!ready&&!preparing&&!completed){ready=true;signal('ready');log('Intro ready; warming workspace behind cover')}
  if(u.pathname==='/prepare'&&!preparing&&!completed){preparing=true;signal('prepare');log('Preparing Codex below intro')}
  if(u.pathname==='/complete'&&!completed){completed=true;signal('complete');log('Final portrait held; native crossfade requested')}
  if(test)fs.writeFileSync(status,JSON.stringify({phase:completed?'done':preparing?'workspace-ready':'intro-visible',dryRun:true}));return res.end('OK')
 }
 if(u.pathname==='/status'){res.setHeader('Content-Type','application/json');try{res.end(fs.readFileSync(status))}catch{res.end('{"phase":"starting"}')}return}
 if(u.pathname!=='/'){res.writeHead(404);return res.end('Not found')}
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,'intro.html')));
});
server.listen(0,'127.0.0.1',()=>{const port=server.address().port,url=`http://127.0.0.1:${port}/?clean=1&launch=1&token=${token}`;if(test){console.log(JSON.stringify({url,port}));return}
 browserUrl=url;if(isMac){worker=spawn('/usr/bin/osascript',['-l','JavaScript',path.join(root,'mac/host.js'),url,control,status],{stdio:['ignore','pipe','pipe']});watchWorker(worker);worker.stderr.on('data',s=>log(s.toString().trim()));log('Playing native macOS WebKit intro');}
});
const poll=setInterval(()=>{try{const s=JSON.parse(fs.readFileSync(status));if(s.phase==='launch-ready'&&!test&&!isMac&&!browser&&browserUrl){const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';browser=spawn(edge,[`--user-data-dir=${profile}`,`--app=${browserUrl}`,'--start-fullscreen','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--force-dark-mode'],{windowsHide:false,stdio:'ignore'});browser.on('error',e=>{log(e.message);signal('abort');server.close()});log('Playing continuous intro; native transition enabled')}if(['done','cancelled','error','locked'].includes(s.phase)){fs.copyFileSync(status,path.join(root,'验证-窗口衔接.json'));log('Handoff result: '+JSON.stringify(s));server.close();clearInterval(poll)}}catch{}},100);
const timeout=setTimeout(()=>{signal('abort');server.close()},10*60*1000);
server.on('close',()=>{clearInterval(poll);clearTimeout(timeout);if(!completed)signal('abort');if(!test&&fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);});
