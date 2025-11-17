/* YLO - app.js (App-style single-repo with hash routing) */
(function(){
  // simple storage helpers
  const S = {
    get(k){ try{return JSON.parse(localStorage.getItem(k));}catch(e){return null} },
    set(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
  };
  function ensure(){
    if(!S.get('y_users')) S.set('y_users',[{id:'u_founder',username:'António',avatar:null,verified:true,followers:6000}]);
    if(!S.get('y_session')) S.set('y_session',{id:'u_founder'});
    if(!S.get('y_posts')) S.set('y_posts',[{id:'p1',userId:'u_founder',text:'Olá YLO! Primeira publicação.',media:null,createdAt:new Date().toLocaleString()}]);
    if(!S.get('y_chats')) S.set('y_chats',[]);
    if(!S.get('y_reels')) S.set('y_reels',[]);
    if(!S.get('y_ads')) S.set('y_ads',[]);
  } ensure();

  // DOM
  const $ = id => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const tabs = [...document.querySelectorAll('.tab-btn')];

  // helpers
  function navTo(screen){
    location.hash = '#/'+screen;
  }
  function setActive(screen){
    screens.forEach(s=> s.classList.toggle('active', s.dataset.screen===screen));
    tabs.forEach(t=> t.classList.toggle('active', t.dataset.target===screen));
    // small UI adjustments
  }

  // routing
  function handleHash(){
    const h = location.hash.replace('#/','') || 'feed';
    setActive(h);
    if(h==='feed') renderFeed();
    if(h==='chat') renderChatList();
    if(h==='search') focusSearch();
    if(h==='profile') renderProfile();
    if(h==='monet') renderMonet();
    if(h==='settings') renderSettings();
  }
  window.addEventListener('hashchange', handleHash);
  // tab clicks
  tabs.forEach(t=> t.addEventListener('click', ()=> navTo(t.dataset.target)));
  // top buttons
  $('btn-chat').addEventListener('click', ()=> navTo('chat'));
  $('btn-search').addEventListener('click', ()=> navTo('search'));
  $('btn-home').addEventListener('click', ()=> navTo('feed'));

  // back buttons inside screens
  document.querySelectorAll('[data-back]').forEach(b=> b.addEventListener('click', ()=> navTo('feed')));

  // Composer
  $('composer-post').addEventListener('click', async ()=>{
    const session = S.get('y_session');
    if(!session) return alert('Faz login para publicar.');
    const text = $('composer-text').value.trim();
    const file = $('composer-file').files?.[0];
    let media = null;
    if(file){
      media = await new Promise(res=>{
        const r = new FileReader(); r.onload = ()=> res(r.result); r.readAsDataURL(file);
      });
    }
    if(!text && !media) return alert('Texto ou imagem/video obrigatórios.');
    const posts = S.get('y_posts')||[];
    posts.unshift({id:'p_'+Date.now(), userId:session.id, text, media, createdAt:new Date().toLocaleString()});
    S.set('y_posts',posts);
    $('composer-text').value=''; $('composer-file').value='';
    renderFeed();
    navTo('feed');
  });

  // Render feed
  function renderFeed(){
    const feed = $('feed-list'); feed.innerHTML='';
    const posts = S.get('y_posts')||[];
    const users = S.get('y_users')||[];
    posts.forEach(p=>{
      const u = users.find(x=>x.id===p.userId) || {username:'Usuário',avatar:null,verified:false};
      const el = document.createElement('div'); el.className='post card';
      el.innerHTML = `
        <div class="meta"><div class="avatar">${u.avatar?'<img src="'+u.avatar+'"/>':(u.username[0]||'U')}</div>
        <div style="flex:1"><div class="who">${u.username} ${u.verified?'<span class="badge-small">✔</span>':''}</div><div class="muted">${p.createdAt}</div></div></div>
        <div class="content">${escapeHtml(p.text||'')}</div>
        ${p.media? (p.media.startsWith('data:video')? `<video controls src="${p.media}"></video>` : `<img src="${p.media}"/>`) : ''}
        <div class="post-actions">
          <button class="btn small like-btn">❤ <span class="like-count">${countLikes(p.id)}</span></button>
          <button class="btn small comment-toggle">💬</button>
          <button class="btn small share-btn">🔗</button>
        </div>
        <div class="comments hidden"></div>
      `;
      // events
      el.querySelector('.like-btn').addEventListener('click', ()=> { toggleLike(p.id); renderFeed(); });
      el.querySelector('.comment-toggle').addEventListener('click', ()=> { el.querySelector('.comments').classList.toggle('hidden'); });
      el.querySelector('.share-btn').addEventListener('click', ()=> { navigator.clipboard?.writeText(location.href+'#/feed?share='+p.id).then(()=> alert('Link copiado')); });
      feed.appendChild(el);
    });
    // update copyright year
    document.getElementById('copyright-year').innerText = new Date().getFullYear();
  }

  // Likes
  function countLikes(postId){ return (S.get('y_likes')||[]).filter(l=>l.postId===postId).length; }
  function toggleLike(postId){
    const session=S.get('y_session'); if(!session) return alert('Faz login.');
    const likes=S.get('y_likes')||[]; const exists=likes.find(l=>l.postId===postId && l.userId===session.id);
    if(exists) S.set('y_likes', likes.filter(l=> l.id!==exists.id)); else { likes.push({id:'l_'+Date.now(),postId,userId:session.id,at:new Date().toLocaleString()}); S.set('y_likes',likes); }
  }

  // Chat
  function renderChatList(){
    const people = $('chat-people'); people.innerHTML='';
    const users = S.get('y_users')||[];
    users.forEach(u=>{
      const d = document.createElement('div'); d.className='chat-person card'; d.innerHTML = `<div class="avatar">${u.avatar?'<img src="'+u.avatar+'"/>' : (u.username[0]||'U')}</div><div style="flex:1"><strong>${u.username}</strong><div class="muted">Mensagem recente...</div></div>`;
      d.addEventListener('click', ()=> openChatWith(u.id));
      people.appendChild(d);
    });
    $('chat-window').classList.add('hidden');
  }

  function openChatWith(userId){
    navTo('chat');
    const u = (S.get('y_users')||[]).find(x=>x.id===userId);
    if(!u) return alert('Usuário não encontrado');
    const win = $('chat-window'); win.classList.remove('hidden');
    $('chat-window-head').innerHTML = `<div style="display:flex;gap:10px;align-items:center"><div class="avatar">${u.avatar?'<img src="'+u.avatar+'"/>' : (u.username[0])}</div><div><strong>${u.username}</strong></div></div>`;
    const msgsRoot = $('chat-window-messages'); msgsRoot.innerHTML='';
    const chats = S.get('y_chats')||[];
    const conv = chats.filter(c=> (c.from===userId || c.to===userId) );
    conv.forEach(m=> { const me = document.createElement('div'); me.className='message'; me.textContent = (m.from===S.get('y_session').id ? 'Tu: ' : '') + m.text; msgsRoot.appendChild(me); });
    // send
    $('chat-send').onclick = ()=>{
      const txt = $('chat-input').value.trim(); if(!txt) return;
      const session=S.get('y_session'); const chatsArr = S.get('y_chats')||[]; chatsArr.push({id:'m_'+Date.now(),from:session.id,to:userId,text:txt,at:new Date().toLocaleString()}); S.set('y_chats',chatsArr);
      $('chat-input').value=''; openChatWith(userId);
    };
  }

  // Search
  function focusSearch(){ $('search-input').focus(); }
  $('search-input').addEventListener('input', e=>{
    const q = e.target.value.trim().toLowerCase(); const res = $('search-results'); res.innerHTML='';
    if(!q) return;
    const users = (S.get('y_users')||[]).filter(u=> u.username && u.username.toLowerCase().includes(q));
    const posts = (S.get('y_posts')||[]).filter(p=> p.text && p.text.toLowerCase().includes(q));
    users.forEach(u=> { const el=document.createElement('div'); el.className='search-hit'; el.innerHTML=`<strong>${u.username}</strong> <button class="btn small" onclick="(function(){ window.location.hash='#/profile'; setTimeout(()=> window.appApi.visitProfile && window.appApi.visitProfile('${u.id}'),250) })()">Perfil</button>`; res.appendChild(el); });
    posts.forEach(p=> { const el=document.createElement('div'); el.className='search-hit'; el.innerHTML=`<div>${escapeHtml(p.text)}</div>`; res.appendChild(el); });
  });

  // Profile
  function renderProfile(userId){
    // default to session user
    const session = S.get('y_session'); const uid = userId || (session && session.id) || null;
    const body = $('profile-body'); body.innerHTML='';
    if(!uid){ body.innerHTML='<div>Utilizador não encontrado</div>'; return; }
    const u = (S.get('y_users')||[]).find(x=>x.id===uid);
    body.innerHTML = `<div class="card"><div style="display:flex;gap:12px;align-items:center"><div class="avatar">${u.avatar?'<img src="'+u.avatar+'"/>' : (u.username[0]||'U')}</div><div><h3>${u.username} ${u.verified?'<span class="badge-small">✔ Founder</span>':''}</h3><div class="muted">Seguidores: ${u.followers||0}</div></div></div></div>`;
  }
  // Expose helper for external search hits
  window.appApi = { visitProfile: (id)=> { renderProfile(id); navTo('profile'); } };

  // Monetization (simulado)
  function renderMonet(){
    const body = $('monet-body'); body.innerHTML='';
    const settings = S.get('y_settings')||{monet:false};
    const session = S.get('y_session'); const me = (S.get('y_users')||[]).find(u=>u.id===session.id);
    body.innerHTML = `
      <div class="card"><h4>Monetização</h4>
      <p>Para ativar monetização precisas de <strong>5000 seguidores</strong>. Tens: <strong>${me?.followers||0}</strong></p>
      <div style="display:flex;gap:8px;margin-top:8px"><button id="btn-apply-monet" class="btn primary">Pedir Monetização</button><button id="btn-ads" class="btn">Criar Anúncio</button></div>
      <div id="ads-list" style="margin-top:12px"></div>
      </div>
    `;
    $('btn-apply-monet').addEventListener('click', ()=> {
      if((me?.followers||0) < 5000) return alert('Tens menos de 5000 seguidores.');
      alert('Pedido enviado. (Simulado)');
    });
    $('btn-ads').addEventListener('click', ()=> createAdModal());
    // list ads
    const ads = S.get('y_ads')||[]; const aRoot = $('ads-list'); aRoot.innerHTML = ads.map(a=> `<div class="card"><strong>${a.title}</strong><div>${a.currency} ${a.amount}</div><div class="muted">${a.createdAt}</div></div>`).join('');
  }

  function createAdModal(){
    const html = `<div class="card"><h4>Criar Anúncio</h4><input id="ad-title" placeholder="Título"/><input id="ad-amount" placeholder="Quantia"/><select id="ad-currency"><option value="USD">USD</option><option value="KZ">KZ</option><option value="EUR">EUR</option></select><div style="margin-top:8px"><button id="ad-create" class="btn primary">Criar</button></div></div>`;
    showModal(html);
    document.getElementById('ad-create').addEventListener('click', ()=> {
      const title = document.getElementById('ad-title').value.trim(); const amt=document.getElementById('ad-amount').value; const cur=document.getElementById('ad-currency').value;
      if(!title||!amt) return alert('Preenche todos os campos');
      const ads = S.get('y_ads')||[]; ads.unshift({id:'ad_'+Date.now(),title,amount:amt,currency:cur,createdAt:new Date().toLocaleString()}); S.set('y_ads',ads);
      closeModal(); renderMonet();
    });
  }

  // Settings
  function renderSettings(){
    const body = $('settings-body'); body.innerHTML='';
    const html = `<div class="card"><h4>Configurações</h4><div><label><input id="opt-sound" type="checkbox"> Ativar sons</label></div></div>`;
    body.innerHTML = html;
  }

  // modal helpers
  function showModal(html){
    const modalWrap = document.createElement('div'); modalWrap.className='modal-wrap'; modalWrap.innerHTML= `<div class="modal-card">${html}<div style="margin-top:8px"><button id="modal-close" class="btn">Fechar</button></div></div>`;
    document.body.appendChild(modalWrap);
    document.getElementById('modal-close').addEventListener('click', ()=> { closeModal(); });
  }
  function closeModal(){ document.querySelectorAll('.modal-wrap').forEach(n=>n.remove()); }

  // util
  function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  // start
  handleHash();
  // small global binds
  $('composer-text').addEventListener('focus', ()=> navTo('feed'));
  // initial render
  renderFeed();

  // expose for debugging
  window.YLO = { S, navTo, renderFeed };
})();
