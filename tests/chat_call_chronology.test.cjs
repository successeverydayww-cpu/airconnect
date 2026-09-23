'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
for(const page of ['app.html','caller.html','caller5.html']){
 const s=fs.readFileSync(path.join(__dirname,'..',page),'utf8');
 const start=s.indexOf('function chatTimeMs(value){'),end=s.indexOf('function renderBubbles(){',start);
 assert.ok(start>0&&end>start,page+' timeline functions');
 const ctx={Date,Number,String};vm.createContext(ctx);vm.runInContext(s.slice(start,end),ctx);
 const at=t=>new Date('2026-09-23T'+t+':00+01:00').getTime();
 const message=(time,id)=>({ts:new Date(at(time)).toISOString(),id});
 const call=(time,id)=>({at:at(time),id});
 const ev=ctx.chatTimeline([message('07:02','new-message'),message('06:58','old-message')],[call('07:00','missed-call')]);
 assert.deepEqual(Array.from(ev,e=>e.m?e.m.id:e.c.id),['old-message','missed-call','new-message'],page+' call before later message');
 assert.equal(ctx.chatTimeMs(new Date(at('07:02')).toISOString()),at('07:02'),page+' ISO conversion');
 assert.equal(ctx.chatTimeMs(at('07:00')),at('07:00'),page+' numeric time');
 const next=ctx.chatTimeline([message('07:02','message')],[call('07:05','new-call')]);
 assert.deepEqual(Array.from(next,e=>e.m?e.m.id:e.c.id),['message','new-call'],page+' new call after earlier message');
 assert.match(s,/if\(event\.c\)\{b\.appendChild\(callPill\(event\.c\)\);continue;\}/,page+' actual renderer uses timeline');
 assert.doesNotMatch(s,/cevs\[ci\]\.at<=\(m\.ts\|\|0\)/,page+' no numeric-to-ISO comparison');
}
console.log('PASS: per-chat call and message events display oldest above newest across timestamp formats');
