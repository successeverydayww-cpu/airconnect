'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
(async()=>{
for(const name of ['app.html','caller.html','caller5.html']){
 const html=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
 const block=html.slice(html.indexOf('async function aiSpeak(text){'),html.indexOf('function aiOnMsg(',html.indexOf('async function aiSpeak(text){')));
 let timer,network=0,listening=0,sent=0,canceled=0,speaking=0,lastUtterance;
 const synth={getVoices:()=>[{lang:'en-NG'}],cancel:()=>canceled++,speak:u=>{speaking++;lastUtterance=u}};
 const call={on:true,rec:null,speaking:false,pending:''};
 const ctx={AI_CALL:call,AI_AC:null,window:{speechSynthesis:synth,SpeechSynthesisUtterance:function(t){this.text=t;}},
   setTimeout:fn=>{timer=fn;return 1},clearTimeout:()=>{timer=null},
   aiVoiceStatus:()=>{},aiSTT:()=>listening++,aiSendHeard:()=>sent++,
   fetch:async()=>{network++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(16)}},FN:'https://example.invalid',
   Promise,Date,JSON,String};
 vm.createContext(ctx);vm.runInContext(block,ctx);
 ctx.aiSpeak('A quick reply');
 assert.equal(speaking,1,name+' starts built-in voice');assert.equal(network,0,name+' does not wait for cloud synthesis');
 lastUtterance.onstart();lastUtterance.onend();
 assert.equal(listening,1,name+' resumes listening');assert.equal(network,0,name+' does not charge cloud synthesis on success');
 ctx.aiSpeak('Second reply');
 assert.ok(timer,name+' has a startup safety timer');timer();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(network,1,name+' uses existing cloud voice when built-in voice never starts');
 assert.ok(canceled>=2,name+' cancels stalled utterance');
}
console.log('PASS: immediate device speech, cloud fallback only when needed');
})().catch(e=>{console.error(e);process.exitCode=1});
