'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
for(const name of ['app.html','caller.html','caller5.html']){
 const s=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
 assert.match(s,/const AC_V=148;/,name+' client version');
 assert.match(s,/now-call\.voiceAt>=350&&now-call\.recordAt>=450/,name+' third-second end-of-speech');
 assert.match(s,/\(AI_CALL&&AI_CALL\.on\)\?250:/,name+' fast sync poll during AI calls');
 assert.match(s,/wu\.volume=0;s\.speak\(wu\)/,name+' TTS warmup at call start');
 assert.match(s,/if\(reply\.reply&&call===AI_CALL&&call\.on\)\{/,name+' handles the inline voice reply');
 assert.match(s,/if\(opened&&opened\.reply&&greetingCall===AI_CALL/,name+' handles the inline greeting');
 assert.match(s,/if\(!\(AI_CALL\.lastSpoken&&t===AI_CALL\.lastSpoken\.t&&Date\.now\(\)-AI_CALL\.lastSpoken\.at<15000\)\)\{AI_CALL\.lastSpoken=/,name+' sync path shares the spoken record');
}
const w=fs.readFileSync(path.join(__dirname,'..','..','cf_migrate','air','deploy','worker.ts'),'utf8');
assert.match(w,/reply: reply\.slice\(0, 2000\)/,'relay returns the reply text');
assert.match(w,/await Promise\.race\(\[job, new Promise\(\(r\) => setTimeout\(\(\) => r\(null\), 25000\)\)\]\)/,'voice turns await the reply inline');
assert.match(w,/return json\(\{ ok: true, id: now, reply: rep \}\)/,'chat response carries the voice reply');
console.log('PASS: inline reply delivery, fast VAD, warm TTS, duplicate suppression — client and relay');
