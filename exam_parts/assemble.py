#!/usr/bin/env python3
"""Assemble exam.html from head.html + bank parts + engine.js. v2 (24 Sep 2026)."""
import json,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
subs={}
for f in sorted(os.listdir('.')):
    if f.endswith('.py') and f not in ('assemble.py','__init__.py'):
        ns={}
        exec(compile(open(f).read(),f,'exec'),ns)
        name,qs=ns['NAME'],ns['Q']
        for i,q in enumerate(qs):
            assert len(q)==5 and q[2] in (0,1,2,3) and len(str(q[1]).split('|'))==4, (f,name,i)
        subs[name]=qs
jamb={n:subs[n] for n in ["English","Mathematics","Physics","Chemistry","Biology","Economics","Government","Literature","Christian Religious Studies","Geography","History","Agricultural Science"]}
BANKS={
 "jamb":{"label":"JAMB UTME (Nigeria)","subs":jamb},
 "waec":{"label":"WAEC / WASSCE","same":"jamb"},
 "neco":{"label":"NECO SSCE","same":"jamb"},
 "bece":{"label":"BECE (Junior WAEC)","same":"jamb"},
 "satu":{"label":"SAT (USA)","subs":{"Math":subs["SAT Math"],"Reading & Writing":subs["SAT Reading & Writing"]}},
 "act":{"label":"ACT (USA)","same":"satu"},
 "gcse":{"label":"GCSE (UK)","subs":{"Mathematics":"jamb.Mathematics","English":"jamb.English","Physics":"jamb.Physics","Chemistry":"jamb.Chemistry","Biology":"jamb.Biology","Geography":"jamb.Geography","History":"jamb.History","Economics":"jamb.Economics","Agricultural Science":"jamb.Agricultural Science"}},
 "kcse":{"label":"KCSE (Kenya)","subs":{"Mathematics":"jamb.Mathematics","English":"jamb.English","Biology":"jamb.Biology","Physics":"jamb.Physics","Chemistry":"jamb.Chemistry","Geography":"jamb.Geography","History":"jamb.History","Christian Religious Education":"jamb.Christian Religious Studies","Agriculture":"jamb.Agricultural Science"}},
 "nsc":{"label":"NSC Matric (South Africa)","same":"kcse"},
 "jee":{"label":"JEE Main (India)","subs":{"Mathematics":"jamb.Mathematics","Physics":"jamb.Physics","Chemistry":"jamb.Chemistry"}},
 "neet":{"label":"NEET (India)","subs":{"Physics":"jamb.Physics","Chemistry":"jamb.Chemistry","Biology":"jamb.Biology"}},
 "ielts":{"label":"IELTS (Global)","subs":{"Academic Practice":subs["IELTS Academic Practice"]}},
 "toefl":{"label":"TOEFL (Global)","same":"ielts"}
}
COUNTRY=''  # replaced below
country="""var COUNTRY={
"Nigeria":["jamb","waec","neco","bece"],
"Ghana":["waec","bece","ielts","toefl"],
"Kenya":["kcse","ielts","toefl"],
"South Africa":["nsc","ielts","toefl"],
"USA":["satu","act","toefl"],
"UK":["gcse","ielts","toefl"],
"India":["jee","neet","ielts"],
"Global":["ielts","toefl","satu","gcse","kcse","jamb","waec","jee","neet","nsc","act","neco","bece"]
};
"""
bank_json=json.dumps(BANKS,ensure_ascii=False,separators=(',',':'))
head=open('head.html').read(); engine=open('engine.js').read()
marker="/* ===== Exam Prep engine v2"
html=head+"\nvar BANKS="+bank_json+";\n"+country+engine+"\n</script>\n</body>\n</html>\n"
assert marker in html and "var COUNTRY" in html
open('../exam.html','w',encoding='utf-8').write(html)
print("assembled exam.html OK,", round(len(html)/1024,1), "KB")
