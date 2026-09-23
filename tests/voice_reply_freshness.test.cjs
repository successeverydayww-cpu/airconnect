'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const worker=fs.readFileSync(path.join(__dirname,'../../cf_migrate/air/deploy/worker.ts'),'utf8');
assert.ok(/const MIN_CLIENT = 145;/.test(worker),'minimum version');
assert.ok(/const CUR_CLIENT = 145;/.test(worker),'current version');
assert.ok(/if \(!\(await b44VoiceFresh\(db, p\)\)\) return \{ ok: true \};\s*const st = await loadState\(db\)/.test(worker),'check again before storing reply');
assert.ok(/if \(voice\) await b44RememberVoice\(db, from, voice\);/.test(worker),'remember newest voice turn');
(async()=>{
const start=worker.indexOf('function b44VoiceNewer('),end=worker.indexOf('async function b44SendAndStore(',start);
assert.ok(start>0&&end>start);
const esbuild=require('../../cf_migrate/node_modules/esbuild');
const js=esbuild.transformSync(worker.slice(start,end),{loader:'ts',target:'es2022'}).code;
const rows={};
const ctx={
 getByKey:async(db,entity,key)=>rows[key]||null,
 updateRec:async(db,entity,id,data)=>{const row=Object.values(rows).find(r=>r.id===id);Object.assign(row,data);}
};
vm.createContext(ctx);vm.runInContext(js,ctx);
const db={entities:{AirConnectSettings:{create:async data=>{const row={id:String(Object.keys(rows).length+1),...data};rows[data.k]=row;return row;}}}};
const older={session:'vfromone0001',started:100,seq:1},newer={session:'vfromone0001',started:100,seq:2};
assert.equal(ctx.b44VoiceNewer(older,newer),false,'older turn cannot overwrite newer marker');
assert.equal(ctx.b44VoiceNewer(newer,older),true,'newer turn wins');
await ctx.b44RememberVoice(db,'111111111',older);
assert.equal(await ctx.b44VoiceFresh(db,{from:'111111111',voice:older}),true,'first question remains current');
await ctx.b44RememberVoice(db,'111111111',newer);
assert.equal(await ctx.b44VoiceFresh(db,{from:'111111111',voice:older}),false,'prior answer suppressed');
assert.equal(await ctx.b44VoiceFresh(db,{from:'111111111',voice:newer}),true,'latest answer delivered');
await ctx.b44RememberVoice(db,'111111111',older);
assert.equal(await ctx.b44VoiceFresh(db,{from:'111111111',voice:newer}),true,'delayed older request cannot reset marker');
const nextCall={session:'vnextcall0001',started:200,seq:0};
await ctx.b44RememberVoice(db,'111111111',nextCall);
assert.equal(await ctx.b44VoiceFresh(db,{from:'111111111',voice:newer}),false,'new call supersedes old');
assert.equal(await ctx.b44VoiceFresh(db,{from:'111111111'}),true,'normal chat remains unaffected');
for(const page of ['app.html','caller.html','caller5.html']){
 const s=fs.readFileSync(path.join(__dirname,'..',page),'utf8');
 assert.match(s,/voice:\{session:call\.session,started:call\.started,seq:\+\+call\.turn\}/,page+' turn metadata');
 assert.match(s,/call\.queuedReplies=\[text\]/,page+' superseded queued speech');
}
console.log('PASS: latest spoken turn wins; old answer is suppressed before delivery');
})().catch(e=>{console.error(e);process.exitCode=1});
