'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
(async()=>{
for(const page of ['app.html','caller.html','caller5.html']){
 const s=fs.readFileSync(path.join(__dirname,'..',page),'utf8');
 assert.match(s,/const AC_V=148;/,page+' client version');
 assert.match(s,/id="aiSpeechStatus"/,page+' actual-delivery status');
 assert.doesNotMatch(s,/AI_CALL\.rec\.start\(7000\)|,3500\)/,page+' no fixed speech slice');
 assert.match(s,/if\(AI_CALL&&AI_CALL\.on&&txAnalyser\)aiVoiceActivity\(AI_CALL,rms\)/,page+' meter-based speech detection');
 const timers=new Map();let nextTimer=1,now=100000,stt=0,chats=0,transcript='Hello Samuel';
 const statuses={aiSpeechStatus:{className:'hide',textContent:''}};
 const recorders=[];
 class Recorder{
  static isTypeSupported(){return true;}
  constructor(){this.state='inactive';recorders.push(this);}
  start(){this.state='recording';}
  stop(){assert.equal(this.state,'recording');this.state='inactive';this.ondataavailable({data:new Blob([Buffer.alloc(1200)],{type:'audio/webm'})});this.onstop();}
 }
 const context={
  $:id=>statuses[id],Date:{now:()=>now},Promise,Blob,Uint8Array,String,MediaRecorder:Recorder,txAnalyser:{},
  btoa:s=>Buffer.from(s,'binary').toString('base64'),
  setTimeout:(fn,delay)=>{const id=nextTimer++;timers.set(id,{fn,delay});return id;},
  clearTimeout:id=>timers.delete(id),
  mic:{getAudioTracks:()=>[{readyState:'live',enabled:true,muted:false}]},
  toast:()=>{},ME:'111111111',ME_NAME:'Test user',e2eEnc:async(peer,text)=>text,
  api:async(act,payload)=>{if(act==='stt'){stt++;return {ok:true,text:transcript};}if(act==='chat'){chats++;return {ok:true};}throw Error('unexpected '+act);}
 };
 vm.createContext(context);
 const begin=s.indexOf('let AI_CALL=null,AI_AC=null;');
 const helpersEnd=s.indexOf('async function aiCall(p)',begin);
 const sttBegin=s.indexOf('function aiSTT(){',helpersEnd);
 const sttEnd=s.indexOf('\ndocument.addEventListener("click",e=>{',sttBegin);
 assert.ok(begin>=0&&helpersEnd>begin&&sttBegin>helpersEnd&&sttEnd>sttBegin,page+' test extraction');
 vm.runInContext(s.slice(begin,helpersEnd)+s.slice(sttBegin,sttEnd),context);
 vm.runInContext('AI_CALL={on:true,peer:"222222222",speaking:false,tries:0,noiseChunks:0,pending:"",sentAt:[],lastSent:0,rec:null,recTimer:null,sendTimer:null};',context);
 const call=vm.runInContext('AI_CALL',context);
 context.aiSTT();assert.equal(recorders.length,1,page+' begins recording');
 const first=recorders[0];assert.equal(first.state,'recording');
 now+=250;context.aiVoiceActivity(call,.03);
 now+=300;context.aiVoiceActivity(call,.001);
 assert.equal(first.state,'recording',page+' pauses within an utterance do not cut the recording');
 now+=250;call.speaking=true;first.stop();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(stt,1,page+' transcribes pre-greeting speech');
 assert.equal(chats,0,page+' queues words while AI speaks');
 assert.match(call.pending,/Hello Samuel/,page+' preserves speech');
 call.speaking=false;context.aiSTT();context.aiSendHeard(call);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(chats,1,page+' sends recognized words after AI finishes');
 assert.match(statuses.aiSpeechStatus.textContent,/Waiting for my reply/,page+' confirms delivery');
 assert.equal(recorders.length,2,page+' starts a fresh recorder');
 now+=250;context.aiVoiceActivity(call,.03);
 now+=250;context.aiVoiceActivity(call,.001);
 assert.equal(recorders[1].state,'recording',page+' keeps recording through a brief mid-sentence pause');
 now+=100;context.aiVoiceActivity(call,.001);
 assert.equal(recorders[1].state,'inactive',page+' ends completed speech a third of a second after silence');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(chats,1,page+' duplicate transcript suppressed without a stale response');
 transcript='How are you doing?';
 context.aiSTT(); // scheduled restart is controlled by the test clock
 const rec=recorders.at(-1);now+=200;context.aiVoiceActivity(call,.03);
 now+=600;context.aiVoiceActivity(call,.001);
 assert.equal(rec.state,'inactive',page+' new utterance ends at silence');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(chats,2,page+' new question sends immediately rather than waiting 7.5 seconds');
 transcript='[pause] [pause]';context.aiSTT();
 const quiet=recorders.at(-1);now+=100;context.aiVoiceActivity(call,.03);
 now+=700;context.aiVoiceActivity(call,.001);
 assert.equal(quiet.state,'inactive',page+' noise terminates the audio slice');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(chats,2,page+' silence markers never prompt an AI response');
 assert.equal(context.aiTranscriptText('[mouse clicking] Where is your name?'),'Where is your name?',page+' strips environmental annotations but preserves speech');
}
console.log('PASS: end-of-speech detection, fresh-turn replies, duplicate and pause suppression, preserved pre-greeting speech');
})().catch(e=>{console.error(e);process.exitCode=1});
