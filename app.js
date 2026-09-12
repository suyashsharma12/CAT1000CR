const KEY='crdrill_attempts_v1';
const state={set:null,index:0,answers:{},started:0,timer:null,filter:'all',search:''};
const attempts=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
const saveAttempts=a=>localStorage.setItem(KEY,JSON.stringify(a));
const qById=id=>CR_DATA.questions.find(q=>q.id===id);
const latestAttempt=setId=>attempts().filter(a=>a.setId===setId).sort((a,b)=>b.id-a.id)[0];
const completedSetCount=()=>new Set(attempts().map(a=>a.setId)).size;

function renderSets(filter=state.filter){
  state.filter=filter;
  const grid=document.getElementById('setGrid');
  const search=state.search.trim().toLowerCase();
  grid.innerHTML='';
  CR_DATA.sets.forEach(s=>{
    const done=latestAttempt(s.id);
    const source=(s.source||'').toUpperCase();
    if(filter==='notstarted'&&done)return;
    if(filter==='GMAT'&&!source.includes('GMAT'))return;
    if(filter==='LSAT'&&!source.includes('LSAT'))return;
    if(search&&!s.name.toLowerCase().includes(search))return;
    const el=document.createElement('button');
    el.className='set-card '+(done?'done':'');
    el.innerHTML=`<div class="set-no">${s.name}</div><div class="set-source">${s.source}</div><div class="set-status">${done?`✓ ${done.score} marks · ${done.accuracy}% accuracy`:'Start this set →'}</div>`;
    el.onclick=()=>startSet(s);
    grid.appendChild(el);
  });
  if(!grid.children.length)grid.innerHTML='<p style="grid-column:1/-1;color:#9aa8b6;font:13px monospace;padding:25px 0">No sets found. Try another filter or search.</p>';
  updateStats();
}

function updateStats(){
  const a=attempts();
  document.getElementById('completedCount').textContent=completedSetCount();
  document.getElementById('totalMarks').textContent=a.length?a.reduce((x,y)=>x+y.score,0):'—';
  document.getElementById('strikeRate').textContent=a.length?Math.round(a.reduce((x,y)=>x+y.accuracy,0)/a.length)+'%':'—';
}

function startNextSet(){
  const done=new Set(attempts().map(a=>a.setId));
  const next=CR_DATA.sets.find(s=>!done.has(s.id))||CR_DATA.sets[0];
  startSet(next);
}

function startSet(set){
  state.set=set;state.index=0;state.answers={};state.started=Date.now();
  document.getElementById('mockLabel').textContent='SET '+set.name;
  document.getElementById('mockModal').classList.remove('hidden');
  renderQuestion();startTimer();
}
function setQuestions(){return state.set.question_ids.map(id=>qById(id));}

function renderQuestion(){
  const qs=setQuestions(),q=qs[state.index],selected=state.answers[q.id];
  document.getElementById('progressBar').style.width=((state.index+1)/qs.length*100)+'%';
  document.getElementById('progressText').textContent=`Question ${state.index+1} of ${qs.length}`;
  document.getElementById('questionArea').innerHTML=`<div class="q-meta">${q.type.toUpperCase()} · ${q.difficulty.toUpperCase()}</div><div class="question">${q.question}</div><div class="stimulus">${q.stimulus}</div><div class="options">${q.options.map((o,i)=>`<button class="option ${selected===i?'selected':''}" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div>`;
  document.querySelectorAll('.option').forEach(b=>b.onclick=()=>{state.answers[q.id]=+b.dataset.i;renderQuestion();});
  document.getElementById('prevBtn').disabled=state.index===0;
  document.getElementById('nextBtn').classList.toggle('hidden',state.index===qs.length-1);
  document.getElementById('submitBtn').classList.toggle('hidden',state.index!==qs.length-1);
}

function startTimer(){
  clearInterval(state.timer);let left=900;
  const tick=()=>{document.getElementById('timer').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(left<=0){clearInterval(state.timer);finishSet();}left--;};
  tick();state.timer=setInterval(tick,1000);
}
function closeMock(){clearInterval(state.timer);document.getElementById('mockModal').classList.add('hidden');}
function finishSet(){
  if(!state.set)return;
  clearInterval(state.timer);
  const qs=setQuestions();let correct=0,wrong=0,blank=0;
  qs.forEach(q=>{const a=state.answers[q.id];if(a==null)blank++;else if(a===q.answer)correct++;else wrong++;});
  const score=correct*3-wrong,accuracy=correct/(qs.length-blank)*100||0;
  const attempt={id:Date.now(),setId:state.set.id,setName:state.set.name,date:new Date().toISOString(),score,correct,wrong,blank,accuracy:+accuracy.toFixed(1),timeSeconds:Math.round((Date.now()-state.started)/1000)};
  const a=attempts();a.push(attempt);saveAttempts(a);
  document.getElementById('mockModal').classList.add('hidden');document.getElementById('resultModal').classList.remove('hidden');
  document.getElementById('resultTitle').textContent='Set '+state.set.name;document.getElementById('resultScore').textContent=score;
  document.getElementById('resultSummary').textContent=`${correct} correct · ${wrong} wrong · ${blank} blank`;
  document.getElementById('rCorrect').textContent=correct;document.getElementById('rWrong').textContent=wrong;document.getElementById('rBlank').textContent=blank;document.getElementById('rAccuracy').textContent=accuracy.toFixed(1)+'%';
  renderSets(state.filter);
}

document.getElementById('prevBtn').onclick=()=>{if(state.index){state.index--;renderQuestion();}};
document.getElementById('nextBtn').onclick=()=>{const n=setQuestions().length;if(state.index<n-1){state.index++;renderQuestion();}};
document.getElementById('submitBtn').onclick=finishSet;
document.getElementById('nextSetBtn').onclick=startNextSet;
document.getElementById('exitMock').onclick=()=>{if(confirm('Exit this set? Your answers will not be submitted.'))closeMock();};
document.getElementById('closeResult').onclick=()=>document.getElementById('resultModal').classList.add('hidden');
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderSets(b.dataset.filter);});
document.getElementById('setSearch').oninput=e=>{state.search=e.target.value;renderSets(state.filter);};

document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  document.getElementById('homeView').classList.toggle('hidden',b.dataset.nav!=='home');
  document.getElementById('performanceView').classList.toggle('hidden',b.dataset.nav!=='performance');
  if(b.dataset.nav==='performance')renderPerformance();
});

document.getElementById('clearHistory').onclick=()=>{if(confirm('Clear all saved practice results?')){localStorage.removeItem(KEY);renderPerformance();renderSets(state.filter);}};

function renderPerformance(){
  const a=attempts(),scores=a.map(x=>x.score);
  document.getElementById('pMocks').textContent=completedSetCount();
  document.getElementById('pAvg').textContent=a.length?(scores.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'—';
  document.getElementById('pBest').textContent=a.length?Math.max(...scores):'—';
  document.getElementById('pAccuracy').textContent=a.length?(a.reduce((x,y)=>x+y.accuracy,0)/a.length).toFixed(1)+'%':'—';
  document.getElementById('history').innerHTML=a.slice().reverse().map(x=>`<div class="history-row"><b>#${x.setName}</b><span>${new Date(x.date).toLocaleDateString()}</span><span class="score">${x.score}</span><span>${x.accuracy}%</span><small>${x.correct}/${x.correct+x.wrong+x.blank} answered</small></div>`).join('')||'<p style="color:#91a1b4;font-family:monospace">Complete a set to see your history.</p>';
  drawChart(a.slice(-20));
}
function drawChart(a){
  const c=document.getElementById('scoreChart'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1,w=c.clientWidth,h=260;c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#c7c4bc';ctx.lineWidth=1;for(let y=35;y<h-30;y+=45){ctx.beginPath();ctx.moveTo(45,y);ctx.lineTo(w-20,y);ctx.stroke();}
  if(!a.length)return;const min=Math.min(...a.map(x=>x.score),0),max=Math.max(...a.map(x=>x.score),30),range=max-min||1;
  ctx.strokeStyle='#d99624';ctx.lineWidth=3;ctx.beginPath();a.forEach((x,i)=>{const px=50+i*((w-80)/Math.max(1,a.length-1)),py=(h-40)-((x.score-min)/range)*(h-80);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();
  ctx.fillStyle='#0e1a25';a.forEach((x,i)=>{const px=50+i*((w-80)/Math.max(1,a.length-1)),py=(h-40)-((x.score-min)/range)*(h-80);ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();});
}
renderSets();
window.addEventListener('resize',()=>{if(!document.getElementById('performanceView').classList.contains('hidden'))renderPerformance();});