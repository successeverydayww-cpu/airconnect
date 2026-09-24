/* ===== Exam Prep engine v2 (skylar, 24 Sep 2026) =====
   50-question timed CBT papers, hard-mode bank, in-app video lessons (no YouTube redirect),
   randomized draw + answer-position shuffle so every retake looks different. */
var sel={c:null,ex:null,sub:null,pool:[],q:[],i:0,answers:[],perms:[],t:null,left:0,perq:45};
var R=document.getElementById("root");
function h(s){R.innerHTML=s;window.scrollTo(0,0);}
function fmt(sec){var m=Math.floor(sec/60),s2=sec%60;return m+":"+String(s2).padStart(2,"0");}
function bank(ex){var d=BANKS[ex];return d.same?BANKS[d.same]:d;}
function subs(ex){var b=bank(ex);var s=b.subs||{};return s;}
function resolveRef(ref){var p=ref.split(".");return (BANKS[p[0]].same?BANKS[BANKS[p[0]].same]:BANKS[p[0]]).subs[p[1]];}
function poolFor(ex,sub){var b=bank(ex);var v=b.subs[sub];if(typeof v==="string")return resolveRef(v);return v;}
function ytQ(ex,sub,topic){return bank(ex).label.split(" (")[0]+" "+sub+" "+topic+" full lesson";}
/* ---------- in-app player (embedded, never a redirect) ---------- */
function playTopic(topic){
  var q=ytQ(sel.ex,sel.sub,topic);
  document.getElementById("vtitle").textContent=topic+" — "+sel.sub;
  document.getElementById("vframe").src="https://www.youtube-nocookie.com/embed?listType=search&list="+encodeURIComponent(q)+"&autoplay=1";
  document.getElementById("vwrap").className="ovl";
}
function closeVid(){var f=document.getElementById("vframe");f.src="";document.getElementById("vwrap").className="ovl hide";}
/* ---------- flow ---------- */
function home(){
 closeVid();if(sel.t)clearInterval(sel.t);
 sel={c:null,ex:null,sub:null,pool:[],q:[],i:0,answers:[],perms:[],t:null,left:0,perq:45};
 h('<div class="card"><h2>1 · Pick your country</h2><div class="chips">'+
   Object.keys(COUNTRY).map(function(c){return '<button class="chip" onclick="pickC(this.textContent)">'+c+'</button>';}).join("")+
   '</div><div class="note">Every paper is 50 hard questions with a live countdown, full explanations on review, and topic lessons that play inside the app.</div></div><div id="step2"></div><div id="step3"></div>');
}
function pickC(c){sel.c=c;sel.ex=null;sel.sub=null;
 document.getElementById("step2").innerHTML='<div class="card"><h2>2 · Pick your exam</h2><div class="chips">'+
  COUNTRY[c].map(function(e){return '<button class="chip" onclick="pickEx(\''+e+'\')">'+bank(e).label+'</button>';}).join("")+'</div></div><div id="step3"></div>';
 window.scrollTo(0,document.body.scrollHeight);
}
function pickEx(e){sel.ex=e;sel.sub=null;
 var s=subs(e),names=Object.keys(s);
 document.getElementById("step3").innerHTML='<div class="card"><h2>3 · Pick a subject — '+bank(e).label+'</h2>'+
  '<div class="chips">'+names.map(function(n){var p=poolFor(e,n);return '<button class="chip" onclick="pickSub(\''+n.replace(/'/g,"\\'")+'\')">'+n+' · '+(p?p.length:0)+' q</button>';}).join("")+'</div></div><div id="step4"></div>';
 window.scrollTo(0,document.body.scrollHeight);
}
function pickSub(s){
 sel.sub=s;var pool=poolFor(sel.ex,s);sel.pool=pool;
 var topics=[];(pool||[]).forEach(function(q){if(topics.indexOf(q[4])<0)topics.push(q[4]);});
 document.getElementById("step4").innerHTML='<div class="card"><h2>'+bank(sel.ex).label+' — '+s+'</h2>'+
  '<div style="font-size:12.5px;color:var(--mut);margin-bottom:9px">📺 Tap any topic below — the lesson plays right here in the app.</div>'+
  '<div class="chips">'+topics.map(function(t){return '<button class="chip count" onclick="playTopic(this.textContent)">▶ '+t+'</button>';}).join("")+'</div>'+
  '<div class="note">'+(pool?pool.length:0)+' hard questions in this bank. The paper draws 50 (or the whole bank) at random, with answers reshuffled every attempt — retakes always look different.</div>'+
  '<button class="btn g" onclick="startPractice(50)">▶ Start 50-question CBT ('+Math.round(50*sel.perq/60)+' min)</button>'+
  '<button class="btn o" onclick="startPractice(20)">▶ Quick 20 practice</button>';
 window.scrollTo(0,document.body.scrollHeight);
}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function startPractice(n){
 closeVid();
 var all=shuffle(sel.pool||[]);
 sel.q=all.slice(0,Math.min(n,all.length));
 sel.i=0;sel.answers=[];sel.perms=[];
 for(var k=0;k<sel.q.length;k++){sel.perms.push(shuffle([0,1,2,3]));sel.answers.push(undefined);}
 sel.left=sel.q.length*sel.perq;
 if(sel.t)clearInterval(sel.t);
 sel.t=setInterval(function(){sel.left--;var el=document.getElementById("tm");if(el){el.textContent=fmt(sel.left);if(sel.left<=30)el.className="timer low";}if(sel.left<=0)finish();},1000);
 renderQ();
}
function opts(q,perm){var o=String(q[1]).split("|");return perm.map(function(i){return o[i];});}
function renderQ(){
 var q=sel.q[sel.i],perm=sel.perms[sel.i],os=opts(q,perm);
 h('<div class="qcard"><div class="qhead"><span>Question '+(sel.i+1)+' of '+sel.q.length+'</span><span class="timer" id="tm">'+fmt(sel.left)+'</span></div>'+
  '<div class="bar"><i style="width:'+Math.round(sel.i/sel.q.length*100)+'%"></i></div>'+
  '<button class="topic" onclick="playTopic(this.textContent)">'+q[4]+'</button><div class="qq">'+q[0]+'</div>'+
  os.map(function(o,k){return '<button class="opt" onclick="pick('+k+')">'+String.fromCharCode(65+k)+". "+o+'</button>';}).join("")+
  '<div class="nav"><button class="btn o" style="'+(sel.i===0?"visibility:hidden":"")+'" onclick="prev()">← Prev</button>'+
  '<button class="btn g" onclick="next()">'+(sel.i===sel.q.length-1?"Submit ✓":"Next →")+'</button></div>'+
  '<button class="btn o" style="margin-top:10px" onclick="if(confirm(\'Submit now?\'))finish()">End & submit</button></div>');
 if(sel.answers[sel.i]!==undefined){var b2=document.querySelectorAll(".opt")[sel.answers[sel.i]];if(b2)b2.className="opt picked";}
}
function pick(k){sel.answers[sel.i]=k;var os=document.querySelectorAll(".opt");for(var j=0;j<os.length;j++)os[j].className="opt";if(os[k])os[k].className="opt picked";}
function prev(){if(sel.i>0){sel.i--;renderQ();}}
function next(){if(sel.i<sel.q.length-1){sel.i++;renderQ();}else finish();}
function finish(){
 if(sel.t)clearInterval(sel.t);closeVid();
 var right=0,rows="";
 for(var i=0;i<sel.q.length;i++){
  var q=sel.q[i],perm=sel.perms[i],ans=sel.answers[i];
  var shown=perm.indexOf(q[2]); /* bank answer index mapped to displayed position */
  var ok=ans===shown;if(ok)right++;
  rows+='<div class="qcard"><button class="topic" onclick="playTopic(this.textContent)">'+q[4]+'</button><div class="qq">'+q[0]+'</div>'+
   opts(q,perm).map(function(o,k){return '<button class="opt '+(k===shown?"right":(ans===k?"wrong":""))+'" disabled>'+String.fromCharCode(65+k)+". "+o+'</button>';}).join("")+
   (ok?'<div class="expl">✅ Correct. '+q[3]+'</div>':'<div class="expl">'+(ans===undefined?"⏱ Not answered. ":"❌ Incorrect. ")+'Correct answer: '+String.fromCharCode(65+shown)+". "+q[3]+'</div>')+
   '<button class="topic" style="margin-top:8px" onclick="playTopic(this.textContent)">📺 Revise: '+q[4]+'</button></div>';
 }
 var pct=sel.q.length?Math.round(right/sel.q.length*100):0;
 var msg=pct>=80?"Elite zone — you are exam ready. 🏆":pct>=60?"Strong. Hunt down every topic you missed. 💪":"No retreat — read each explanation and run it again. 📚";
 h('<div class="card" style="text-align:center"><div class="score">'+pct+'%</div><div style="color:var(--mut);margin-bottom:5px">'+right+' of '+sel.q.length+' correct · '+bank(sel.ex).label+' · '+sel.sub+'</div><div style="font-weight:600">'+msg+'</div>'+
  '<button class="btn g" onclick="startPractice(50)">↻ Retake (new random paper)</button>'+
  '<button class="btn o" onclick="home()">Choose another paper</button></div>'+rows);
}
function goHome(){location.href="/app";}
home();
