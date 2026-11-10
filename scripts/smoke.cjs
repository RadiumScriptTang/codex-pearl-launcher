'use strict';
// Exercises the launch protocol without opening any native app.
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'codex-pearl-smoke-'));
 let child;
 try{
  for(const f of ['launcher-v8.cjs','intro.html'])fs.copyFileSync(path.join(root,f),path.join(temp,f));
  child=spawn(process.execPath,[path.join(temp,'launcher-v8.cjs'),'--test'],{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';child.stderr.on('data',b=>stderr+=b);
  const exited=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
  const url=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('No launch URL: '+stderr)),10000);
   child.once('error',e=>{clearTimeout(timeout);reject(e)});
   child.once('exit',code=>{clearTimeout(timeout);reject(Error('Premature exit '+code+': '+stderr))});
   child.stdout.on('data',b=>{stdout+=b;for(const line of stdout.split('\n')){try{const value=JSON.parse(line);if(value.url){clearTimeout(timeout);resolve(value.url);return}}catch{}}});
  });
  const base=new URL(url),request=async(route,method='GET')=>{const u=new URL(base);u.pathname=route;return fetch(u,{method,signal:AbortSignal.timeout(5000)})};
  assert.equal((await fetch(base.origin)).status,403);
  const page=await request('/');assert.equal(page.status,200);assert.match(await page.text(),/<canvas/);
  for(const route of ['/ready','/prepare'])assert.equal((await request(route,'POST')).status,200);
  assert.equal((await (await request('/status')).json()).phase,'workspace-ready');
  assert.equal((await request('/complete','POST')).status,200);
  let timeout;const result=await Promise.race([exited,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Launcher did not finish')),5000)})]).finally(()=>clearTimeout(timeout));
  assert.equal(result.code,0,stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'验证-窗口衔接.json'),'utf8')).phase,'done');
  console.log('PASS: authenticated loopback protocol, prepare/complete, clean exit; no native app launched');
 }finally{
  if(child&&child.exitCode===null){child.kill();await new Promise(resolve=>child.once('exit',resolve))}
  fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1});
