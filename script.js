let memory=[], logs=[], ops=0, errors=0, free=0, history=[];
const $=id=>document.getElementById(id);

function parity(data){return (data.split('').filter(x=>x==='1').length%2===0)?'0':'1'}
function validData(s){return /^[01]{1,8}$/.test(s)}
function corrupt(data,type){
  let a=data.split('');
  if(type==='single'){let i=Math.floor(Math.random()*a.length);a[i]=a[i]==='0'?'1':'0'}
  if(type==='multiple'){let n=Math.max(2,Math.ceil(a.length/3));for(let k=0;k<n;k++){let i=Math.floor(Math.random()*a.length);a[i]=a[i]==='0'?'1':'0'}}
  if(type==='random'){for(let i=0;i<a.length;i++)if(Math.random()<.3)a[i]=a[i]==='0'?'1':'0'}
  return a.join('');
}
function init(){
  memory=Array.from({length:16},(_,i)=>({address:i.toString(2).padStart(4,'0'),data:randomBits(8),parity:'',status:'OK',op:'Initialized'}));
  memory.forEach(x=>x.parity=parity(x.data)); renderMemory(); drawChart();
}
function randomBits(n){return Array.from({length:n},()=>Math.random()<.5?'0':'1').join('')}
function renderMemory(){
  $('memoryBody').innerHTML=memory.map(x=>`<tr><td>${x.address}</td><td>${x.data}</td><td>${x.parity}</td><td class="${x.status==='OK'?'oktext':'errtext'}">${x.status==='OK'?'✓ OK':'✗ ERROR'}</td><td>${x.op}</td></tr>`).join('');
  $('totalLocations').textContent=memory.length;
}
function simulate(){
  let address=$('address').value.trim(), data=$('dataInput').value.trim(), type=$('errorType').value;
  if(!validData(data)){ $('simulationResult').innerHTML='<div class="result bad">Enter 1–8 binary digits only (0 and 1).</div>';return; }
  let original=data, stored=data, p=parity(original), corrupted=false;
  if(type!=='none'){stored=corrupt(data,type);corrupted=stored!==original}
  let detected=parity(stored)!==p;
  ops++; if(detected)errors++; else free++;
  history.push(detected?1:0);
  let m=memory.find(x=>x.address===address)||memory[parseInt(address||'0',2)%memory.length];
  m.data=stored;m.parity=p;m.status=detected?'ERROR':'OK';m.op='READ / '+(type==='none'?'NORMAL':type.toUpperCase());
  if(detected){
    logs.unshift({id:logs.length+1,address:m.address,original,corrupted:stored,type:type==='none'?'Unknown':type,detection:'Parity mismatch',time:new Date().toLocaleTimeString()});
  }
  updateStats();renderMemory();renderLogs();drawChart();
  $('simulationResult').innerHTML=`<div class="result ${detected?'bad':'ok'}">
  <strong>${detected?'❌ ERROR DETECTED':'✅ NO ERROR DETECTED'}</strong><br><br>
  Original Data: <b>${original}</b> &nbsp; | &nbsp; Stored/Read Data: <b>${stored}</b><br>
  Expected Parity: <b>${p}</b> &nbsp; | &nbsp; Calculated Parity: <b>${parity(stored)}</b><br>
  Result: <b>${detected?'Parity mismatch — data corruption detected.':'Parity matches — data is valid.'}</b></div>`;
}
function runQuickTest(){
 let d=$('quickData').value.trim();
 if(!validData(d)){$('quickResult').textContent='Please enter valid binary data.';return}
 let p=parity(d);$('quickResult').className='result ok';$('quickResult').innerHTML=`Data: <b>${d}</b><br>Even parity bit: <b>${p}</b><br>Total 1s including parity: <b>${d.split('').filter(x=>x==='1').length+Number(p)}</b> → EVEN`;
}
function updateStats(){
 $('totalOps').textContent=ops;$('errorsDetected').textContent=errors;$('errorFree').textContent=free;
 let rate=ops?Math.round(errors/ops*100):0;$('errorRate').textContent=rate+'%';$('detectionRate').textContent=(ops?Math.round((errors+free)/ops*100):100)+'%';
 $('progressBar').style.width=rate+'%';$('systemStatus').textContent=errors?'ERRORS FOUND':'NORMAL';$('systemStatus').className='badge '+(errors?'':'ok');
}
function renderLogs(){
 $('logBody').innerHTML=logs.length?logs.map(x=>`<tr><td>${x.id}</td><td>${x.address}</td><td>${x.original}</td><td>${x.corrupted}</td><td>${x.type}</td><td class="errtext">${x.detection}</td><td>${x.time}</td></tr>`).join(''):'<tr><td colspan="7">No errors recorded.</td></tr>';
}
function clearLogs(){logs=[];renderLogs()}
function resetAll(){ops=0;errors=0;free=0;history=[];logs=[];init();renderLogs();updateStats()}
function drawChart(){
 let c=$('chart'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);
 ctx.strokeStyle='#233852';ctx.lineWidth=1;
 for(let y=30;y<h-30;y+=45){ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(w-20,y);ctx.stroke()}
 ctx.strokeStyle='#5b8fff';ctx.lineWidth=3;ctx.beginPath();
 let data=history.slice(-30); if(!data.length){data=[0]}
 data.forEach((v,i)=>{let x=40+i*((w-70)/Math.max(1,data.length-1)),y=h-40-v*(h-90);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
 ctx.fillStyle='#91a5bc';ctx.font='13px Arial';ctx.fillText('Recent error events',40,20);
}
document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
 document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(btn.dataset.page).classList.add('active');
 $('pageTitle').textContent=btn.textContent.replace(/^[^A-Za-z]+/,'').trim();
}));
init();updateStats();renderLogs();
