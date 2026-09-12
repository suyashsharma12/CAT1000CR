const state={set:null,index:0,answers:{},started:0,timer:null,filter:'all',search:'',remaining:900,paused:false,endAt:0,finished:false};
const $=id=>document.getElementById(id);
const attempts=()=>JSON.parse(localStorage.getItem(window.CR_ATTEMPT_KEY||'crdrill_attempts_guest')||'[]');
const saveAttempts=a=>localStorage.setItem(window.CR_ATTEMPT_KEY||'crdrill_attempts_guest',JSON.stringify(a));
const qById=id=>CR_DATA.questions.find(q=>q.id===id);
const latestAttempt=setId=>attempts().filter(a=>a.setId===setId).sort((a,b)=>String(b.id).localeCompare(String(a.id)))[0];
const completedSetCount=()=>new Set(attempts().map(a=>a.setId)).size;

(async function initApp(){
  const auth=await window.CR_AUTH_READY;
  if(!auth?.user||!auth.configured)return;

  function renderSets(filter=state.filter){
    state.filter=filter;const grid=$('setGrid');const search=state.search.trim().toLowerCase();grid.innerHTML='';
    CR_DATA.sets.forEach(s=>{const done=latestAttempt(s.id),source=(s.source||'').toUpperCase();
      if(filter==='notstarted'&&done)return;if(filter==='GMAT'&&!source.includes('GMAT'))return;if(filter==='LSAT'&&!source.includes('LSAT'))return;if(search&&!s.name.toLowerCase().includes(search))return;
      const el=document.createElement('button');el.type='button';el.className='set-card '+(done?'done':'');
      el.innerHTML=`<div class="set-no">${s.name}</div><div class="set-source">${s.source}</div><div class="set-status">${done?`✓ ${done.score} marks · ${done.accuracy}% accuracy`:'Start this set →'}</div>`;
      el.addEventListener('click',()=>startSet(s));grid.appendChild(el);
    });
    if(!grid.children.length)grid.innerHTML='<p style="grid-column:1/-1;color:#9aa8b6;font:13px monospace;padding:25px 0">No sets found. Try another filter or search.</p>';updateStats();
  }

  function updateStats(){const a=attempts();$('completedCount').textContent=completedSetCount();$('totalMarks').textContent=a.length?a.reduce((x,y)=>x+y.score,0):'—';$('strikeRate').textContent=a.length?Math.round(a.reduce((x,y)=>x+y.accuracy,0)/a.length)+'%':'—';}
  function startNextSet(){const done=new Set(attempts().map(a=>a.setId));const next=CR_DATA.sets.find(s=>!done.has(s.id))||CR_DATA.sets[0];if(next)startSet(next);}
  function startSet(set){if(!set||!Array.isArray(set.question_ids)||!set.question_ids.length)return;state.set=set;state.index=0;state.answers={};state.started=Date.now();state.remaining=900;state.paused=false;state.finished=false;state.endAt=Date.now()+900000;$('mockLabel').textContent='SET '+set.name;$('mockModal').classList.remove('hidden');$('pausedBanner').classList.add('hidden');updatePauseButton();renderQuestion();startTimer();}
  function setQuestions(){return state.set.question_ids.map(id=>qById(id)).filter(Boolean);}
  function renderQuestion(){const qs=setQuestions(),q=qs[state.index];if(!q)return;const selected=state.answers[q.id];$('progressBar').style.width=((state.index+1)/qs.length*100)+'%';$('progressText').textContent=`Question ${state.index+1} of ${qs.length}`;$('questionArea').innerHTML=`<div class="q-meta">${q.type.toUpperCase()} · ${q.difficulty.toUpperCase()}</div><div class="question">${q.question}</div><div class="stimulus">${q.stimulus}</div><div class="options">${q.options.map((o,i)=>`<button type="button" class="option ${selected===i?'selected':''}" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div>`;document.querySelectorAll('.option').forEach(b=>b.onclick=()=>{if(state.paused)return;state.answers[q.id]=+b.dataset.i;renderQuestion();});$('prevBtn').disabled=state.index===0;$('nextBtn').classList.toggle('hidden',state.index===qs.length-1);$('submitBtn').classList.toggle('hidden',state.index!==qs.length-1);}
  function startTimer(){clearInterval(state.timer);state.endAt=Date.now()+state.remaining*1000;state.timer=setInterval(()=>{if(state.paused||state.finished)return;state.remaining=Math.max(0,Math.ceil((state.endAt-Date.now())/1000));updateTimer();if(state.remaining<=0)finishSet();},250);updateTimer();}
  function updateTimer(){const left=Math.max(0,state.remaining);$('timer').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;$('timer').classList.toggle('timer-warning',left<=60&&left>0);}
  function updatePauseButton(){$('pauseBtn').textContent=state.paused?'▶ RESUME':'Ⅱ PAUSE';$('pausedBanner').classList.toggle('hidden',!state.paused);$('pauseBtn').classList.toggle('resume',state.paused);}
  function togglePause(){if(state.finished)return;if(!state.paused){state.remaining=Math.max(0,Math.ceil((state.endAt-Date.now())/1000));state.paused=true;clearInterval(state.timer);}else{state.paused=false;state.endAt=Date.now()+state.remaining*1000;startTimer();}updateTimer();updatePauseButton();}
  function closeMock(){clearInterval(state.timer);state.paused=false;state.finished=false;$('mockModal').classList.add('hidden');updatePauseButton();}

  async function finishSet(){
    if(!state.set||state.finished)return;
    state.finished=true;clearInterval(state.timer);
    const qs=setQuestions();let correct=0,wrong=0,blank=0;
    qs.forEach(q=>{const a=state.answers[q.id];if(a==null)blank++;else if(a===q.answer)correct++;else wrong++;});
    const score=correct*3-wrong,accuracy=correct/(qs.length-blank)*100||0;
    const attempt={setId:state.set.id,setName:state.set.name,date:new Date().toISOString(),score,correct,wrong,blank,accuracy:+accuracy.toFixed(1),timeSeconds:Math.round((Date.now()-state.started)/1000)};
    try{
      const saved=await window.CR_SAVE_ATTEMPT(attempt);
      const a=attempts();a.push(saved);saveAttempts(a);
    }catch(error){
      console.error(error);
      state.finished=false;
      alert('Your result could not be synced to your account. Please check your internet connection and try FINISH SET again. Your score has not been marked complete yet.');
      return;
    }
    $('mockModal').classList.add('hidden');$('resultModal').classList.remove('hidden');$('resultTitle').textContent='Set '+state.set.name;$('resultScore').textContent=score;$('resultSummary').textContent=`${correct} correct · ${wrong} wrong · ${blank} blank`;$('rCorrect').textContent=correct;$('rWrong').textContent=wrong;$('rBlank').textContent=blank;$('rAccuracy').textContent=accuracy.toFixed(1)+'%';renderSets(state.filter);
  }

  $('nextSetBtn').addEventListener('click',e=>{e.preventDefault();startNextSet();});
  $('pauseBtn').addEventListener('click',e=>{e.preventDefault();togglePause();});
  $('exitMock').addEventListener('click',e=>{e.preventDefault();if(confirm('Exit this set? Your answers will not be submitted.'))closeMock();});
  $('prevBtn').addEventListener('click',()=>{if(!state.paused&&state.index){state.index--;renderQuestion();}});
  $('nextBtn').addEventListener('click',()=>{if(!state.paused){const n=setQuestions().length;if(state.index<n-1){state.index++;renderQuestion();}}});
  $('submitBtn').addEventListener('click',()=>{if(!state.paused)finishSet();});
  $('closeResult').addEventListener('click',()=>{$('resultModal').classList.add('hidden');});
  document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderSets(b.dataset.filter);}));
  $('setSearch').addEventListener('input',e=>{state.search=e.target.value;renderSets(state.filter);});
  document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('homeView').classList.toggle('hidden',b.dataset.nav!=='home');$('performanceView').classList.toggle('hidden',b.dataset.nav!=='performance');if(b.dataset.nav==='performance')renderPerformance();}));
  $('clearHistory').addEventListener('click',async()=>{if(!confirm('Clear all your saved practice results? This cannot be undone.'))return;try{await window.CR_DELETE_ATTEMPTS();renderPerformance();renderSets(state.filter);}catch(error){console.error(error);alert('Could not clear your cloud history. Please try again.');}});

  function renderPerformance(){const a=attempts(),scores=a.map(x=>x.score);$('pMocks').textContent=completedSetCount();$('pAvg').textContent=a.length?(scores.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'—';$('pBest').textContent=a.length?Math.max(...scores):'—';$('pAccuracy').textContent=a.length?(a.reduce((x,y)=>x+y.accuracy,0)/a.length).toFixed(1)+'%':'—';$('history').innerHTML=a.slice().reverse().map(x=>`<div class="history-row"><b>#${x.setName}</b><span>${new Date(x.date).toLocaleDateString()}</span><span class="score">${x.score}</span><span>${x.accuracy}%</span><small>${x.correct}/${x.correct+x.wrong+x.blank} answered</small></div>`).join('')||'<p style="color:#91a1b4;font-family:monospace">Complete a set to see your history.</p>';drawChart(a.slice(-20));}
  function drawChart(a){const c=$('scoreChart'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1,w=c.clientWidth,h=260;c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);ctx.strokeStyle='#c7c4bc';ctx.lineWidth=1;for(let y=35;y<h-30;y+=45){ctx.beginPath();ctx.moveTo(45,y);ctx.lineTo(w-20,y);ctx.stroke();}if(!a.length)return;const min=Math.min(...a.map(x=>x.score),0),max=Math.max(...a.map(x=>x.score),30),range=max-min||1;ctx.strokeStyle='#6558d9';ctx.lineWidth=3;ctx.beginPath();a.forEach((x,i)=>{const px=50+i*((w-80)/Math.max(1,a.length-1)),py=(h-40)-((x.score-min)/range)*(h-80);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();ctx.fillStyle='#172033';a.forEach((x,i)=>{const px=50+i*((w-80)/Math.max(1,a.length-1)),py=(h-40)-((x.score-min)/range)*(h-80);ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();});}

  renderSets();
  window.addEventListener('resize',()=>{if(!$('performanceView').classList.contains('hidden'))renderPerformance();});
})();
