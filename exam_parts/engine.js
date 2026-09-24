/* ===== Exam Prep engine v3 (skylar, 24 Sep 2026) — same v2 contract plus:
   correct per-exam labels (WAEC/NECO/BECE no longer show as JAMB), diagram questions (inline SVG),
   full interface language support driven by the app language setting, and curated in-app
   video lessons (YouTube's dead search-embed API replaced with verified lesson videos). ===== */
var sel={c:null,ex:null,sub:null,pool:[],q:[],i:0,answers:[],perms:[],t:null,left:0,perq:45};
var R=document.getElementById("root");
function h(s){R.innerHTML=s;window.scrollTo(0,0);}
function fmt(sec){var m=Math.floor(sec/60),s2=sec%60;return m+":"+String(s2).padStart(2,"0");}
function bank(ex){var d=BANKS[ex];return d.same?BANKS[d.same]:d;}
/* v153.2 fix: an exam that borrows another's bank (same) keeps its OWN label */
function labelOf(ex){return (BANKS[ex]&&BANKS[ex].label)||bank(ex).label;}
function subs(ex){var b=bank(ex);var s=b.subs||{};return s;}
function resolveRef(ref){var p=ref.split(".");return (BANKS[p[0]].same?BANKS[BANKS[p[0]].same]:BANKS[p[0]]).subs[p[1]];}
function poolFor(ex,sub){var b=bank(ex);var v=b.subs[sub];if(typeof v==="string")return resolveRef(v);return v;}
/* ---------- language (shared with the AirConnect app via ac_lang) ---------- */
var LANG="en";try{LANG=(localStorage.getItem("ac_lang")||"en").split("-")[0];}catch(e){}
var LANGS=[["en","English"],["zh","中文"],["yo","Yorùbá"],["ig","Igbo"],["ha","Hausa"],["pcm","Pidgin"],["fr","Français"],["es","Español"],["pt","Português"],["ar","العربية"],["hi","हिन्दी"],["sw","Kiswahili"],["de","Deutsch"],["ru","Русский"],["tr","Türkçe"],["am","አማርኛ"],["so","Soomaali"],["tw","Twi"],["zu","isiZulu"],["ef","Efịk"],["ib","Ibibio"]];
var I18N={
 en:{k1:"1 · Pick your country",k2:"2 · Pick an exam",k3:"3 · Pick a subject — ",kblurb:"Every paper is 50 hard questions with a live countdown, full explanations on review, and topic lessons that play inside the app.",ktap:"📺 Tap any topic below — the lesson plays right here in the app.",kbank:" hard questions in this bank. The paper draws 50 (or the whole bank) at random, with answers reshuffled every attempt — retakes always look different.",kstart:"▶ Start 50-question CBT (",kquick:"▶ Quick 20 practice",kq:"Question ",kof:" of ",kprev:"← Prev",knext:"Next →",ksubmit:"Submit ✓",kend:"End & submit",kconfirm:"Submit now?",kcorrect:"✅ Correct. ",kinc:"❌ Incorrect. Correct answer: ",kna:"⏱ Not answered. ",krevise:"📺 Revise: ",kretake:"↻ Retake (new random paper)",kanother:"Choose another paper",klangnote:"Questions are in English while translated banks are being added — the interface and lessons already speak your language.",kvhint:"Playing free lessons inside the app — nothing redirects away. Tap Close to return.",kclose:"✕ Close",klang:"Language"},
 zh:{k1:"1 · 选择你的国家",k2:"2 · 选择考试",k3:"3 · 选择科目 — ",kblurb:"每份试卷50道高难度题，实时倒计时，复习附完整解析，视频课程在应用内播放。",ktap:"📺 点击任意主题 — 课程直接在应用内播放。",kbank:" 道高难度题在此题库中。试卷随机抽取50题（或全部），每次作答选项顺序都会打乱 — 重考永不重样。",kstart:"▶ 开始50题CBT模拟（",kquick:"▶ 快速20题练习",kq:"第",kof:"题，共",kprev:"← 上一题",knext:"下一题 →",ksubmit:"提交 ✓",kend:"结束并提交",kconfirm:"现在提交吗？",kcorrect:"✅ 正确。 ",kinc:"❌ 错误。正确答案： ",kna:"⏱ 未作答。 ",krevise:"📺 复习： ",kretake:"↻ 重考（全新随机试卷）",kanother:"选择其他试卷",klangnote:"中文题库正在扩充中，当前题目以英文显示 — 界面与课程已支持中文。",kvhint:"课程在应用内播放，不会跳转。点击关闭返回。",kclose:"✕ 关闭",klang:"语言"},
 fr:{k1:"1 · Choisis ton pays",k2:"2 · Choisis ton examen",k3:"3 · Choisis ta matière — ",kblurb:"Chaque épreuve compte 50 questions difficiles avec chronomètre, explications complètes à la révision, et leçons vidéo intégrées dans l'app.",ktap:"📺 Touche un sujet ci-dessous — la leçon se joue ici dans l'app.",kbank:" questions difficiles dans cette banque. L'épreuve tire 50 questions au hasard, réponses mélangées à chaque tentative.",kstart:"▶ Commencer le QCM de 50 questions (",kquick:"▶ Entraînement rapide de 20",kq:"Question ",kof:" sur ",kprev:"← Précédent",knext:"Suivant →",ksubmit:"Envoyer ✓",kend:"Terminer et envoyer",kconfirm:"Envoyer maintenant ?",kcorrect:"✅ Correct. ",kinc:"❌ Incorrect. Bonne réponse : ",kna:"⏱ Non répondu. ",krevise:"📺 Réviser : ",kretake:"↻ Refaire (nouvelle épreuve)",kanother:"Choisir une autre épreuve",klangnote:"Les questions sont en anglais pendant l'ajout des banques traduites — l'interface et les leçons sont déjà dans ta langue.",kvhint:"Leçons gratuites lues dans l'app, sans redirection. Touche Fermer pour revenir.",kclose:"✕ Fermer",klang:"Langue"},
 es:{k1:"1 · Elige tu país",k2:"2 · Elige tu examen",k3:"3 · Elige tu asignatura — ",kblurb:"Cada prueba tiene 50 preguntas difíciles con cuenta atrás, explicaciones completas al revisar y lecciones en vídeo dentro de la app.",ktap:"📺 Toca cualquier tema — la lección se reproduce aquí en la app.",kbank:" preguntas difíciles en este banco. La prueba saca 50 al azar, con respuestas reordenadas en cada intento.",kstart:"▶ Empezar examen de 50 preguntas (",kquick:"▶ Práctica rápida de 20",kq:"Pregunta ",kof:" de ",kprev:"← Anterior",knext:"Siguiente →",ksubmit:"Enviar ✓",kend:"Terminar y enviar",kconfirm:"¿Enviar ahora?",kcorrect:"✅ Correcto. ",kinc:"❌ Incorrecto. Respuesta correcta: ",kna:"⏱ Sin responder. ",krevise:"📺 Repasar: ",kretake:"↻ Repetir (nueva prueba)",kanother:"Elegir otra prueba",klangnote:"Las preguntas están en inglés mientras se añaden bancos traducidos — la interfaz y las lecciones ya hablan tu idioma.",kvhint:"Lecciones gratis dentro de la app, sin redirección. Toca Cerrar para volver.",kclose:"✕ Cerrar",klang:"Idioma"},
 pt:{k1:"1 · Escolha seu país",k2:"2 · Escolha seu exame",k3:"3 · Escolha sua matéria — ",kblurb:"Cada prova tem 50 questões difíceis com cronómetro, explicações completas na revisão e aulas em vídeo dentro do app.",ktap:"📺 Toque em qualquer tópico — a aula toca aqui no app.",kbank:" questões difíceis neste banco. A prova sorteia 50, com respostas reembaralhadas a cada tentativa.",kstart:"▶ Começar CBT de 50 questões (",kquick:"▶ Prática rápida de 20",kq:"Questão ",kof:" de ",kprev:"← Anterior",knext:"Próxima →",ksubmit:"Enviar ✓",kend:"Terminar e enviar",kconfirm:"Enviar agora?",kcorrect:"✅ Correto. ",kinc:"❌ Errado. Resposta correta: ",kna:"⏱ Não respondida. ",krevise:"📺 Revisar: ",kretake:"↻ Refazer (nova prova)",kanother:"Escolher outra prova",klangnote:"As questões estão em inglês enquanto bancos traduzidos são adicionados — a interface e as aulas já falam seu idioma.",kvhint:"Aulas grátis dentro do app, sem redirecionamento. Toque Fechar para voltar.",kclose:"✕ Fechar",klang:"Idioma"},
 yo:{k1:"1 · Yan orílẹ̀-èdè rẹ",k2:"2 · Yan ìdánwò rẹ",k3:"3 · Yan ìwọ rẹ — ",kblurb:"Ìdánwò kọ̀ọ̀kan ní àwọn ìbéèrè 50 tí ó le, pẹ̀lú ìdíwọ̀n ìgbà, alàyé gbogbo ìgbà ìtúpalẹ̀, àti ìkọ́ni fidio tí ó n ṣeré nínu àpẹ̀ rẹ.",ktap:"📺 Tẹ kòkànrélẹ̀ kọ̀ọ̀kan — ìkọ́ni náà máa ṣeré nínu àpẹ̀ rẹ.",kbank:" ìbéèrè tí ó le nínú bankí yìí. Ìdánwò máa yan 50 lọ́nà àjọyọ, pẹ̀lú ìdà sí ìdáhùn lóòrèkóòrè.",kstart:"▶ Bẹ̀rẹ̀ CBT ìbéèrè 50 (",kquick:"▶ Ṣéṣe 20 kíákíá",kq:"Ìbéèrẹ ",kof:" ninu ",kprev:"← Ìsáájú",knext:"Ẹ̀yìn →",ksubmit:"Fi → ✓",kend:"Parí àti fi",kconfirm:"Fi nísinsìnyí?",kcorrect:"✅ O tọ́. ",kinc:"❌ Aìtọ́. Ìdáhùn tọ́: ",kna:"⏱ Kò dáhùn. ",krevise:"📺 Kà á lẹ̀ẹ́: ",kretake:"↻ Tún ṣe (ìdánwò tuntun)",kanother:"Yan ìdánwò míràn",kvhint:"Ìkọ́ni ọ̀fẹ́ nínu àpẹ̀ rẹ, kò ní jáde kúrò. Tẹ Tí kọ́ láti padà.",kclose:"✕ Tí",klang:"Èdè"},
 ig:{k1:"1 · Họba mba gị",k2:"2 · Họba ule gị",k3:"3 · Họba isiokwu gị — ",kblurb:"Ule ọ bụla nwere ajụjụ 50 siri ike, na mgbakọ oge, nkọwa zuru ezu na nyocha, na nkuzi vidiyo na-egwu n'ime app.",ktap:"📺 Kụọ isiokwu ọ bụla — nkuzi ahụ na-egwu ebe a n'ime app.",kbank:" ajụjụ siri ike n'ụlọ akụ a. Ule ahụ na-emeptụ 50 n'ụzọ mberede, na-agbanwe usoro azịza kwa oge.",kstart:"▶ Malite CBT nke ajụjụ 50 (",kquick:"▶ Mụọ ngwa ngwa 20",kq:"Ajụjụ ",kof:" nke ",kprev:"← Ihe gara aga",knext:"Ọzọ →",ksubmit:"Zite ✓",kend:"Kwụsị ma zite",kconfirm:"Zite ugbu a?",kcorrect:"✅ Ziri ezi. ",kinc:"❌ Ezighi ezi. Azịza ziri ezi: ",kna:"⏱ Enyeghị azịza. ",krevise:"📺 Mụọkwa: ",kretake:"↻ Megharị (ule ọhụrụ)",kanother:"Họba ule ọzọ",kvhint:"Nkuzi n'efu n'ime app, enweghị mgbapụ. Kụọ Mechie iji laghachi.",kclose:"✕ Mechie",klang:"Asụsụ"},
 ha:{k1:"1 · Zaɓi ƙasar ka",k2:"2 · Zaɓi jarrabawar ka",k3:"3 · Zaɓi darasin ka — ",kblurb:"Kowace jarabawa tana da tambayoyi 50 masu wahala, da ƙididdiga lokaci, da cikakken bayani a sake duba, da koyar da bidiyo a cikin app.",ktap:"📺 Danna kowace batu — darasi yana aiki a cikin app.",kbank:" tambayoyi masu wahala a wannan bankin. Jarabawa tana zaɓar 50 cikin sa'a, tare da musanya matsayi amsa kowane lokaci.",kstart:"▶ Far CBT tambayoyi 50 (",kquick:"▶ Sauri 20",kq:"Tambaya ",kof:" daga ",kprev:"← Farko",knext:"Na gaba →",ksubmit:"Aika ✓",kend:"Karewa kuma aika",kconfirm:"Aika yanzu?",kcorrect:"✅ Daidai. ",kinc:"❌ Ba daidai ba. Amsar daidai: ",kna:"⏱ Ba a amsa ba. ",krevise:"📺 Karatu: ",kretake:"↻ Sake (jarabawa sabuwa)",kanother:"Zaɓi wata jarabawa",kvhint:"Koyarwar kyauta a cikin app, ba tafe waje. Danna Rufe don komo.",kclose:"✕ Rufe",klang:"Harshe"},
 pcm:{k1:"1 · Choos yu kontri",k2:"2 · Choos yu ezam",k3:"3 · Choos yu sabjek — ",kblurb:"Everi pesin na 50 had kweshon wit laif kaudaun, ful explenashon wen yu rivyu, an vidio lesin we de plai inside di app.",ktap:"📺 Tap eni topik — di lesin go plai right hia inside di app.",kbank:" had kweshon inside dis bank. Di pesin go draw 50 random, an di ansa posishon go shufl evri taim.",kstart:"▶ Stat 50-kweshon CBT (",kquick:"▶ Kwik 20 praktis",kq:"Kweshon ",kof:" of ",kprev:"← Bak",knext:"Neks →",ksubmit:"Submit ✓",kend:"End an submit",kconfirm:"Submit nau?",kcorrect:"✅ Koret. ",kinc:"❌ No koret. Di koret ansa na: ",kna:"⏱ Neva ansa. ",krevise:"📺 Rivyu: ",kretake:"↻ Try agen (new random pesin)",kanother:"Choos anoda pesin",kvhint:"Fifi lesin dey plai inside di app, e no go kari yu go anoda plais. Tap Close fo go bak.",kclose:"✕ Close",klang:"Langwej"},
 sw:{k1:"1 · Chagua nchi yako",k2:"2 · Chagua mtihani wako",k3:"3 · Chagua somo lako — ",kblurb:"Kila mtihani una maswali 50 magumu na kipima muda, maelezo kamili ukirudia, na masomo ya video yanayochezwa ndani ya programu.",ktap:"📺 Gusa mada yoyote — somo linachezwa hapa ndani ya programu.",kbank:" maswali magumu katika hili benki. Mtihani huchagua 50 kwa nasibu, na majibu hupangwa upya kila wakati.",kstart:"▶ Anza mtihani wa maswali 50 (",kquick:"▶ Haraka ya maswali 20",kq:"Swali ",kof:" kati ya ",kprev:"← Nyuma",knext:"Mbele →",ksubmit:"Tuma ✓",kend:"Maliza na kutuma",kconfirm:"Tuma sasa?",kcorrect:"✅ Sahihi. ",kinc:"❌ Si sahihi. Jibu sahihi: ",kna:"⏱ Hakuna jibu. ",krevise:"📺 Rudia: ",kretake:"↻ Rudia (mtihani mpya)",kanother:"Chagua mtihani mwingine",kvhint:"Masomo ya bure yanachezwa ndani ya programu, bila kuondoka. Gusa Funga kuiacha.",kclose:"✕ Funga",klang:"Lugha"},
 hi:{k1:"1 · अपना देश चुनें",k2:"2 · अपनी परीक्षा चुनें",k3:"3 · अपना विषय चुनें — ",kblurb:"हर पेपर में 50 कठिन प्रश्न हैं, लाइव काउंटडाउन के साथ, समीक्षा में पूर्ण व्याख्या, और ऐप के अंदर ही चलने वाले वीडियो पाठ।",ktap:"📺 कोई भी विषय चुनें — पाठ यहीं ऐप में चलेगा।",kbank:" कठिन प्रश्न इस बैंक में हैं। पेपर 50 प्रश्न यादृच्छिक रूप से चुनता है, हर बार उत्तर क्रम बदलता है।",kstart:"▶ 50-प्रश्न सीबीटी शुरू करें (",kquick:"▶ तेज़ 20 प्रश्न अभ्यास",kq:"प्रश्न ",kof:" / ",kprev:"← पिछला",knext:"अगला →",ksubmit:"जमा ✓",kend:"समाप्त कर जमा करें",kconfirm:"अभी जमा करें?",kcorrect:"✅ सही। ",kinc:"❌ गलत। सही उत्तर: ",kna:"⏱ उत्तर नहीं दिया। ",krevise:"📺 दोहराएँ: ",kretake:"↻ फिर से (नया पेपर)",kanother:"दूसरा पेपर चुनें",kvhint:"पाठ ऐप में ही चलते हैं, कहीं नहीं जाते। वापस जाने के लिए बंद दबाएँ।",kclose:"✕ बंद",klang:"भाषा"},
 ar:{k1:"1 · اختر بلدك",k2:"2 · اختر اختبارك",k3:"3 · اختر مادتك — ",kblurb:"كل اختبار يحتوي على 50 سؤالًا صعبًا مع عدّاد مباشر، وشروحات كاملة عند المراجعة، ودروس فيديو تعمل داخل التطبيق.",ktap:"📺 المس أي موضوع — الدرس يعمل هنا داخل التطبيق.",kbank:" سؤالًا صعبًا في هذا البنك. الاختبار يختار 50 عشوائيًا، مع تغيير ترتيب الإجابات في كل محاولة.",kstart:"▶ ابدأ اختبار 50 سؤالًا (",kquick:"▶ تدريب سريع 20 سؤالًا",kq:"السؤال ",kof:" من ",kprev:"← السابق",knext:"التالي →",ksubmit:"إرسال ✓",kend:"إنهاء وإرسال",kconfirm:"إرسال الآن؟",kcorrect:"✅ صحيح. ",kinc:"❌ خطأ. الإجابة الصحيحة: ",kna:"⏱ لم تتم الإجابة. ",krevise:"📺 مراجعة: ",kretake:"↻ إعادة (اختبار جديد)",kanother:"اختر اختبارًا آخر",kvhint:"الدروس تعمل داخل التطبيق مجانًا دون تحويل. المس إغلاق للعودة.",kclose:"✕ إغلاق",klang:"اللغة"},
 de:{k1:"1 · Wähle dein Land",k2:"2 · Wähle deine Prüfung",k3:"3 · Wähle dein Fach — ",kblurb:"Jede Arbeit hat 50 schwere Fragen mit Live-Countdown, vollständigen Erklärungen bei der Wiederholung und Video-Lektionen direkt in der App.",ktap:"📺 Tippe ein Thema an — die Lektion läuft hier in der App.",kbank:" schwere Fragen in dieser Bank. Die Arbeit zieht 50 zufällig, Antworten bei jedem Versuch neu gemischt.",kstart:"▶ 50-Fragen-CBT starten (",kquick:"▶ Schnelle 20 Übungsfragen",kq:"Frage ",kof:" von ",kprev:"← Zurück",knext:"Weiter →",ksubmit:"Abgeben ✓",kend:"Beenden und abgeben",kconfirm:"Jetzt abgeben?",kcorrect:"✅ Richtig. ",kinc:"❌ Falsch. Richtige Antwort: ",kna:"⏱ Nicht beantwortet. ",krevise:"📺 Wiederholen: ",kretake:"↻ Nochmal (neue Arbeit)",kanother:"Andere Arbeit wählen",kvhint:"Lektionen laufen kostenlos in der App, ohne Umleitung. Tippe Schließen zum Zurückkehren.",kclose:"✕ Schließen",klang:"Sprache"},
 ru:{k1:"1 · Выберите страну",k2:"2 · Выберите экзамен",k3:"3 · Выберите предмет — ",kblurb:"Каждая работа — 50 сложных вопросов с живым таймером, полными объяснениями при повторе и видеоуроками прямо в приложении.",ktap:"📺 Нажмите тему — урок воспроизводится здесь, в приложении.",kbank:" сложных вопросов в этом банке. Работа выбирает 50 случайно, порядок ответов меняется каждую попытку.",kstart:"▶ Начать CBT из 50 вопросов (",kquick:"▶ Быстрая практика из 20",kq:"Вопрос ",kof:" из ",kprev:"← Назад",knext:"Далее →",ksubmit:"Сдать ✓",kend:"Завершить и сдать",kconfirm:"Сдать сейчас?",kcorrect:"✅ Верно. ",kinc:"❌ Неверно. Правильный ответ: ",kna:"⏱ Нет ответа. ",krevise:"📺 Повторить: ",kretake:"↻ Ещё раз (новая работа)",kanother:"Выбрать другую работу",kvhint:"Уроки воспроизводятся в приложении, без перехода. Нажмите «Закрыть», чтобы вернуться.",kclose:"✕ Закрыть",klang:"Язык"},
 tr:{k1:"1 · Ülkeni seç",k2:"2 · Sınavını seç",k3:"3 · Dersini seç — ",kblurb:"Her sınavda canlı geri sayımlı 50 zorlu soru, tekrarda tam açıklamalar ve uygulama içinde oynayan video dersler vardır.",ktap:"📺 Herhangi bir konuya dokun — ders burada uygulama içinde oynar.",kbank:" zorlu soru bu bankada. Sınav 50 soruyu rastgele çeker, her denemede cevap sırası değişir.",kstart:"▶ 50 soruluk CBT'yi başlat (",kquick:"▶ Hızlı 20 soru pratiği",kq:"Soru ",kof:" / ",kprev:"← Önceki",knext:"Sonraki →",ksubmit:"Gönder ✓",kend:"Bitir ve gönder",kconfirm:"Şimdi gönderilsin mi?",kcorrect:"✅ Doğru. ",kinc:"❌ Yanlış. Doğru cevap: ",kna:"⏱ Cevaplanmadı. ",krevise:"📺 Tekrar et: ",kretake:"↻ Yeniden dene (yeni sınav)",kanother:"Başka bir sınav seç",kvhint:"Dersler uygulama içinde oynar, yönlendirme yok. Geri dönmek için Kapat'a dokun.",kclose:"✕ Kapat",klang:"Dil"},
 am:{k1:"1 · ሀገርህን ምረጥ",k2:"2 · ፈተናህን ምረጥ",k3:"3 · የትምህል ትምህርት ምረጥ — ",kq:"ጥያቄ ",kof:" ከ",kprev:"← ተመለስ",knext:"ቀጣይ →",kclose:"✕ ዝጋ",klang:"ቋንቋ"},
 so:{k1:"1 · Doorta wadankaaga",k2:"2 · Doorta imtihankaaga",k3:"3 · Doorta mayskaaga — ",kq:"Suaal ",kof:" ka mid ah ",kprev:"← Horay",knext:"Xiga →",kclose:"✕ Xir",klang:"Luqadda"},
 tw:{k1:"1 · Paw hyɛ wo ɔman",k2:"2 · Paw wo nsɔhwɛ",k3:"3 · Paw wo adesua — ",kq:"Asɛm ",kof:" wɔ ",kprev:"← Akyi",knext:"Enkyir →",kclose:"✕ To mu",klang:"Kasa"},
 zu:{k1:"1 · Khetha izwe lakho",k2:"2 · Khetha ukuhlolwa kwakho",k3:"3 · Khetha isifundo sakho — ",kq:"Imibuzo ",kof:" kwe ",kprev:"← Emuva",knext:"Okulandelayo →",kclose:"✕ Vala",klang:"Ulwazi"},
 ef:{k1:"1 · Kot obufa fi ke",k2:"2 · Kot idañwọ fi ke",k3:"3 · Kot ikọ fi ke — ",kq:"Etim ",kof:" ke ",kclose:"✕ Kpuk",klang:"Ufọk"},
 ib:{k1:"1 • Kot obufa fi ke",k2:"2 • Kot idañwọ fi ke",k3:"3 • Kot ikọ fi ke — ",kq:"Etie ",kof:" ke ",kclose:"✕ Kpuk",klang:"Ufọk"}
};
function T(k){var L=I18N[LANG]||{};return L[k]||I18N.en[k]||k;}
function setLang(v){try{localStorage.setItem("ac_lang",v);}catch(e){}location.reload();}
function langsel(){return '<select id="langsel" onchange="setLang(this.value)" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;padding:3px 6px;font-size:11.5px;max-width:120px">'+LANGS.map(function(l){return '<option value="'+l[0]+'"'+(l[0]===LANG?" selected":"")+'>'+l[1]+'</option>';}).join("")+'</select>';}
/* ---------- curated in-app lesson videos (v153.2: YouTube killed listType=search
   embeds, which made every lesson show "unavailable". We now play verified lesson
   videos/playlists — embed-friendly and stable. Values starting PL are playlists.) ---------- */
var VIDS={
 en:{"Physics":"PLXq5W8o-L-ImF_i3TfBusF4bMrihFSCDj","Chemistry":"SBCiu0Yhcv0","Biology":"hXF2szRnJDE","Mathematics":"VKoo_gt-rkM","English":"PLYrtVi_mzfHF3VHxaFBC_26Ycy2HvG-ph","Economics":"PLXq5W8o-L-ImvvWEdfrZp47L6aslNpGQF","Government":"s7uWlSqEtHs","Literature":"PLXq5W8o-L-ImUUPjoEQ3I7p-ZHP58m4WJ","Christian Religious Studies":"Nlf_FeybtZE","Geography":"PLzS23jvg9BVfZ1g7F80xakQdLdy1Xi7sb","History":"zLbbDnJsTX4","Agricultural Science":"r_yrpc-h2CY","Math":"qy9htgwZDkg","Reading & Writing":"F-YsV4IplnA","Academic Practice":"EGBPLDP_qp8"},
 zh:{"Mathematics":"6KeJosnt0-4","Physics":"6Za3L1VXPd4","Chemistry":"4UtWCCgkcXk","Biology":"hDiK-8q5Krg","English":"ZaZSlyj8Emw","Academic Practice":"ZaUbTUGzyOQ"}
};
var VALIAS={"Agriculture":"Agricultural Science","Christian Religious Education":"Christian Religious Studies"};
function vurl(id){return id.indexOf("PL")===0?("https://www.youtube-nocookie.com/embed/videoseries?list="+id+"&autoplay=1&rel=0"):("https://www.youtube-nocookie.com/embed/"+id+"?autoplay=1&rel=0");}
function playTopic(topic){
  var key=VALIAS[sel.sub]||sel.sub;
  var vl=(VIDS[LANG]&&VIDS[LANG][key])?LANG:"en";
  var id=(VIDS[vl]&&VIDS[vl][key])||VIDS.en[key]||"";
  if(!id){toastIf("No lesson video for this subject yet.");return;}
  document.getElementById("vtitle").textContent=topic+" — "+sel.sub+(vl!==LANG?" · English":"");
  document.getElementById("vframe").src=vurl(id);
  document.getElementById("vwrap").className="ovl";
}
function toastIf(m){try{var d=document.getElementById("vhint");if(d)d.textContent=m;}catch(e){}}
function closeVid(){var f=document.getElementById("vframe");f.src="";document.getElementById("vwrap").className="ovl hide";}
/* ---------- flow ---------- */
function home(){
 closeVid();if(sel.t)clearInterval(sel.t);
 sel={c:null,ex:null,sub:null,pool:[],q:[],i:0,answers:[],perms:[],t:null,left:0,perq:45};
 var ln=LANG!=="en"?'<div class="note" style="background:#FEF9C3;border:1px solid #FDE68A;border-radius:10px;padding:8px 10px">'+T("klangnote")+'</div>':"";
 h('<div class="card"><h2>'+T("k1")+'</h2><div class="chips">'+
   Object.keys(COUNTRY).map(function(c){return '<button class="chip" onclick="pickC(this.textContent)">'+c+'</button>';}).join("")+
   '</div><div class="note">'+T("kblurb")+'</div>'+ln+'</div><div id="step2"></div><div id="step3"></div>');
}
function pickC(c){sel.c=c;sel.ex=null;sel.sub=null;
 document.getElementById("step2").innerHTML='<div class="card"><h2>'+T("k2")+'</h2><div class="chips">'+
  COUNTRY[c].map(function(e){return '<button class="chip" onclick="pickEx(\''+e+'\')">'+labelOf(e)+'</button>';}).join("")+'</div></div><div id="step3"></div>';
 window.scrollTo(0,document.body.scrollHeight);
}
function pickEx(e){sel.ex=e;sel.sub=null;
 var s=subs(e),names=Object.keys(s);
 document.getElementById("step3").innerHTML='<div class="card"><h2>'+T("k3")+labelOf(e)+'</h2>'+
  '<div class="chips">'+names.map(function(n){var p=poolFor(e,n);return '<button class="chip" onclick="pickSub(\''+n.replace(/'/g,"\\'")+'\')">'+n+' · '+(p?p.length:0)+' q</button>';}).join("")+'</div></div><div id="step4"></div>';
 window.scrollTo(0,document.body.scrollHeight);
}
function pickSub(s){
 sel.sub=s;var pool=poolFor(sel.ex,s);sel.pool=pool;
 var topics=[];(pool||[]).forEach(function(q){if(topics.indexOf(q[4])<0)topics.push(q[4]);});
 document.getElementById("step4").innerHTML='<div class="card"><h2>'+labelOf(sel.ex)+' — '+s+'</h2>'+
  '<div style="font-size:12.5px;color:var(--mut);margin-bottom:9px">'+T("ktap")+'</div>'+
  '<div class="chips">'+topics.map(function(t){return '<button class="chip count" onclick="playTopic(this.textContent)">▶ '+t+'</button>';}).join("")+'</div>'+
  '<div class="note">'+(pool?pool.length:0)+T("kbank")+'</div>'+
  '<button class="btn g" onclick="startPractice(50)">'+T("kstart")+Math.round(50*sel.perq/60)+' min)</button>'+
  '<button class="btn o" onclick="startPractice(20)">'+T("kquick")+'</button>';
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
function diag(q){return q[5]?'<div class="dq">'+q[5]+'</div>':"";}
function renderQ(){
 var q=sel.q[sel.i],perm=sel.perms[sel.i],os=opts(q,perm);
 h('<div class="qcard"><div class="qhead"><span>'+T("kq")+(sel.i+1)+T("kof")+sel.q.length+'</span><span class="timer" id="tm">'+fmt(sel.left)+'</span></div>'+
  '<div class="bar"><i style="width:'+Math.round(sel.i/sel.q.length*100)+'%"></i></div>'+
  '<button class="topic" onclick="playTopic(this.textContent)">'+q[4]+'</button><div class="qq">'+q[0]+'</div>'+diag(q)+
  os.map(function(o,k){return '<button class="opt" onclick="pick('+k+')">'+String.fromCharCode(65+k)+". "+o+'</button>';}).join("")+
  '<div class="nav"><button class="btn o" style="'+(sel.i===0?"visibility:hidden":"")+'" onclick="prev()">'+T("kprev")+'</button>'+
  '<button class="btn g" onclick="next()">'+(sel.i===sel.q.length-1?T("ksubmit"):T("knext"))+'</button></div>'+
  '<button class="btn o" style="margin-top:10px" onclick="if(confirm(\''+T("kconfirm")+'\'))finish()">'+T("kend")+'</button></div>');
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
  rows+='<div class="qcard"><button class="topic" onclick="playTopic(this.textContent)">'+q[4]+'</button><div class="qq">'+q[0]+'</div>'+diag(q)+
   opts(q,perm).map(function(o,k){return '<button class="opt '+(k===shown?"right":(ans===k?"wrong":""))+'" disabled>'+String.fromCharCode(65+k)+". "+o+'</button>';}).join("")+
   (ok?'<div class="expl">'+T("kcorrect")+q[3]+'</div>':'<div class="expl">'+(ans===undefined?T("kna"):T("kinc")+String.fromCharCode(65+shown)+". ")+q[3]+'</div>')+
   '<button class="topic" style="margin-top:8px" onclick="playTopic(this.textContent)">'+T("krevise")+q[4]+'</button></div>';
 }
 var pct=sel.q.length?Math.round(right/sel.q.length*100):0;
 var msg=pct>=80?"🏆":pct>=60?"💪":"📚";
 h('<div class="card" style="text-align:center"><div class="score">'+pct+'% '+msg+'</div><div style="color:var(--mut);margin-bottom:5px">'+right+' / '+sel.q.length+' · '+labelOf(sel.ex)+' · '+sel.sub+'</div>'+
  '<button class="btn g" onclick="startPractice(50)">'+T("kretake")+'</button>'+
  '<button class="btn o" onclick="home()">'+T("kanother")+'</button></div>'+rows);
}
function goHome(){location.href="/app";}
/* localize the static header + player chrome */
(function(){
 try{
  var st=document.querySelector(".top .sub");if(st&&LANG!=="en")st.textContent=T("kblurb");
  var vh=document.getElementById("vhint");if(vh&&LANG!=="en")vh.textContent=T("kvhint");
  var vc=document.getElementById("vcloseb");if(vc&&LANG!=="en")vc.textContent=T("kclose");
  var ht=document.querySelector(".top h1");
  if(ht){var bp=document.createElement("div");bp.style.cssText="margin-top:6px";bp.innerHTML=langsel();ht.parentNode.appendChild(bp);}
 }catch(e){}
})();
home();
