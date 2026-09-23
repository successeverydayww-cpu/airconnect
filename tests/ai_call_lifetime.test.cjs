'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
for(const page of ['app.html','caller.html','caller5.html']){
  const src=fs.readFileSync(require('node:path').join(__dirname,'..',page),'utf8');
  const found=src.match(/if\(state==="live"&&!pc&&\!\(AI_CALL&&AI_CALL\.on\)\)\{log\("auto-end: dead call link cleaned"\);callCleanup\(\);toast\("Call ended"\);\}/g)||[];
  assert.equal(found.length,1,page+' watchdog');
  for(const [ai,pc,expectEnd] of [[{on:true},null,false],[null,null,true],[null,{},false]]){
    let ended=0;
    vm.runInNewContext(found[0],{state:'live',AI_CALL:ai,pc,log(){},callCleanup(){ended++},toast(){} });
    assert.equal(!!ended,expectEnd,page+' ai='+!!ai+' pc='+!!pc);
  }
  assert.match(src,/if\(\+\+call\.noiseChunks===2\)/,page+' mic feedback');
  assert.match(src,/const AC_V=145;/,page+' version');
}
console.log('PASS: AI calls remain live after greeting, dead human links still close, speech errors surface');
