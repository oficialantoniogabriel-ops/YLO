/* src/app.js - YLO (Local SPA) */
(() => {
  // storage helpers
  const Storage = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null } },
    set: (k,v) => localStorage.setItem(k, JSON.stringify(v))
  };

  // defaults
  function ensure() {
    if (!Storage.get('y_users')) {
      Storage.set('y_users', [
        { id: 'u_founder', username: 'António Ndala', avatar: null, verified: true, followers: 6000 }
      ]);
    }
    if (!Storage.get('y_session')) Storage.set('y_session', { id: 'u_founder' }); // demo logged in as founder
    if (!Storage.get('y_posts')) Storage.set('y_posts', [
      { id: 'p1', userId: 'u_founder', text: 'Bem-vindo ao YLO — versão demo local!', media: null, createdAt: new Date().toLocaleString() }
    ]);
    if (!Storage.get('y_likes')) Storage.set('y_likes', []);
    if (!Storage.get('y_comments')) Storage.set('y_comments', []);
    if (!Storage.get('y_chats')) Storage.set('y_chats', []);
    if (!Storage.get('y_ads')) Storage.set('y_ads', []);
    if (!Storage.get('y_settings')) Storage.set('y_settings', { monetizeEnabled: false });
  }
  ensure();

  // UI refs
  const q = s => document.querySelector(s);
  const qs = s => Array.from(document.querySelectorAll(s));

  // screens
  const screens = qs('.screen');
  const tabs = qs('.tab');

  function showScreen(name) {
    screens.forEach(s => s.classList.toggle('active', s.dataset.name === name));
    tabs.forEach(t => t.classList.toggle('active', t.dataset.target === name));
    // update content when opening
    if (name === 'feed') renderFeed();
    if (name === 'chat') renderChatList();
    if (name === 'reels') renderReels();
    if (name === 'search') focusSearchInput();
    if (name === 'profile') renderProfile();
    if (name === 'monet') renderMonet();
  }

  // nav binds
  q('#go-home').addEventListener('click', () => { showScreen('feed') });
  q('#btn-search').addEventListener('click', () => { showScreen('search') });
  q('#btn-chat').addEventListener('click', () => { showScreen('chat') });
  q('#tab-feed').addEventListener('click', () => { showScreen('feed') });
  q('#tab-search').addEventListener('click', () => { showScreen('search') });
  q('#tab-reels').addEventListener('click', () => { showScreen('reels') });
  q('#tab-chat-btn').addEventListener('click', () => { showScreen('chat') });
  q('#tab-monet').addEventListener('click', () => { showScreen('monet') });
  q('#tab-profile').addEventListener('click', () => { showScreen('profile') });

  // util
  function ID() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function now() { return new Date().toLocaleString(); }
  function currentUser() { return Storage.get('y_session'); }
  function findUser(id) { return (Storage.get('y_users')||[]).find(u => u.id === id) || null; }

  // FEED
  const feedList = q('#feed-list');
  function renderFeed() {
    const posts = Storage.get('y_posts') || [];
    feedList.innerHTML = '';
    posts.forEach(p => {
      const u = findUser(p.userId) || { username: 'Usuário', avatar: null, verified:false };
      const div = document.createElement('div'); div.className = 'post card';
      div.innerHTML = `
        <div class="meta">
          <div class="avatar">${u.avatar ? `<img src="${u.avatar}" style="width:48px;height:48px;border-radius:50%"/>` : (u.username[0]||'U')}</div>
          <div style="flex:1">
            <div><strong>${u.username} ${u.verified?'<span class="badge-small">✔</span>':''}</strong></div>
            <div class="muted">${p.createdAt}</div>
          </div>
        </div>
        <div class="content">${escapeHtml(p.text || '')}</div>
        ${p.media ? (p.media.startsWith('data:video')? `<video controls src="${p.media}" style="width:100%;border-radius:8px;margin-top:8px"></video>` : `<img src="${p.media}" style="width:100%;border-radius:8px;margin-top:8px"/>`) : ''}
        <div class="post-actions">
          <button class="btn small like-btn">❤ <span class="count">${countLikes(p.id)}</span></button>
          <button class="btn small comment-btn">💬 ${countComments(p.id)}</button>
          <button class="btn small share-btn">🔗 Partilhar</button>
        </div>
        <div class="comments hidden"></div>
      `;
      // events
      div.querySelector('.like-btn').addEventListener('click', () => { toggleLike(p.id); renderFeed(); });
      div.querySelector('.comment-btn').addEventListener('click', () => { const cbox = div.querySelector('.comments'); cbox.classList.toggle('hidden'); if(!cbox.dataset.loaded) { renderComments(p.id, cbox); cbox.dataset.loaded = '1'; } });
      div.querySelector('.share-btn').addEventListener('click', () => { navigator.clipboard?.writeText(location.href + '#/feed?share=' + p.id).then(()=> alert('Link copiado')); });
      feedList.appendChild(div);
    });
    q('#year').textContent = new Date().getFullYear();
  }

  // Composer
  q('#composer-post').addEventListener('click', async () => {
    const session = currentUser(); if(!session) return alert('Faz login para publicar.');
    const text = q('#composer-text').value.trim();
    const file = q('#composer-file').files?.[0];
    if(!text && !file) return alert('Adiciona texto ou imagem/video.');
    let media = null;
    if(file) media = await toDataURL(file);
    const posts = Storage.get('y_posts')||[];
    posts.unshift({ id: ID(), userId: session.id, text, media, createdAt: now() });
    Storage.set('y_posts', posts);
    q('#composer-text').value = ''; q('#composer-file').value = '';
    renderFeed();
  });

  // likes/comments
  function countLikes(postId) { return (Storage.get('y_likes')||[]).filter(l=>l.postId===postId).length; }
  function countComments(postId) { return (Storage.get('y_comments')||[]).filter(c=>c.postId===postId).length; }
  function toggleLike(postId) {
    const session = currentUser(); if(!session) return alert('Faz login.');
    let likes = Storage.get('y_likes')||[];
    const ex = likes.find(l=>l.postId===postId && l.userId===session.id);
    if(ex) likes = likes.filter(l=>l.id !== ex.id); else likes.push({ id: ID(), postId, userId: session.id, at: now() });
    Storage.set('y_likes', likes);
  }
  function renderComments(postId, container) {
    const comments = (Storage.get('y_comments')||[]).filter(c=>c.postId===postId);
    container.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:8px"><input id="cinput-${postId}" placeholder="Escreve um comentário..." style="flex:1"/><button class="btn" id="csend-${postId}">Enviar</button></div>` +
      comments.map(c=>{
        const u = findUser(c.userId); return `<div style="padding:6px;border-top:1px solid rgba(255,255,255,0.02)"><strong>${u?u.username:'U'}</strong> ${escapeHtml(c.text)}<div class="muted" style="font-size:12px">${c.at}</div></div>`;
      }).join('');
    const sendBtn = container.querySelector(`#csend-${postId}`);
    sendBtn.addEventListener('click', () => {
      const txt = container.querySelector(`#cinput-${postId}`).value.trim(); if(!txt) return;
      const session = currentUser(); if(!session) return alert('Faz login.');
      const commentsAll = Storage.get('y_comments')||[]; commentsAll.push({ id: ID(), postId, userId: session.id, text: txt, at: now() }); Storage.set('y_comments', commentsAll); renderFeed();
    });
  }

  // helpers
  function toDataURL(file){ return new Promise(res => { const r = new FileReader(); r.onload = ()=> res(r.result); r.readAsDataURL(file); }); }
  function escapeHtml(s){ return (s||'').toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  // CHAT
  function renderChatList(){
    const peopleEl = q('#chat-people'); peopleEl.innerHTML = '';
    const users = Storage.get('y_users')||[];
    users.forEach(u => {
      const d = document.createElement('div'); d.className = 'card'; d.style.padding = '8px'; d.style.cursor='pointer';
      d.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><div class="avatar">${u.username[0]}</div><div><strong>${u.username}</strong><div class="muted">Clica para abrir chat</div></div></div>`;
      d.addEventListener('click', ()=> openChat(u.id));
      peopleEl.appendChild(d);
    });
    q('#chat-window').classList.add('hidden');
  }

  function openChat(userId){
    const u = findUser(userId); if(!u) return alert('Usuário não encontrado');
    q('#chat-window').classList.remove('hidden');
    q('#chat-head').innerHTML = `<div style="display:flex;gap:10px;align-items:center"><div class="avatar">${u.username[0]}</div><div><strong>${u.username}</strong></div></div>`;
    renderConversation(userId);
    q('#chat-send').onclick = () => {
      const txt = q('#chat-input').value.trim(); if(!txt) return;
      const session = currentUser(); if(!session) return alert('Faz login.');
      const chats = Storage.get('y_chats')||[]; chats.push({ id: ID(), from: session.id, to: userId, text: txt, at: now() }); Storage.set('y_chats', chats);
      q('#chat-input').value = ''; renderConversation(userId);
    };
  }

  function renderConversation(userId){
    const root = q('#chat-messages'); root.innerHTML = '';
    const chats = Storage.get('y_chats')||[]; const session = currentUser();
    const conv = chats.filter(m => (m.from===userId && m.to===session.id) || (m.from===session.id && m.to===userId));
    conv.forEach(m => {
      const el = document.createElement('div'); el.className = 'message card'; el.style.padding='8px'; el.style.maxWidth='70%';
      el.style.alignSelf = m.from===session.id ? 'flex-end' : 'flex-start';
      el.textContent = `${m.text} — ${m.at}`;
      root.appendChild(el);
    });
    root.scrollTop = root.scrollHeight;
  }

  // SEARCH
  function focusSearchInput(){ const el = q('#search-input'); if(el) el.focus(); }
  q('#search-input').addEventListener('input', e => {
    const term = e.target.value.trim().toLowerCase(); const out = q('#search-results'); out.innerHTML = '';
    if(!term) return;
    const users = (Storage.get('y_users')||[]).filter(u => u.username?.toLowerCase().includes(term));
    const posts = (Storage.get('y_posts')||[]).filter(p => (p.text||'').toLowerCase().includes(term));
    users.forEach(u => { const div = document.createElement('div'); div.className='card'; div.style.padding='8px'; div.innerHTML = `<strong>${u.username}</strong> <button class="btn small" style="float:right">Visitar</button>`; div.querySelector('button').addEventListener('click', () => { renderProfile(u.id); showScreen('profile'); }); out.appendChild(div); });
    posts.forEach(p => { const div = document.createElement('div'); div.className='card'; div.style.padding='8px'; div.innerHTML = `<div>${escapeHtml(p.text)}</div><div class="muted">${p.createdAt}</div>`; out.appendChild(div); });
  });

  // PROFILE
  function renderProfile(userId) {
    const uid = userId || (currentUser() && currentUser().id);
    const u = findUser(uid);
    const body = q('#profile-body'); body.innerHTML = '';
    if(!u) { body.innerHTML = '<div>Usuário não encontrado</div>'; return; }
    body.innerHTML = `<div class="card" style="padding:12px"><div style="display:flex;gap:12px;align-items:center"><div class="avatar" style="width:80px;height:80px">${u.username[0]}</div><div><h3>${u.username} ${u.verified?'<span class="badge-small">✔ Fundador</span>':''}</h3><div class="muted">Seguidores: ${u.followers||0}</div></div></div><div style="margin-top:12px"><button id="edit-profile" class="btn">Editar</button> <button id="follow-btn" class="btn">Seguir</button></div></div>`;
    const follow = q('#follow-btn'); follow.addEventListener('click', () => { toggleFollow(uid); renderProfile(uid); });
    const edit = q('#edit-profile'); edit.addEventListener('click', () => { showProfileEdit(uid); });
  }

  function toggleFollow(targetId) {
    const session = currentUser(); if(!session) { alert('Faz login'); return; }
    const follows = Storage.get('y_follows')||[];
    const exists = follows.find(f => f.follower === session.id && f.following === targetId);
    if(exists) Storage.set('y_follows', follows.filter(f => !(f.follower===session.id && f.following===targetId)));
    else { follows.push({ id: ID(), follower: session.id, following: targetId, at: now() }); Storage.set('y_follows', follows); }
  }

  function showProfileEdit(userId) {
    const u = findUser(userId);
    const html = `<div class="card"><h3>Editar Perfil</h3><input id="p-name" value="${u.username}" /><input id="p-followers" type="number" value="${u.followers||0}" /><div style="margin-top:8px"><button id="p-save" class="btn primary">Salvar</button></div></div>`;
    modalOpen(html);
    q('#p-save').addEventListener('click', () => {
      const users = Storage.get('y_users'); const idx = users.find(x => x.id===u.id);
      idx.username = q('#p-name').value.trim() || idx.username; idx.followers = Number(q('#p-followers').value) || idx.followers;
      Storage.set('y_users', users); modalClose(); renderProfile(u.id);
    });
  }

  // MONETIZATION & ADS (multi-currency incl. KZ)
  function renderMonet() {
    const body = q('#monet-body'); body.innerHTML = '';
    const session = currentUser(); if(!session) { body.innerHTML = '<div>Faz login para ver monetização.</div>'; return; }
    const me = findUser(session.id);
    body.innerHTML = `<div class="card"><div>Seguidores: <strong>${me.followers||0}</strong></div><div style="margin-top:8px">Requisito: <strong>5000 seguidores</strong></div><div style="margin-top:8px"><button id="apply-monet" class="btn primary">Pedir Monetização</button> <button id="create-ad" class="btn">Criar Anúncio</button></div><div id="ads-list" style="margin-top:12px"></div></div>`;
    q('#apply-monet').addEventListener('click', () => {
      if ((me.followers||0) < 5000) return alert('Ainda não tens 5000 seguidores.');
      alert('Pedido de monetização enviado (simulado).');
    });
    q('#create-ad').addEventListener('click', () => { showCreateAdModal(); });

    renderAdsList();
  }

  function renderAdsList() {
    const ads = Storage.get('y_ads')||[]; const root = q('#ads-list'); if(!root) return;
    root.innerHTML = ads.map(a => `<div class="card" style="padding:8px;margin-bottom:8px"><strong>${a.title}</strong><div>${a.amount} ${a.currency}</div><div class="muted">${a.createdAt}</div></div>`).join('');
  }

  function showCreateAdModal(){
    const html = `<div class="card"><h3>Criar Anúncio</h3><input id="ad-title" placeholder="Título"/><input id="ad-amount" placeholder="Valor"/><select id="ad-currency"><option value="USD">USD</option><option value="EUR">EUR</option><option value="KZ">KZ</option><option value="AOA">AOA</option></select><div style="margin-top:8px"><button id="ad-create" class="btn primary">Criar</button></div></div>`;
    modalOpen(html);
    q('#ad-create').addEventListener('click', () => {
      const title = q('#ad-title').value.trim(); const amt = q('#ad-amount').value.trim(); const cur = q('#ad-currency').value;
      if(!title || !amt) return alert('Preenche todos os campos.');
      const ads = Storage.get('y_ads')||[]; ads.unshift({ id: ID(), title, amount: amt, currency: cur, createdAt: now() }); Storage.set('y_ads', ads);
      modalClose(); renderMonet();
    });
  }

  // REELS (simple)
  function renderReels(){
    const root = q('#reels-list'); root.innerHTML = '';
    const reels = Storage.get('y_reels') || [{id:'r1',src:'https://picsum.photos/400/300?random=1'},{id:'r2',src:'https://picsum.photos/400/300?random=2'}];
    reels.forEach(r => { const el = document.createElement('div'); el.className='card'; el.innerHTML = `<img src="${r.src}" style="width:100%;border-radius:8px"/>`; root.appendChild(el); });
  }

  // modal component
  function modalOpen(html) {
    modalClose(); const m = document.createElement('div'); m.id='ylo-modal'; m.style.position='fixed'; m.style.inset='0'; m.style.background='rgba(0,0,0,0.4)'; m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; m.style.zIndex='9999';
    const card = document.createElement('div'); card.className='card'; card.style.maxWidth='420
