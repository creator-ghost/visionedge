'use strict';
(function(){
  const $=(s,r)=>(r||document).querySelector(s);
  const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const LS=window.localStorage;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- STATE ---------- */
  const DEFAULT_TILES=[
    {t:'Google',u:'https://google.com',i:'🔍'},
    {t:'YouTube',u:'https://youtube.com',i:'▶️'},
    {t:'GitHub',u:'https://github.com',i:'🐙'},
    {t:'Wikipedia',u:'https://wikipedia.org',i:'📖'},
    {t:'Reddit',u:'https://reddit.com',i:'👽'},
    {t:'Telegram',u:'https://web.telegram.org',i:'✈️'},
    {t:'WhatsApp',u:'https://web.whatsapp.com',i:'💬'}
  ];
  function load(key,def){ try{ const v=LS.getItem('ve_'+key); return v?JSON.parse(v):def; }catch(e){ return def; } }
  function save(key,val){ try{ LS.setItem('ve_'+key,JSON.stringify(val)); }catch(e){} }

  let tiles=load('tiles',DEFAULT_TILES);
  let bookmarks=load('bm',[{t:'GitHub VisionEdge',u:'https://github.com/creator-ghost/visionedge'}]);
  let recent=load('recent',[]);
  let settings=load('set',{sound:true,engine:'https://www.google.com/search?q=',aikey:'',
    aiurl:'https://api.openai.com/v1/chat/completions',aimodel:'gpt-4o-mini'});

  /* ---------- SOUND (WebAudio, no files needed) ---------- */
  const SND={ctx:null,
    tap(){ if(!settings.sound) return; try{
      if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      if(this.ctx.state==='suspended') this.ctx.resume();
      const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type='sine';o.frequency.setValueAtTime(420,t);o.frequency.exponentialRampToValueAtTime(240,t+.06);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.004);
      g.gain.exponentialRampToValueAtTime(.0001,t+.08);
      o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+.08);
    }catch(e){} } };
  document.addEventListener('click',e=>{ if(e.target.closest('button,.tile,.r,.bm,.engines button')) SND.tap(); });

  /* ---------- SMART OPEN (iframe restrictions -> new tab) ---------- */
  function norm(u){ u=(u||'').trim(); if(!u) return ''; 
    if(/^https?:\/\//i.test(u)) return u;
    if(/^[\w-]+(\.[\w-]+)+/.test(u)) return 'https://'+u;
    return null; }
  function openURL(u){
    const url=norm(u);
    if(url){ pushRecent(url); window.open(url,'_blank','noopener'); }
  }
  function searchOrOpen(text){
    const url=norm(text);
    if(url){ pushRecent(url); window.open(url,'_blank','noopener'); }
    else { const q=settings.engine+encodeURIComponent(text); pushRecent(q); window.open(q,'_blank','noopener'); }
  }
  function pushRecent(u){ recent=[u,...recent.filter(x=>x!==u)].slice(0,8); save('recent',recent); renderRecent(); }

  /* ---------- RENDER ---------- */
  function renderDial(){
    const d=$('#dial'); d.innerHTML='';
    tiles.forEach((tile,idx)=>{
      const el=document.createElement('div'); el.className='tile';
      el.innerHTML=`<div class="ti">${tile.i||'🌐'}</div><div class="tt">${tile.t}</div>`;
      el.addEventListener('click',()=>openURL(tile.u));
      el.addEventListener('contextmenu',ev=>{ev.preventDefault();
        if(confirm('Удалить плитку "'+tile.t+'"?')){ tiles.splice(idx,1); save('tiles',tiles); renderDial(); }});
      d.appendChild(el);
    });
  }
  function renderRecent(){
    const r=$('#recent'); if(!r) return; r.innerHTML='';
    recent.forEach(u=>{ const el=document.createElement('div'); el.className='r'; el.textContent=u;
      el.addEventListener('click',()=>openURL(u)); r.appendChild(el); });
  }
  function renderBookmarks(){
    const l=$('#bm-list'); l.innerHTML='';
    if(!bookmarks.length){ l.innerHTML='<div class="r">Пока нет закладок</div>'; return; }
    bookmarks.forEach((b,idx)=>{
      const el=document.createElement('div'); el.className='bm';
      el.innerHTML=`<div><b>${b.t}</b><small>${b.u}</small></div><button class="del">×</button>`;
      el.querySelector('div').addEventListener('click',()=>openURL(b.u));
      el.querySelector('.del').addEventListener('click',ev=>{ev.stopPropagation();
        bookmarks.splice(idx,1);save('bm',bookmarks);renderBookmarks();});
      l.appendChild(el);
    });
  }
  function renderEngines(){
    const e=$('#engines'); const list=[['Google','https://www.google.com/search?q='],
      ['DuckDuckGo','https://duckduckgo.com/?q='],['Yandex','https://yandex.ru/search/?text='],
      ['Bing','https://www.bing.com/search?q=']];
    e.innerHTML=''; list.forEach(([n,u])=>{ const b=document.createElement('button'); b.textContent=n;
      b.addEventListener('click',()=>{ settings.engine=u; save('set',settings); $('#set-engine').value=u; }); e.appendChild(b); });
  }

  /* ---------- NAV ---------- */
  $$('.m-nav button').forEach(b=>b.addEventListener('click',()=>{
    const v=b.dataset.view;
    $$('.m-nav button').forEach(x=>x.classList.toggle('active',x===b));
    $$('.view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));
  }));

  /* ---------- SEARCH HANDLERS ---------- */
  function bindSearch(input){ if(!input) return;
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const v=input.value.trim(); if(v){searchOrOpen(v);input.blur();} } }); }
  bindSearch($('#home-search')); bindSearch($('#search-input'));

  /* ---------- ADD TILE / BOOKMARK ---------- */
  $('#add-tile').addEventListener('click',()=>{
    const t=prompt('Название:'); if(!t) return;
    const u=prompt('URL:','https://'); if(!u) return;
    const i=prompt('Эмодзи/иконка:','🌐')||'🌐';
    tiles.push({t,u:norm(u)||u,i}); save('tiles',tiles); renderDial();
  });
  $('#add-bm').addEventListener('click',()=>{
    const t=prompt('Название:'); if(!t) return;
    const u=prompt('URL:','https://'); if(!u) return;
    bookmarks.push({t,u:norm(u)||u}); save('bm',bookmarks); renderBookmarks();
  });

  /* ---------- AI ---------- */
  const aiChat=$('#ai-chat');
  function addMsg(text,who){ const m=document.createElement('div');
    m.className='ai-msg '+(who==='user'?'ai-user':'ai-bot'); m.textContent=text;
    aiChat.appendChild(m); aiChat.scrollTop=aiChat.scrollHeight; return m; }
  async function aiSend(){
    const inp=$('#ai-text'); const text=inp.value.trim(); if(!text) return;
    addMsg(text,'user'); inp.value='';
    if(!settings.aikey){ addMsg('Чтобы отвечать по-настоящему, добавьте API-ключ в Настройках. Сейчас работаю как заглушка: вы написали — "'+text+'".','bot'); return; }
    const loading=addMsg('…','bot');
    try{
      const res=await fetch(settings.aiurl,{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+settings.aikey},
        body:JSON.stringify({model:settings.aimodel,messages:[{role:'user',content:text}]})});
      const data=await res.json();
      const out=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'(пустой ответ)';
      loading.textContent=out;
    }catch(e){ loading.textContent='Ошибка запроса к AI: '+e.message; }
    aiChat.scrollTop=aiChat.scrollHeight;
  }
  $('#ai-send').addEventListener('click',aiSend);
  $('#ai-text').addEventListener('keydown',e=>{ if(e.key==='Enter') aiSend(); });

  /* ---------- SETTINGS ---------- */
  const setSound=$('#set-sound'), setEngine=$('#set-engine'), setKey=$('#set-aikey'),
        setUrl=$('#set-aiurl'), setModel=$('#set-aimodel');
  setSound.checked=settings.sound; setEngine.value=settings.engine;
  setKey.value=settings.aikey; setUrl.value=settings.aiurl; setModel.value=settings.aimodel;
  function persist(){ settings={sound:setSound.checked,engine:setEngine.value,aikey:setKey.value,
    aiurl:setUrl.value||'https://api.openai.com/v1/chat/completions',aimodel:setModel.value||'gpt-4o-mini'};
    save('set',settings); }
  [setSound,setEngine,setKey,setUrl,setModel].forEach(el=>el.addEventListener('change',persist));
  $('#clear-data').addEventListener('click',()=>{ if(confirm('Очистить все данные приложения?')){
    ['tiles','bm','recent','set'].forEach(k=>LS.removeItem('ve_'+k)); location.reload(); }});

  /* ---------- PWA INSTALL ---------- */
  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e;
    const b=$('#install-btn'); b.hidden=false;
    b.addEventListener('click',async()=>{ b.hidden=true; deferredPrompt.prompt();
      await deferredPrompt.userChoice; deferredPrompt=null; },{once:true}); });

  /* ---------- SERVICE WORKER + OFFLINE ---------- */
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }
  function updateOnline(){ $('#offline').hidden = navigator.onLine; }
  window.addEventListener('online',updateOnline);
  window.addEventListener('offline',updateOnline);

  /* ---------- INIT ---------- */
  renderDial(); renderBookmarks(); renderRecent(); renderEngines();
  // splash
  setTimeout(()=>{ const s=$('#splash'); if(s){ s.classList.add('hide'); setTimeout(()=>s.remove(),600); } }, reduced?200:2400);
})();
