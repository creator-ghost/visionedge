'use strict';
(function(){
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));

  /* ---------- ЗАЩИТА ОТ КОПИРОВАНИЯ (ПК) ---------- */
  // Полностью запретить копирование в браузере нельзя, но это отсекает
  // обычное выделение, ПКМ, Ctrl+C/A/X и перетаскивание. Поля ввода не трогаем.
  function inField(t){ return t && (t.closest && t.closest('input,textarea,[contenteditable]')); }
  document.addEventListener('contextmenu', e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('copy',  e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('cut',   e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('selectstart', e=>{ if(!inField(e.target)) e.preventDefault(); });
  document.addEventListener('keydown', e=>{
    if(inField(e.target)) return;
    const k=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey) && ['c','x','a','s','u'].includes(k)) e.preventDefault();
  });

  /* ---------- YEAR ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- PWA SERVICE WORKER ---------- */
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=> navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
  }

  /* ---------- BURGER ---------- */
  const burger = $('#burger'), links = $('.nav-links');
  if (burger) burger.addEventListener('click', ()=> links.classList.toggle('open'));
  $$('.nav-links a').forEach(a=> a.addEventListener('click', ()=> links.classList.remove('open')));

  /* ---------- OS DETECT ---------- */
  const ua = navigator.userAgent;
  const isMac = /Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua);
  const isWin = /Windows/i.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  function highlight(id){ const el=$(id); if(el) el.classList.add('btn-primary'); }
  if (isMac){ const m=$('#dl-mac'); if(m){m.classList.remove('btn-ghost');m.classList.add('btn-primary');} }
  if (isMobile){ const om=$('#open-mobile'); if(om){om.classList.remove('btn-ghost');om.classList.add('btn-primary');} }

  /* ---------- SOUND ---------- */
  const SND = {
    on:false, ctx:null,
    init(){ if(this.ctx) return; try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} },
    blip(type){
      if(!this.on||!this.ctx) return;
      try{
        const t=this.ctx.currentTime, o=this.ctx.createOscillator(), g=this.ctx.createGain();
        const map={hover:[520,.03,.04],click:[330,.05,.08],download:[260,.12,.14],section:[440,.05,.07]};
        const [f,vol,dur]=map[type]||map.click;
        o.type='sine'; o.frequency.setValueAtTime(f,t);
        o.frequency.exponentialRampToValueAtTime(f*0.6,t+dur);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.005);
        g.gain.exponentialRampToValueAtTime(.0001,t+dur);
        o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t+dur);
      }catch(e){}
    }
  };
  const sndToggle = $('#sound-toggle');
  sndToggle.addEventListener('click', ()=>{
    SND.init();
    if(SND.ctx && SND.ctx.state==='suspended') SND.ctx.resume();
    SND.on=!SND.on;
    sndToggle.classList.toggle('on',SND.on);
    sndToggle.querySelector('.snd-txt').textContent = SND.on?'Sound: On':'Enable Sound';
    if(SND.on) SND.blip('click');
  });
  document.addEventListener('pointerover', e=>{
    const el=e.target.closest('[data-snd]'); if(el&&el.dataset.snd==='hover') SND.blip('hover');
  });
  document.addEventListener('click', e=>{
    const el=e.target.closest('[data-snd]'); if(!el) return;
    const t=el.dataset.snd; if(t==='click'||t==='download') SND.blip(t);
  });

  /* ---------- REVEAL ON SCROLL ---------- */
  const io = new IntersectionObserver((es)=>{
    es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);
      if(en.target.dataset.snd) {} } });
  },{threshold:.12});
  $$('.reveal').forEach(el=> io.observe(el));

  /* ---------- STAT COUNTERS ---------- */
  const statIO = new IntersectionObserver((es)=>{
    es.forEach(en=>{
      if(!en.isIntersecting) return;
      const el=en.target, to=parseInt(el.dataset.to,10)||0; let n=0;
      const step=Math.max(1,Math.round(to/40));
      const tick=()=>{ n+=step; if(n>=to){el.textContent=to;} else {el.textContent=n; requestAnimationFrame(tick);} };
      if(reduced) el.textContent=to; else tick();
      statIO.unobserve(el);
    });
  },{threshold:.4});
  $$('.stat-n').forEach(el=> statIO.observe(el));

  /* ---------- TILT CARDS ---------- */
  if(!reduced){
    $$('.tilt').forEach(card=>{
      card.addEventListener('pointermove', e=>{
        const r=card.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(800px) rotateY(${px*6}deg) rotateX(${-py*6}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', ()=> card.style.transform='');
    });
  }

  /* ---------- BACKGROUND PARTICLE NETWORK ---------- */
  const bg = $('#bg-canvas'), bx = bg.getContext('2d');
  let W,H,pts=[], mouse={x:-999,y:-999};
  function resize(){ W=bg.width=innerWidth*devicePixelRatio; H=bg.height=innerHeight*devicePixelRatio;
    bg.style.width=innerWidth+'px'; bg.style.height=innerHeight+'px'; }
  function makePts(){ const count = isMobile?28:Math.min(70,Math.floor(innerWidth/22));
    pts=[]; for(let i=0;i<count;i++){ pts.push({x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-.5)*0.18*devicePixelRatio,vy:(Math.random()-.5)*0.18*devicePixelRatio}); } }
  resize(); makePts();
  addEventListener('resize',()=>{resize();makePts();});
  addEventListener('pointermove',e=>{ mouse.x=e.clientX*devicePixelRatio; mouse.y=e.clientY*devicePixelRatio; });
  let parX=0,parY=0;
  function drawBG(){
    bx.clearRect(0,0,W,H);
    // parallax drift toward mouse
    parX += ((mouse.x-W/2)*0.01 - parX)*0.05;
    parY += ((mouse.y-H/2)*0.01 - parY)*0.05;
    const md=140*devicePixelRatio;
    for(let i=0;i<pts.length;i++){
      const p=pts[i]; p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1;
      const dx=p.x-mouse.x, dy=p.y-mouse.y, dist=Math.hypot(dx,dy);
      let ox=p.x+parX, oy=p.y+parY;
      if(dist<md){ ox+=dx/dist*(md-dist)*0.06; oy+=dy/dist*(md-dist)*0.06; }
      for(let j=i+1;j<pts.length;j++){
        const q=pts[j], d=Math.hypot(p.x-q.x,p.y-q.y);
        if(d<150*devicePixelRatio){
          bx.strokeStyle=`rgba(140,170,255,${(1-d/(150*devicePixelRatio))*0.10})`;
          bx.lineWidth=devicePixelRatio*.6;
          bx.beginPath(); bx.moveTo(ox,oy); bx.lineTo(q.x+parX,q.y+parY); bx.stroke();
        }
      }
      bx.fillStyle='rgba(190,210,255,.5)';
      bx.beginPath(); bx.arc(ox,oy,devicePixelRatio*1.2,0,7); bx.fill();
    }
    requestAnimationFrame(drawBG);
  }
  if(!reduced) drawBG(); else { /* static subtle dots */ drawBG.call&&null; }

  /* ---------- HERO: GLOBE -> EYE CANVAS ---------- */
  const ec = $('#eye-canvas'), ex = ec.getContext('2d');
  let t0=performance.now(), morph=0; // 0 globe -> 1 eye
  let emx=0,emy=0;
  addEventListener('pointermove',e=>{ emx=(e.clientX/innerWidth-.5); emy=(e.clientY/innerHeight-.5); });
  function eyeFrame(now){
    const dt=now-t0;
    // first ~2.5s show globe, then morph to eye, gentle pulsing
    morph = Math.min(1, Math.max(0,(dt-2200)/1600));
    const w=ec.width,h=ec.height,cx=w/2,cy=h/2,R=150;
    ex.clearRect(0,0,w,h);
    ex.save(); ex.translate(emx*16,emy*16);
    // glow
    const g=ex.createRadialGradient(cx,cy,0,cx,cy,R*1.8);
    g.addColorStop(0,'rgba(150,180,255,.18)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ex.fillStyle=g; ex.beginPath(); ex.arc(cx,cy,R*1.8,0,7); ex.fill();

    if(morph<1){
      // globe: circle + rotating meridians
      const rot=(now/1000)*0.6;
      ex.globalAlpha=1-morph*0.6;
      ex.strokeStyle='rgba(230,238,255,'+(0.85*(1-morph))+')'; ex.lineWidth=2.2;
      ex.beginPath(); ex.arc(cx,cy,R,0,7); ex.stroke();
      ex.lineWidth=1.2;
      for(let i=0;i<5;i++){
        const f=(i/4)*2-1, mw=Math.abs(R*Math.cos(rot+f*1.2));
        ex.strokeStyle='rgba(200,215,255,'+(0.5*(1-morph))+')';
        ex.beginPath(); ex.ellipse(cx,cy,mw,R,0,0,7); ex.stroke();
      }
      for(let j=1;j<3;j++){ const yy=R*j/3;
        ex.beginPath(); ex.moveTo(cx-R,cy-yy); ex.lineTo(cx+R,cy-yy); ex.stroke();
        ex.beginPath(); ex.moveTo(cx-R,cy+yy); ex.lineTo(cx+R,cy+yy); ex.stroke(); }
      ex.globalAlpha=1;
    }
    if(morph>0){
      // eye shape
      ex.globalAlpha=morph;
      const ew=R*1.15, eh=R*0.62*(0.5+0.5*Math.abs(Math.sin(now/2400)));
      ex.beginPath();
      ex.moveTo(cx-ew,cy);
      ex.bezierCurveTo(cx-ew*.5,cy-eh*1.7,cx+ew*.5,cy-eh*1.7,cx+ew,cy);
      ex.bezierCurveTo(cx+ew*.5,cy+eh*1.5,cx-ew*.5,cy+eh*1.5,cx-ew,cy);
      ex.closePath();
      ex.strokeStyle='rgba(235,242,255,.9)'; ex.lineWidth=2; ex.stroke();
      // iris follows mouse
      const ix=cx+emx*40, iy=cy+emy*22, ir=R*0.30;
      const ig=ex.createRadialGradient(ix-6,iy-6,2,ix,iy,ir);
      ig.addColorStop(0,'rgba(150,180,255,.9)'); ig.addColorStop(1,'rgba(20,30,60,.95)');
      ex.fillStyle=ig; ex.beginPath(); ex.arc(ix,iy,ir,0,7); ex.fill();
      ex.fillStyle='#0a0c14'; ex.beginPath(); ex.arc(ix,iy,ir*0.42,0,7); ex.fill();
      ex.fillStyle='rgba(255,255,255,.85)'; ex.beginPath(); ex.arc(ix-ir*.3,iy-ir*.3,ir*0.12,0,7); ex.fill();
      ex.globalAlpha=1;
    }
    ex.restore();
    requestAnimationFrame(eyeFrame);
  }
  if(ec){ if(reduced){ morph=1; eyeFrame(performance.now()+5000);} else requestAnimationFrame(eyeFrame); }

  /* ---------- GITHUB RELEASE ---------- */
  const REPO='creator-ghost/visionedge';
  function fmtSize(b){ if(!b) return ''; const mb=b/1048576; return mb.toFixed(1)+' МБ'; }
  fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    .then(r=>{ if(!r.ok) throw new Error('no release'); return r.json(); })
    .then(rel=>{
      const tag=rel.tag_name||rel.name||'latest';
      const date=rel.published_at?new Date(rel.published_at).toLocaleDateString('ru-RU'):'';
      $('#version-text').textContent = `Последняя версия: ${tag}`;
      $('#dl-version-head').textContent = `VisionEdge ${tag}`;
      const assets=rel.assets||[];
      const win=assets.find(a=>/visionedge\.zip$/i.test(a.name));
      const mac=assets.find(a=>/visionedge-macos\.zip$/i.test(a.name));
      let meta = date?`Выпущено ${date}`:'';
      if(win){ const u=win.browser_download_url;
        $('#dl-win').href=u; $('#dl-win-2').href=u;
        meta += win.size?` · Windows ${fmtSize(win.size)}`:''; }
      if(mac){ const u=mac.browser_download_url;
        $('#dl-mac').href=u; $('#dl-mac-2').href=u; $('#mac-sub').textContent='VisionEdge-macOS.zip';
      } else {
        $('#mac-sub').textContent='скоро';
        const macBtns=[$('#dl-mac'),$('#dl-mac-2')];
        macBtns.forEach(b=>{ if(b){ b.title='macOS version is coming soon';
          b.addEventListener('click',ev=>{ ev.preventDefault(); alert('macOS version is coming soon'); }); }});
      }
      $('#dl-meta').textContent = meta || 'Релиз доступен на GitHub';
    })
    .catch(()=>{
      $('#version-text').textContent = 'Открыть релизы на GitHub';
      $('#dl-meta').textContent = 'Не удалось получить данные релиза — откройте GitHub Releases.';
      // fallback: all buttons -> releases page
      ['#dl-win','#dl-mac','#dl-win-2','#dl-mac-2'].forEach(id=>{
        const el=$(id); if(el) el.href='https://github.com/creator-ghost/visionedge/releases';
      });
    });
})();
