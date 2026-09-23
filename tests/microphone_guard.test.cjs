'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
for(const page of ['app.html','caller.html','caller5.html']){
  const html=fs.readFileSync(path.join(__dirname,'..',page),'utf8');
  assert.match(html,/const AC_V=143;/,page+' client version');
  assert.match(html,/id="micNotice"[^>]*role="status"/,page+' persistent mic notice');
  assert.match(html,/id="micEnable"[^>]*onclick="enableCallMic\(\)"/,page+' in-call recovery button');
  assert.match(html,/setInterval\(callMicTick,250\)/,page+' meter refresh');
  assert.match(html,/AI_MIC_CTX\.createMediaStreamSource\(mic\)\.connect\(txAnalyser\)/,page+' actual AI mic analyser');
  assert.match(html,/if\(!MIC_WARN_AT\|\|Date\.now\(\)-MIC_WARN_AT>=5000\)/,page+' five-second disabled reminder');
  assert.match(html,/MIC_WARN_AT=0;\$\("micNotice"\)\.className="cstat hide"/,page+' notice cleanup');
  assert.doesNotMatch(html,/catch\(e\)\{toast\("Allow microphone to make voice calls"\);callCleanup\(\);return;\}/,page+' denied mic does not auto-hangup');
  const start=html.indexOf('function callMicTick(){');
  const end=html.indexOf('async function enableCallMic(){',start);
  assert.ok(start>0&&end>start,page+' mic tick found');
  const elements={callview:{className:'ovl'},micNotice:{className:'cstat hide',style:{},textContent:''},micEnable:{className:'hide',textContent:''},tx:{style:{width:'0%'}}};
  const warnings=[];
  let now=100000,measurements=0;
  const sandbox={
    $:id=>elements[id],state:'live',mic:null,muted:false,AI_CALL:null,txAnalyser:null,
    Date:{now:()=>now},toast:s=>warnings.push(s),meter:()=>{measurements++;return .08;},
    setupAiMicMeter(){this.txAnalyser={}}
  };
  vm.createContext(sandbox);
  vm.runInContext('var MIC_WARN_AT=0;'+html.slice(start,end),sandbox);
  sandbox.callMicTick();
  assert.equal(warnings.length,1,page+' immediately warns when mic absent');
  assert.match(elements.micNotice.textContent,/Microphone off/,page+' actionable off state');
  assert.equal(elements.micEnable.className,'',page+' recovery button visible');
  now+=4999;sandbox.callMicTick();assert.equal(warnings.length,1,page+' not before five seconds');
  now++;sandbox.callMicTick();assert.equal(warnings.length,2,page+' repeats at five seconds');
  sandbox.mic={getAudioTracks:()=>[{readyState:'live',enabled:true,muted:false}]};
  sandbox.txAnalyser={};sandbox.callMicTick();
  assert.equal(warnings.length,2,page+' silent when mic enabled');
  assert.ok(measurements>0,page+' audio meter samples microphone');
  assert.equal(elements.micEnable.className,'hide',page+' recovery button hidden when live');
  now+=6000;sandbox.muted=true;sandbox.callMicTick();
  assert.equal(warnings.length,3,page+' warns when user mutes');
  assert.match(elements.micEnable.textContent,/Unmute/,page+' directs user to unmute');
  assert.equal(elements.tx.style.width,'0%',page+' meter clears when muted');
  elements.callview.className='ovl hide';now+=10000;sandbox.callMicTick();
  assert.equal(warnings.length,3,page+' no reminders after call closes');
}
assert.match(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),/airconnect-v143/);
console.log('PASS: AI and human calls show local mic activity, off/muted mic prompts every 5 seconds, retries stay available, cleanup stops prompts');
