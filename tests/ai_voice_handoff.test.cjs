'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
(async()=>{
for(const page of ['app.html','caller.html','caller5.html']){
 const s=fs.readFileSync(path.join(__dirname,'..',page),'utf8');
 assert.match(s,/const AC_V=144;/,page+' client version');
 assert.match(s,/id="aiSpeechStatus"/,page+' actual-delivery status');
 assert.doesNotMatch(s,/AI_CALL\.rec\.start\(7000\)/,page+' no seven-second fragments');
 assert.match(s,/call\.recTimer=setTimeout\([\s\S]*?,3500\)/,page+' standalone 3.5-second audio slices');
 const timers=new Map();let nextTimer=1,now=100000,stt=0,chats=0;
 const statuses={aiSpeechStatus:{className:'hide',textContent:''}};
 const recorders=[];
 class Recorder{
  static isTypeSupported(){return true;}
  constructor(){this.state='inactive';recorders.push(this);}
  start(){this.state='recording';}
  stop(){assert.equal(this.state,'recording');this.state='inactive';this.ondataavailable({data:new Blob([Buffer.alloc(1200)],{type:'audio/webm'})});this.onstop();}
 }
 const context={
  $:id=>statuses[id],Date:{now:()=>now},Promise,Blob,Uint8Array,String,MediaRecorder:Recorder,
  btoa:s=>Buffer.from(s,'binary').toString('base64'),
  setTimeout:(fn,delay)=>{const id=nextTimer++;timers.set(id,{fn,delay});return id;},
  clearTimeout:id=>timers.delete(id),
  mic:{getAudioTracks:()=>[{readyState:'live',enabled:true,muted:false}]},
  toast:()=>{},ME:'111111111',ME_NAME:'Test user',e2eEnc:async(peer,text)=>text,
  api:async(act,payload)=>{if(act==='stt'){stt++;return {ok:true,text:'Hello Samuel'};}if(act==='chat'){chats++;return {ok:true};}throw Error('unexpected '+act);}
 };
 vm.createContext(context);
 const begin=s.indexOf('let AI_CALL=null,AI_AC=null;');
 const helpersEnd=s.indexOf('async function aiCall(p)',begin);
 const sttBegin=s.indexOf('function aiSTT(){',helpersEnd);
 const sttEnd=s.indexOf('\ndocument.addEventListener("click",e=>{',sttBegin);
 assert.ok(begin>=0&&helpersEnd>begin&&sttBegin>helpersEnd&&sttEnd>sttBegin,page+' test extraction');
 vm.runInContext(s.slice(begin,helpersEnd)+s.slice(sttBegin,sttEnd),context);
 vm.runInContext('AI_CALL={on:true,peer:"222222222",speaking:false,tries:0,noiseChunks:0,pending:"",lastSent:0,rec:null,recTimer:null,sendTimer:null};',context);
 const call=vm.runInContext('AI_CALL',context);
 context.aiSTT();assert.equal(recorders.length,1,page+' begins recording');
 const first=recorders[0];assert.equal(first.state,'recording');
 call.speaking=true;first.stop();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(stt,1,page+' flushes pre-greeting speech for transcription');
 assert.equal(chats,0,page+' queues words while AI is speaking');
 assert.match(call.pending,/Hello Samuel/,page+' preserves spoken text');
 call.speaking=false;context.aiSTT();context.aiSendHeard(call);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(chats,1,page+' sends recognized words after AI finishes');
 assert.match(statuses.aiSpeechStatus.textContent,/Waiting for my reply/,page+' confirms delivery');
 assert.equal(recorders.length,2,page+' each slice has a fresh recorder/header');
 now+=1000;recorders[1].stop();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(chats,1,page+' rate limits chat sends to protect account');
 now+=7500;
 const due=[...timers].find(([id,t])=>t.delay>0&&t.delay<=7500);
 assert.ok(due,page+' next delivery timer is scheduled');
 timers.delete(due[0]);due[1].fn();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(chats,2,page+' queued speech eventually delivered');
}
console.log('PASS: pre-greeting speech is transcribed, queued safely while AI speaks, delivered with acknowledgment, and rate-limited');
})().catch(e=>{console.error(e);process.exitCode=1});
