'use strict';
(function(){
  const $=(s,r)=>(r||document).querySelector(s);
  const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
  const LS=window.localStorage;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- CACHE RESET ---------- */
  if(location.search.includes('reset')){
    if('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
    if('caches' in window) caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)));
  }

  /* ---------- STATE ---------- */
  const DEFAULT_TILES=[
    {t:'Google',u:'https://google.com',i:'🔍'},
    {t:'YouTube',u:'https://youtube.com',i:'▶️'},
    {t:'GitHub',u:'https://github.com',i:'🐙'},
    {t:'Wikipedia',u:'https://wikipedia.org',i:'📖'},
    {t:'Telegram',u:'https://web.telegram.org',i:'✈️'},
    {t:'WhatsApp',u:'https://web.whatsapp.com',i:'💬'}
  ];
  const load=(k,d)=>{try{const v=LS.getItem('ve_'+k);return v?JSON.parse(v):d;}catch(e){return d;}};
  const save=(k,v)=>{try{LS.setItem('ve_'+k,JSON.stringify(v));}catch(e){}};
  let tiles=load('tiles',DEFAULT_TILES);
  let recent=load('recent',[]);
  let settings=load('set',{sound:true,engine:'https://www.google.com/search?q=',aikey:'',
    aiurl:'https://api.openai.com/v1/chat/completions',aimodel:'gpt-4o-mini'});

  /* ---------- UI SOUND ---------- */
  const SND={ctx:null,tap(){if(!settings.sound)return;try{
    if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    if(this.ctx.state==='suspended')this.ctx.resume();
    const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(420,t);o.frequency.exponentialRampToValueAtTime(240,t+.06);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.08);
    o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+.08);
  }catch(e){}}};
  document.addEventListener('click',e=>{if(e.target.closest('button,.tile,.r,.engines button'))SND.tap();});

  /* ---------- AMBIENCE MUSIC ---------- */
  const mAudio=$('#m-audio'); let mPlaying=false;
  const ambBtn=$('#m-amb-btn');
  async function toggleAmb(){
    try{
      if(!mPlaying){ await mAudio.play(); mPlaying=true; if(ambBtn) ambBtn.textContent='Pause ambience'; }
      else { mAudio.pause(); mPlaying=false; if(ambBtn) ambBtn.textContent='Play ambience'; }
    }catch(e){ if(ambBtn) ambBtn.textContent='Tap again'; }
  }
  if(ambBtn) ambBtn.addEventListener('click',toggleAmb);
  if(mAudio) mAudio.addEventListener('ended',()=>{mPlaying=false; if(ambBtn)ambBtn.textContent='Play ambience';});

  /* ---------- OPEN ---------- */
  function norm(u){u=(u||'').trim();if(!u)return '';if(/^https?:\/\//i.test(u))return u;
    if(/^[\w-]+(\.[\w-]+)+/.test(u))return 'https://'+u;return null;}
  function openURL(u){const url=norm(u);if(url){pushRecent(url);window.open(url,'_blank','noopener');}}
  function searchOrOpen(text){const url=norm(text);
    if(url){pushRecent(url);window.open(url,'_blank','noopener');}
    else{const q=settings.engine+encodeURIComponent(text);pushRecent(q);window.open(q,'_blank','noopener');}}
  function pushRecent(u){recent=[u,...recent.filter(x=>x!==u)].slice(0,8);save('recent',recent);renderRecent();}

  /* ---------- RENDER ---------- */
  /* ---------- SPEED DIAL (iPhone-style edit mode) ---------- */
  let editMode = false;
  let lpTimer = null;          // long-press timer
  let dragIdx = null;          // index being dragged

  function setEditMode(on){
    editMode = on;
    const dial = $('#dial');
    if (dial) dial.classList.toggle('editing', on);
    const done = $('#dial-done');
    if (done) done.hidden = !on;
    renderDial();
    if (on && navigator.vibrate) { try { navigator.vibrate(15); } catch(e){} }
  }

  function renderDial(){
    const d=$('#dial'); if(!d) return; d.innerHTML='';
    tiles.forEach((tile,idx)=>{
      const el=document.createElement('div');
      el.className='tile'+(editMode?' jiggle':'');
      el.dataset.idx=idx;
      el.innerHTML =
        (editMode?'<button class="tile-del" aria-label="Удалить">−</button>':'')+
        `<div class="ti">${tile.i||'🌐'}</div><div class="tt">${tile.t}</div>`;

      // обычный тап — открыть (только вне режима редактирования)
      el.addEventListener('click',(ev)=>{
        if(editMode){ ev.preventDefault(); return; }
        openURL(tile.u);
      });

      // long-press → включить edit mode
      const startLP=()=>{ if(editMode) return;
        lpTimer=setTimeout(()=>setEditMode(true),500); };
      const cancelLP=()=>{ if(lpTimer){clearTimeout(lpTimer);lpTimer=null;} };
      el.addEventListener('touchstart',startLP,{passive:true});
      el.addEventListener('touchend',cancelLP);
      el.addEventListener('touchmove',cancelLP,{passive:true});
      el.addEventListener('mousedown',startLP);
      el.addEventListener('mouseup',cancelLP);
      el.addEventListener('mouseleave',cancelLP);

      // кнопка удаления
      if(editMode){
        const del=el.querySelector('.tile-del');
        if(del) del.addEventListener('click',(ev)=>{
          ev.stopPropagation();
          if(confirm('Удалить плитку «'+tile.t+'»?')){
            tiles.splice(idx,1); save('tiles',tiles); renderDial();
          }
        });
        // drag-reorder (touch + mouse через Pointer Events)
        el.setAttribute('draggable','false');
        el.addEventListener('pointerdown',()=>{ dragIdx=idx; });
        el.addEventListener('pointerenter',()=>{
          if(dragIdx!==null && dragIdx!==idx){
            const moved=tiles.splice(dragIdx,1)[0];
            tiles.splice(idx,0,moved);
            dragIdx=idx; save('tiles',tiles); renderDial();
          }
        });
      }
      d.appendChild(el);
    });
  }
  // отпускание пальца/мыши завершает перетаскивание
  document.addEventListener('pointerup',()=>{ dragIdx=null; });

  // кнопка Done
  const doneBtn=$('#dial-done');
  if(doneBtn) doneBtn.addEventListener('click',()=>setEditMode(false));
  function renderRecent(){const r=$('#recent');if(!r)return;r.innerHTML='';
    recent.forEach(u=>{const el=document.createElement('div');el.className='r';el.textContent=u;
      el.addEventListener('click',()=>openURL(u));r.appendChild(el);});}
  function renderEngines(){const e=$('#engines');if(!e)return;
    const list=[['Google','https://www.google.com/search?q='],['DuckDuckGo','https://duckduckgo.com/?q='],
      ['Yandex','https://yandex.ru/search/?text='],['Bing','https://www.bing.com/search?q=']];
    e.innerHTML='';list.forEach(([n,u])=>{const b=document.createElement('button');b.textContent=n;
      b.addEventListener('click',()=>{settings.engine=u;save('set',settings);const se=$('#set-engine');if(se)se.value=u;});e.appendChild(b);});}

  /* ---------- NAV ---------- */
  $$('.m-nav button').forEach(b=>b.addEventListener('click',()=>{
    const v=b.dataset.view;$$('.m-nav button').forEach(x=>x.classList.toggle('active',x===b));
    $$('.view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));}));

  /* ---------- SEARCH ---------- */
  function bindSearch(input){if(!input)return;
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){const v=input.value.trim();if(v){searchOrOpen(v);input.blur();}}});}
  bindSearch($('#home-search'));bindSearch($('#search-input'));

  /* ---------- ADD TILE ---------- */
  const addTile=$('#add-tile'); if(addTile) addTile.addEventListener('click',()=>{
    const t=prompt('Название:');if(!t)return;const u=prompt('URL:','https://');if(!u)return;
    const i=prompt('Эмодзи/иконка:','🌐')||'🌐';tiles.push({t,u:norm(u)||u,i});save('tiles',tiles);renderDial();});

  /* ---------- AI ---------- */
  const aiChat=$('#ai-chat');
  function addMsg(text,who){const m=document.createElement('div');
    m.className='ai-msg '+(who==='user'?'ai-user':'ai-bot');m.textContent=text;
    aiChat.appendChild(m);aiChat.scrollTop=aiChat.scrollHeight;return m;}
  async function aiSend(){const inp=$('#ai-text');const text=inp.value.trim();if(!text)return;
    addMsg(text,'user');inp.value='';
    if(!settings.aikey){addMsg('Демо-режим: добавьте API-ключ в Настройках, чтобы получать настоящие ответы. Вы написали — "'+text+'".','bot');return;}
    const loading=addMsg('…','bot');
    try{const res=await fetch(settings.aiurl,{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+settings.aikey},
      body:JSON.stringify({model:settings.aimodel,messages:[{role:'user',content:text}]})});
      const data=await res.json();
      loading.textContent=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'(пустой ответ)';
    }catch(e){loading.textContent='Ошибка запроса к AI: '+e.message;}aiChat.scrollTop=aiChat.scrollHeight;}
  $('#ai-send').addEventListener('click',aiSend);
  $('#ai-text').addEventListener('keydown',e=>{if(e.key==='Enter')aiSend();});

  /* ---------- SETTINGS ---------- */
  const setSound=$('#set-sound'),setEngine=$('#set-engine'),setKey=$('#set-aikey'),setUrl=$('#set-aiurl'),setModel=$('#set-aimodel');
  if(setSound)setSound.checked=settings.sound;if(setEngine)setEngine.value=settings.engine;
  if(setKey)setKey.value=settings.aikey;if(setUrl)setUrl.value=settings.aiurl;if(setModel)setModel.value=settings.aimodel;
  function persist(){settings={sound:setSound?setSound.checked:true,engine:setEngine?setEngine.value:settings.engine,
    aikey:setKey?setKey.value:'',aiurl:(setUrl&&setUrl.value)||'https://api.openai.com/v1/chat/completions',
    aimodel:(setModel&&setModel.value)||'gpt-4o-mini'};save('set',settings);}
  [setSound,setEngine,setKey,setUrl,setModel].forEach(el=>el&&el.addEventListener('change',persist));
  const clr=$('#clear-data');if(clr)clr.addEventListener('click',()=>{if(confirm('Очистить все данные приложения?')){
    ['tiles','recent','set'].forEach(k=>LS.removeItem('ve_'+k));location.reload();}});
  const rst=$('#reset-cache');if(rst)rst.addEventListener('click',async()=>{
    if(!confirm('Сбросить кэш и обновить версию приложения?'))return;
    try{ if('serviceWorker' in navigator){ const rs=await navigator.serviceWorker.getRegistrations(); for(const r of rs) await r.unregister(); } }catch(e){}
    try{ if('caches' in window){ const ks=await caches.keys(); for(const k of ks) await caches.delete(k); } }catch(e){}
    location.replace(location.pathname+'?reset='+Date.now());
  });

  /* ---------- PWA INSTALL ---------- */
  let deferred=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;
    const b=$('#install-btn');if(!b)return;b.hidden=false;
    b.addEventListener('click',async()=>{b.hidden=true;deferred.prompt();await deferred.userChoice;deferred=null;},{once:true});});

  /* ---------- KILL ANY OLD SERVICE WORKER + CACHE ---------- */
  // SW и кэш полностью отключены. Если у пользователя остался старый SW из
  // прошлых версий — сносим его и чистим все кэши при каждом заходе.
  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
  }
  if('caches' in window){
    caches.keys().then(ks=>ks.forEach(k=>caches.delete(k))).catch(()=>{});
  }

  /* ---------- INIT ---------- */
  renderDial();renderRecent();renderEngines();
  setTimeout(()=>{const s=$('#splash');if(s){s.classList.add('hide');setTimeout(()=>s.remove(),600);}},reduced?200:2400);
})();
