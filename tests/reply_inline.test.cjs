'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
for(const name of ['app.html','caller.html','caller5.html']){
 const s=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
 assert.match(s,/const AC_V=147;/,name+' client version');
 assert.match(s,/now-call\.voiceAt>=350&&now-call\.recordAt>=450/,name+' third-second end-of-speech');
 assert.match(s,/\(AI_CALL&&AI_CALL\.on\)\?250:/,name+' fast sync poll during AI calls');
 assert.match(s,/wu\.volume=0;s\.speak\(wu\)/,name+' TTS warmup at call start');
 assert.match(s,/if\(reply\.reply&&call===AI_CALL&&call\.on\)\{call\.lastSpokenReply=/,name+' speaks the inline voice reply');
 assert.match(s,/if\(opened&&opened\.reply&&greetingCall===AI_CALL/,name+' speaks the inline greeting');
 assert.match(s,/if\(!\(AI_CALL\.lastSpokenReply&&t===AI_CALL\.lastSpokenReply\.t&&Date\.now\(\)-AI_CALL\.lastSpokenReply\.at<15000\)\)aiSpeak\(t\)/,name+' never speaks the same reply twice');
}
const w=fs.readFileSync(path.join(__dirname,'..','..','cf_migrate','air','deploy','worker.ts'),'utf8');
assert.match(w,/reply: reply\.slice\(0, 2000\)/,'relay returns the reply text');
assert.match(w,/await Promise\.race\(\[job, new Promise\(\(r\) => setTimeout\(\(\) => r\(null\), 25000\)\)\]\)/,'voice turns await the reply inline');
assert.match(w,/return json\(\{ ok: true, id: now, reply: rep \}\)/,'chat response carries the voice reply');
console.log('PASS: inline reply delivery, fast VAD, warm TTS, duplicate suppression — client and relay');
