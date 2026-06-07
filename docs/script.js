'use strict';
(function(){
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $=(s,r)=>(r||document).querySelector(s);
  const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));

  /* ---------- CACHE RESET via ?reset ---------- */
  if(location.search.includes('reset')){
    if('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
    if('caches' in window) caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)));
  }

  /* ---------- COPY PROTECTION (desktop) ---------- */
  function inField(t){ return t && t.closest && t.closest('input,textarea,[contenteditable]'); }
  document.addEventListener('contextmenu',e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('copy',e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('cut',e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart',e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('selectstart',e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('keydown',e=>{ if(inField(e.target)) return;
    const k=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey)&&['c','x','a','s','u'].includes(k)) e.preventDefault(); });

  /* ---------- YEAR + KILL SERVICE WORKER ---------- */
  $('#year').textContent=new Date().getFullYear();
  // Service worker полностью отключён. Если у посетителя остался старый SW
  // (из прошлых версий) — сносим его и чистим кэши при каждой загрузке,
  // чтобы сайт всегда грузил свежие файлы и не залипал на старой версии.
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
  }
  if('caches' in window){
    caches.keys().then(ks=>ks.forEach(k=>caches.delete(k))).catch(()=>{});
  }

  /* ---------- BURGER ---------- */
  const burger=$('#burger'), links=$('#nav-links');
  if(burger) burger.addEventListener('click',()=>links.classList.toggle('open'));
  $$('#nav-links a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));

  /* ---------- OS DETECT ---------- */
  const ua=navigator.userAgent;
  const isMac=/Macintosh|Mac OS X/i.test(ua)&&!/iPhone|iPad/i.test(ua);
  const isMobile=/Android|iPhone|iPad|iPod/i.test(ua);
  if(isMac){ const m=$('#dl-mac'); if(m){m.classList.remove('btn-ghost');m.classList.add('btn-primary');} }
  if(isMobile){ const om=$('#open-mobile'); if(om){om.classList.remove('btn-ghost');om.classList.add('btn-primary');} }

  /* ---------- UI BLIP SOUND ---------- */
  const SND={on:false,ctx:null,
    blip(type){ if(!this.on||!this.ctx) return; try{
      const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
      const map={hover:[520,.03,.04],click:[330,.05,.08],download:[260,.12,.14]};
      const [f,vol,dur]=map[type]||map.click;
      o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.6,t+dur);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+dur);
    }catch(e){} }};
  document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-snd]');if(el&&el.dataset.snd==='hover')SND.blip('hover');});
  document.addEventListener('click',e=>{const el=e.target.closest('[data-snd]');if(!el)return;const t=el.dataset.snd;if(t==='click'||t==='download')SND.blip(t);});

  /* ---------- AMBIENCE MUSIC + AUDIO ANALYSER ---------- */
  const audio=$('#ambient-audio'), ambBtn=$('#ambience-toggle'), ambTxt=ambBtn.querySelector('.snd-txt');
  let actx=null, analyser=null, freq=null, srcNode=null, playing=false;
  function ensureAudioGraph(){
    if(actx) return;
    try{
      actx=new (window.AudioContext||window.webkitAudioContext)();
      SND.ctx=actx;
      analyser=actx.createAnalyser(); analyser.fftSize=128; analyser.smoothingTimeConstant=.82;
      freq=new Uint8Array(analyser.frequencyBinCount);
      srcNode=actx.createMediaElementSource(audio);
      srcNode.connect(analyser); analyser.connect(actx.destination);
    }catch(e){ actx=null; }
  }
  async function toggleAmbience(){
    ensureAudioGraph();
    if(actx && actx.state==='suspended'){ try{ await actx.resume(); }catch(e){} }
    if(!playing){
      try{
        await audio.play();
        playing=true; SND.on=true;
        ambBtn.classList.add('on'); ambTxt.textContent='Pause ambience';
      }catch(e){
        ambTxt.textContent='Tap again';   // autoplay blocked: ask for another gesture
      }
    } else {
      audio.pause(); playing=false;
      ambBtn.classList.remove('on'); ambTxt.textContent='Play ambience';
    }
  }
  ambBtn.addEventListener('click',toggleAmbience);
  audio.addEventListener('ended',()=>{ playing=false; ambBtn.classList.remove('on'); ambTxt.textContent='Play ambience'; });

  /* ---------- BACKGROUND NEON-RING VISUALIZER ---------- */
  const vc=$('#viz-canvas'), vx=vc.getContext('2d');
  let W,H,DPR=Math.min(devicePixelRatio||1,2);
  function vresize(){ W=vc.width=innerWidth*DPR; H=vc.height=innerHeight*DPR; vc.style.width=innerWidth+'px'; vc.style.height=innerHeight+'px'; }
  vresize(); addEventListener('resize',vresize);
  // rings: [base radius factor, color]
  const RINGS=[
    {rf:0.46, col:[80,200,170], seg:60, amp:10},   // outer green
    {rf:0.34, col:[225,70,90],  seg:50, amp:16},   // red
    {rf:0.24, col:[170,70,220], seg:44, amp:18},   // purple
    {rf:0.15, col:[70,150,255], seg:40, amp:20}    // inner blue
  ];
  function bandEnergy(lo,hi){ if(!freq) return 0; let s=0,n=0; for(let i=lo;i<hi&&i<freq.length;i++){s+=freq[i];n++;} return n?(s/n)/255:0; }
  let t=0;
  function drawViz(now){
    t+=0.016;
    vx.clearRect(0,0,W,H);
    if(analyser&&playing){ try{ analyser.getByteFrequencyData(freq); }catch(e){} }
    const cx=W/2, cy=H*0.5, base=Math.min(W,H);
    RINGS.forEach((ring,ri)=>{
      // energy per band: outer=bass, inner=treble (как в ТЗ)
      let e;
      if(playing){
        const bands=[[0,6],[6,16],[16,30],[30,48]];
        e=bandEnergy(bands[ri][0],bands[ri][1]);
      } else {
        e=0.35+0.25*Math.sin(t*(0.6+ri*0.3)+ri); // pseudo idle
      }
      const R=base*ring.rf*(1+e*0.18);
      const amp=ring.amp*DPR*(0.5+e*1.4);
      const [r,g,b]=ring.col;
      vx.beginPath();
      for(let i=0;i<=ring.seg;i++){
        const a=(i/ring.seg)*Math.PI*2;
        const wob=Math.sin(a*5+t*1.3+ri)*amp + Math.sin(a*9-t*0.8)*amp*0.4;
        const rr=R+wob;
        const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
        i?vx.lineTo(x,y):vx.moveTo(x,y);
      }
      vx.closePath();
      vx.lineWidth=(1.4+e*1.6)*DPR;
      vx.shadowBlur=(14+e*26)*DPR;
      vx.shadowColor=`rgba(${r},${g},${b},${0.55+e*0.4})`;
      vx.strokeStyle=`rgba(${r},${g},${b},${0.5+e*0.45})`;
      vx.stroke();
      vx.shadowBlur=0;
    });
    requestAnimationFrame(drawViz);
  }
  if(reduced){ /* draw a single static frame */ drawViz(0); }
  else requestAnimationFrame(drawViz);

  /* ---------- HERO EYE ---------- */
  const ec=$('#eye-canvas');
  if(ec){
    const ex=ec.getContext('2d'); let emx=0,emy=0,t0=performance.now();
    addEventListener('pointermove',e=>{ emx=(e.clientX/innerWidth-.5); emy=(e.clientY/innerHeight-.5); });
    function eyeFrame(now){
      const w=ec.width,h=ec.height,cx=w/2,cy=h/2,R=150;
      ex.clearRect(0,0,w,h);
      const blinkT=((now-t0)/3200)%1; const open=blinkT>0.96?(1-Math.sin((blinkT-0.96)/0.04*Math.PI)):1;
      ex.save(); ex.translate(emx*16,emy*16);
      const g=ex.createRadialGradient(cx,cy,0,cx,cy,R*1.8);
      g.addColorStop(0,'rgba(150,180,255,.16)');g.addColorStop(1,'rgba(0,0,0,0)');
      ex.fillStyle=g;ex.beginPath();ex.arc(cx,cy,R*1.8,0,7);ex.fill();
      const ew=R*1.15, eh=R*0.6*Math.max(0.06,open);
      ex.beginPath();
      ex.moveTo(cx-ew,cy);
      ex.bezierCurveTo(cx-ew*.5,cy-eh*1.7,cx+ew*.5,cy-eh*1.7,cx+ew,cy);
      ex.bezierCurveTo(cx+ew*.5,cy+eh*1.5,cx-ew*.5,cy+eh*1.5,cx-ew,cy);
      ex.closePath(); ex.strokeStyle='rgba(235,242,255,.9)';ex.lineWidth=2;ex.stroke();
      if(open>0.2){
        const ix2=cx+emx*40,iy=cy+emy*22,ir=R*0.3;
        const ig=ex.createRadialGradient(ix2-6,iy-6,2,ix2,iy,ir);
        ig.addColorStop(0,'rgba(150,180,255,.95)');ig.addColorStop(1,'rgba(18,26,54,.96)');
        ex.fillStyle=ig;ex.beginPath();ex.arc(ix2,iy,ir,0,7);ex.fill();
        ex.fillStyle='#0a0c14';ex.beginPath();ex.arc(ix2,iy,ir*.42,0,7);ex.fill();
        ex.fillStyle='rgba(255,255,255,.85)';ex.beginPath();ex.arc(ix2-ir*.3,iy-ir*.3,ir*.12,0,7);ex.fill();
      }
      ex.restore();
      requestAnimationFrame(eyeFrame);
    }
    if(reduced){ eyeFrame(performance.now()); } else requestAnimationFrame(eyeFrame);
  }

  /* ---------- REVEAL ---------- */
  const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));

  /* ---------- STAT COUNTERS ---------- */
  const sio=new IntersectionObserver(es=>{es.forEach(en=>{if(!en.isIntersecting)return;
    const el=en.target,to=parseInt(el.dataset.to,10)||0;let n=0;const step=Math.max(1,Math.round(to/40));
    const tick=()=>{n+=step;if(n>=to)el.textContent=to;else{el.textContent=n;requestAnimationFrame(tick);}};
    reduced?el.textContent=to:tick();sio.unobserve(el);});},{threshold:.4});
  $$('.stat-n').forEach(el=>sio.observe(el));

  /* ---------- TILT ---------- */
  if(!reduced){ $$('.tilt').forEach(card=>{
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(800px) rotateY(${px*5}deg) rotateX(${-py*5}deg) translateY(-4px)`;});
    card.addEventListener('pointerleave',()=>card.style.transform='');});}

  /* ---------- LIGHTBOX ---------- */
  const lb=$('#lightbox'), lbImg=$('#lb-img');
  $$('.shot').forEach(s=>s.addEventListener('click',()=>{
    const full=s.dataset.full; if(!full) return; lbImg.src=full; lb.hidden=false; }));
  function closeLb(){ lb.hidden=true; lbImg.src=''; }
  lb.addEventListener('click',e=>{ if(e.target===lb||e.target.classList.contains('lb-close')) closeLb(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!lb.hidden) closeLb(); });

  /* ---------- GITHUB RELEASE ---------- */
  const REPO='creator-ghost/visionedge';
  const fmt=b=>b?(b/1048576).toFixed(1)+' МБ':'';
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    .then(r=>{if(!r.ok)throw 0;return r.json();})
    .then(rel=>{
      const tag=rel.tag_name||rel.name||'latest';
      const date=rel.published_at?new Date(rel.published_at).toLocaleDateString('ru-RU'):'';
      $('#version-text').textContent=`Последняя версия: ${tag}`;
      $('#dl-version-head').textContent=`VisionEdge ${tag}`;
      const a=rel.assets||[];
      const win=a.find(x=>/visionedge\.zip$/i.test(x.name));
      const mac=a.find(x=>/visionedge-macos\.zip$/i.test(x.name));
      let meta=date?`Выпущено ${date}`:'';
      if(win){const u=win.browser_download_url;$('#dl-win').href=u;$('#dl-win-2').href=u;meta+=win.size?` · Windows ${fmt(win.size)}`:'';}
      if(mac){const u=mac.browser_download_url;$('#dl-mac').href=u;$('#dl-mac-2').href=u;}
      else{ $('#mac-sub').textContent='скоро';
        [$('#dl-mac'),$('#dl-mac-2')].forEach(b=>{if(b){b.title='macOS version is coming soon';
          b.addEventListener('click',ev=>{ev.preventDefault();alert('macOS version is coming soon');});}});}
      $('#dl-meta').textContent=meta||'Релиз доступен на GitHub';
    })
    .catch(()=>{
      $('#version-text').textContent='Открыть релизы на GitHub';
      $('#dl-meta').textContent='Не удалось получить данные релиза — откройте GitHub Releases.';
      ['#dl-win','#dl-mac','#dl-win-2','#dl-mac-2'].forEach(id=>{const el=$(id);if(el)el.href='https://github.com/creator-ghost/visionedge/releases';});
    });
})();
