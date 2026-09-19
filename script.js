const letterData = {
  consonants: [
    ['ㄱ','기역','가방'],['ㄴ','니은','나비'],['ㄷ','디귿','다리'],['ㄹ','리을','라디오'],['ㅁ','미음','모자'],['ㅂ','비읍','바나나'],['ㅅ','시옷','사과'],['ㅇ','이응','아기'],['ㅈ','지읒','자동차'],['ㅊ','치읓','치마'],['ㅋ','키읔','코끼리'],['ㅌ','티읕','토끼'],['ㅍ','피읖','포도'],['ㅎ','히읗','하마']
  ],
  vowels: [
    ['ㅏ','아','아기'],['ㅑ','야','야구'],['ㅓ','어','어깨'],['ㅕ','여','여우'],['ㅗ','오','오이'],['ㅛ','요','요리'],['ㅜ','우','우산'],['ㅠ','유','유리'],['ㅡ','으','그릇'],['ㅣ','이','이불']
  ],
  doubleConsonants: [
    ['ㄲ','쌍기역','까치'],['ㄸ','쌍디귿','뚜껑'],['ㅃ','쌍비읍','뿌리'],['ㅆ','쌍시옷','쌀'],['ㅉ','쌍지읒','찌개']
  ],
  compoundVowels: [
    ['ㅐ','애','개'],['ㅔ','에','게'],['ㅒ','얘','얘기'],['ㅖ','예','시계'],['ㅘ','와','과자'],['ㅙ','왜','왜가리'],['ㅚ','외','외투'],['ㅝ','워','원숭이'],['ㅞ','웨','웨이터'],['ㅟ','위','귀'],['ㅢ','의','의자']
  ]
};
const categoryNames={consonants:'자음',vowels:'모음',doubleConsonants:'쌍자음',compoundVowels:'쌍모음'};
const words=[
  {word:'나비',emoji:'🦋'},{word:'사과',emoji:'🍎'},{word:'토끼',emoji:'🐰'},{word:'우산',emoji:'☂️'},{word:'자동차',emoji:'🚗'},{word:'포도',emoji:'🍇'},{word:'모자',emoji:'🎩'},{word:'하마',emoji:'🦛'}
];
const listenItems=['가','나','다','마','바','사','자','차','코','토','파','하'];
let stars=Number(localStorage.getItem('hangulStars')||0),soundMuted=false,currentCategory='consonants',currentLetter=letterData.consonants[0];
let readRound=1,readQuestion=null,listenRound=1,listenAnswer='',isDrawing=false,drawPoints=0,writeRewarded=false;
let characterVoice=null;

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function chooseCharacterVoice(){
  if(!('speechSynthesis' in window))return;
  const koreanVoices=speechSynthesis.getVoices().filter(voice=>voice.lang.toLowerCase().startsWith('ko'));
  const preferred=/sunhi|heami|yuna|google.*한국어|korean/i;
  characterVoice=koreanVoices.find(voice=>preferred.test(voice.name))||koreanVoices[0]||null;
}
function speak(text){
  if(soundMuted||!('speechSynthesis' in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='ko-KR';u.voice=characterVoice;u.rate=.78;u.pitch=1.42;u.volume=1;
  u.onstart=()=>document.body.classList.add('robot-speaking');
  const stopTalking=()=>document.body.classList.remove('robot-speaking');
  u.onend=stopTalking;u.onerror=stopTalking;
  speechSynthesis.speak(u);
}
chooseCharacterVoice();
if('speechSynthesis' in window)speechSynthesis.addEventListener('voiceschanged',chooseCharacterVoice);
function updateProgress(){stars=Math.max(0,stars);localStorage.setItem('hangulStars',stars);$('#starCount').textContent=stars;$('#progressStars').textContent=Math.min(stars,5);$('#progressBar').style.width=`${Math.min(stars,5)*20}%`}
function awardStar(){stars+=1;updateProgress();$('#celebration').hidden=false;setTimeout(()=>{$('#celebration').hidden=true},1200)}

function setupCharacterCursor(){
  const cursor=$('#characterCursor');
  if(!cursor||!matchMedia('(pointer: fine)').matches)return;
  document.body.classList.add('has-character-cursor');
  window.addEventListener('pointermove',event=>{cursor.style.left=`${event.clientX}px`;cursor.style.top=`${event.clientY}px`;cursor.classList.add('is-visible')});
  document.addEventListener('pointerover',event=>cursor.classList.toggle('is-hovering',Boolean(event.target.closest('button,a'))));
  document.addEventListener('pointerdown',()=>cursor.classList.add('is-pressed'));
  document.addEventListener('pointerup',()=>cursor.classList.remove('is-pressed'));
  document.documentElement.addEventListener('mouseleave',()=>cursor.classList.remove('is-visible'));
}

function showView(name){
  $$('.mode-tab').forEach(btn=>{const on=btn.dataset.view===name;btn.classList.toggle('is-active',on);btn.setAttribute('aria-selected',on)});
  $$('.view').forEach(view=>{const on=view.id===`${name}View`;view.hidden=!on;view.classList.toggle('is-active',on)});
  if(name==='write')setTimeout(resizeCanvas,0);
  if(name==='listen')setTimeout(()=>speak(`잘 듣고 ${listenAnswer} 글자를 찾아보세요`),250);
}
$$('.mode-tab').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));

function renderLetters(){
  const grid=$('#letterGrid');grid.innerHTML='';
  letterData[currentCategory].forEach((item,index)=>{const btn=document.createElement('button');btn.type='button';btn.className='letter-card'+(index===0?' is-selected':'');btn.textContent=item[0];btn.setAttribute('aria-label',`${item[0]}, ${item[1]}`);btn.addEventListener('click',()=>selectLetter(item,btn));grid.append(btn)});
  selectLetter(letterData[currentCategory][0],grid.firstElementChild,false);
}
function selectLetter(item,button,doSpeak=true){currentLetter=item;$$('.letter-card').forEach(b=>b.classList.remove('is-selected'));button?.classList.add('is-selected');$('#coachLetter').textContent=item[0];$('#coachType').textContent=categoryNames[currentCategory];$('#coachName').textContent=item[1];$('#coachHint').textContent=`“${item[2]}”에서 만날 수 있어요.`;if(doSpeak)speak(`${item[0]}, ${item[1]}. ${item[2]}`)}
$$('.category-tabs button').forEach(btn=>btn.addEventListener('click',()=>{currentCategory=btn.dataset.category;$$('.category-tabs button').forEach(b=>b.setAttribute('aria-selected',b===btn));renderLetters()}));
$('#coachSpeak').addEventListener('click',()=>speak(`${currentLetter[0]}, ${currentLetter[1]}. ${currentLetter[2]}`));

function makeReadQuestion(){
  readQuestion=words[Math.floor(Math.random()*words.length)];
  const distractors=shuffle(words.filter(w=>w.word!==readQuestion.word)).slice(0,2);
  $('#readEmoji').textContent=readQuestion.emoji;$('#readRound').textContent=readRound;$('#readFeedback').textContent='';$('#readFeedback').className='feedback';$('#nextRead').hidden=true;
  const wrap=$('#readAnswers');wrap.innerHTML='';shuffle([readQuestion,...distractors]).forEach(item=>{const btn=document.createElement('button');btn.type='button';btn.className='answer-button';btn.textContent=item.word;btn.addEventListener('click',()=>checkRead(item.word,btn));wrap.append(btn)});
}
function checkRead(answer,button){
  const buttons=$$('#readAnswers .answer-button');buttons.forEach(b=>b.disabled=true);
  if(answer===readQuestion.word){button.classList.add('correct');$('#readFeedback').textContent='맞았어요! 소리 내어 한 번 더 읽어봐요.';$('#readFeedback').classList.add('success');speak(`${readQuestion.word}. 참 잘했어요`);awardStar()}else{button.classList.add('wrong');buttons.find(b=>b.textContent===readQuestion.word)?.classList.add('correct');$('#readFeedback').textContent=`정답은 “${readQuestion.word}”예요.`;$('#readFeedback').classList.add('try');speak(`정답은 ${readQuestion.word}예요`)}
  $('#nextRead').hidden=false;
}
$('#nextRead').addEventListener('click',()=>{readRound=readRound>=5?1:readRound+1;makeReadQuestion()});

const canvas=$('#writeCanvas'),ctx=canvas.getContext('2d');
function resizeCanvas(){const rect=canvas.getBoundingClientRect();const ratio=window.devicePixelRatio||1;canvas.width=rect.width*ratio;canvas.height=rect.height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#ff6b57';ctx.lineWidth=18}
function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{isDrawing=true;canvas.setPointerCapture(e.pointerId);const p=pointerPos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);drawPoints=1;$('#writeFeedback').textContent=''});
canvas.addEventListener('pointermove',e=>{if(!isDrawing)return;const p=pointerPos(e);ctx.lineTo(p.x,p.y);ctx.stroke();drawPoints++});
canvas.addEventListener('pointerup',()=>{isDrawing=false});canvas.addEventListener('pointercancel',()=>{isDrawing=false});window.addEventListener('resize',resizeCanvas);
function clearCanvas(){ctx.clearRect(0,0,canvas.width,canvas.height);drawPoints=0;writeRewarded=false;$('#writeFeedback').textContent='';$('#writeFeedback').className='feedback'}
$('#clearCanvas').addEventListener('click',clearCanvas);
$('#checkWriting').addEventListener('click',()=>{if(drawPoints<12){$('#writeFeedback').textContent='조금 더 길게 따라 써볼까요?';$('#writeFeedback').className='feedback try';speak('조금 더 길게 따라 써볼까요?');return}$('#writeFeedback').textContent='멋지게 썼어요!';$('#writeFeedback').className='feedback success';speak('멋지게 썼어요');if(!writeRewarded){writeRewarded=true;awardStar()}});
['가','나','다','라','마','바','사','아'].forEach((letter,index)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=letter;btn.className=index===0?'is-active':'';btn.addEventListener('click',()=>{$$('#writePicker button').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');$('#traceLetter').textContent=letter;clearCanvas();speak(letter)});$('#writePicker').append(btn)});

function makeListenQuestion(){
  listenAnswer=listenItems[Math.floor(Math.random()*listenItems.length)];
  const options=shuffle([listenAnswer,...shuffle(listenItems.filter(x=>x!==listenAnswer)).slice(0,2)]);
  $('#listenRound').textContent=listenRound;$('#listenFeedback').textContent='';$('#listenFeedback').className='feedback';$('#nextListen').hidden=true;
  const wrap=$('#listenAnswers');wrap.innerHTML='';options.forEach(item=>{const btn=document.createElement('button');btn.type='button';btn.className='answer-button';btn.textContent=item;btn.addEventListener('click',()=>checkListen(item,btn));wrap.append(btn)});
}
function playListen(){speak(listenAnswer)}
function checkListen(answer,button){const buttons=$$('#listenAnswers .answer-button');buttons.forEach(b=>b.disabled=true);if(answer===listenAnswer){button.classList.add('correct');$('#listenFeedback').textContent='귀 기울여 잘 들었어요!';$('#listenFeedback').classList.add('success');speak(`${listenAnswer}. 맞았어요`);awardStar()}else{button.classList.add('wrong');buttons.find(b=>b.textContent===listenAnswer)?.classList.add('correct');$('#listenFeedback').textContent=`정답은 “${listenAnswer}”예요. 다시 들어봐요.`;$('#listenFeedback').classList.add('try');speak(listenAnswer)}$('#nextListen').hidden=false}
$('#playSound').addEventListener('click',playListen);$('#nextListen').addEventListener('click',()=>{listenRound=listenRound>=5?1:listenRound+1;makeListenQuestion();setTimeout(playListen,180)});
$('#soundToggle').addEventListener('click',e=>{soundMuted=!soundMuted;e.currentTarget.setAttribute('aria-pressed',soundMuted);e.currentTarget.setAttribute('aria-label',soundMuted?'로봇 목소리 켜기':'로봇 목소리 끄기');if(soundMuted){speechSynthesis.cancel();document.body.classList.remove('robot-speaking')}else speak('안녕! 로봇 선생님이랑 한글 놀이를 시작해요')});
$('#celebration').addEventListener('click',()=>{$('#celebration').hidden=true});

updateProgress();renderLetters();makeReadQuestion();makeListenQuestion();setupCharacterCursor();

// 지원하는 브라우저에서는 AI 도우미도 화면과 같은 학습 메뉴를 열 수 있어요.
function registerLearningTools(){
  const context=document.modelContext;
  if(!context?.registerTool)return;
  const views=['learn','read','write','listen'];
  const categories=Object.keys(letterData);
  const report=error=>console.warn('Learning tool registration failed',error);
  try{
    void Promise.resolve(context.registerTool({
      name:'open_hangul_activity',
      title:'한글 놀이 열기',
      description:'글자 익히기, 읽기, 쓰기, 듣기 중 원하는 한글 학습 놀이를 화면에 엽니다.',
      inputSchema:{type:'object',properties:{view:{type:'string',enum:views},category:{type:'string',enum:categories}},required:['view'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute(input){
        if(!input||!views.includes(input.view))throw new Error('지원하지 않는 놀이입니다.');
        if(input.category!==undefined&&!categories.includes(input.category))throw new Error('지원하지 않는 글자 종류입니다.');
        showView(input.view);
        if(input.view==='learn'&&input.category){
          currentCategory=input.category;
          $$('.category-tabs button').forEach(button=>button.setAttribute('aria-selected',button.dataset.category===input.category));
          renderLetters();
        }
        return{view:input.view,category:input.view==='learn'?currentCategory:null,stars};
      }
    })).catch(report);
    void Promise.resolve(context.registerTool({
      name:'get_hangul_progress',
      title:'한글 놀이 진행 확인',
      description:'현재 모은 별과 오늘의 목표 진행 상황을 확인합니다.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute(input){
        if(!input||Object.keys(input).length)throw new Error('입력값 없이 실행해 주세요.');
        return{stars,todayGoal:5,todayCompleted:Math.min(stars,5)};
      }
    })).catch(report);
  }catch(error){report(error)}
}
registerLearningTools();
