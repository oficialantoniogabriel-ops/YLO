/* src/app.js
   YLO — app.js corrigido + compatível com novo layout (Facebook-like)
   100% local: localStorage based demo (auth, posts, likes, comments, reels, search, chat, monetization)
*/
(() => {
  'use strict';

  /* ---------- Storage helpers ---------- */
  const LS = {
    get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
    set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  };
  function ensureInit(){
    if(!LS.get('y_users')) LS.set('y_users', []);
    if(!LS.get('y_session')) LS.set('y_session', null);
    if(!LS.get('y_posts')) LS.set('y_posts', []);
    if(!LS.get('y_likes')) LS.set('y_likes', []);
    if(!LS.get('y_comments')) LS.set('y_comments', []);
    if(!LS.get('y_follows')) LS.set('y_follows', []);
    if(!LS.get('y_msgs')) LS.set('y_msgs', []);
    if(!LS.get('y_reels')) LS.set('y_reels', [
      {id:'r1', type:'img', src:'https://picsum.photos/seed/1/800/600', title:'Sunset'},
      {id:'r2', type:'img', src:'https://picsum.photos/seed/2/800/600', title:'City'},
      {id:'r3', type:'img', src:'https://picsum.photos/seed/3/800/600', title:'Ocean'}
    ]);
    if(!LS.get('y_settings')) LS.set('y_settings', {monetize:false, verifiedRequests:[]});
  }
  ensureInit();

  /* ---------- Utils ---------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const now = () => new Date().toLocaleString();
  function findUser(id){ return (LS.get('y_users')||[]).find(u=>u.id===id) || null; }
  function currentUser(){ return LS.get('y_session'); }
  function escapeHtml(s){ return (s||'').toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  /* ---------- DOM refs (must match index.html) ---------- */
  const dom = {
    navLogin: document.getElementById('nav-login'),
    navLogout: document.getElementById('nav-logout'),
    btnOpenChat: document.getElementById('btn-open-chat'),
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnOpenSupport: document.getElementById('btn-open-support'),
    btnOpenSupport2: document.getElementById('btn-open-support-2'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.getElementById('modal-close'),
    feed: document.getElementById('feed'),
    composer: document.getElementById('composer'),
    btnPost: document.getElementById('btn-post'),
    postContent: document.getElementById('post-content'),
    postImage: document.getElementById('post-image'),
    sessionName: document.getElementById('session-name'),
    sessionAvatar: document.getElementById('session-avatar'),
    sessionBio: document.getElementById('session-bio'),
    btnEditProfile: document.getElementById('btn-edit-profile'),
    reelsEl: document.getElementById('reels'),
    reelPrev: document.getElementById('reel-prev'),
    reelNext: document.getElementById('reel-next'),
    searchGlobal: document.getElementById('global-search'),
    asideSearch: document.getElementById('aside-search'),
    searchResults: document.getElementById('search-results'),
    chatPanel: document.getElementById('chat-panel'),
    convList: document.getElementById('conv-list'),
    convWindow: document.getElementById('conv-window'),
    convHead: document.getElementById('conv-head'),
    convMessages: document.getElementById('conv-messages'),
    convInput: document.getElementById('conv-input'),
    convSend: document.getElementById('conv-send'),
    navHome: document.getElementById('nav-home'),
    navReels: document.getElementById('nav-reels'),
    navMonet: document.getElementById('nav-monet'),
    globalVerified: document.getElementById('global-verified')
  };

  /* Defensive: ensure required DOM exists */
  function missing(selector,name){
    console.warn('Missing DOM node:', name, selector);
  }
  if(!dom.feed) missing('#feed','feed');
  if(!dom.modal) missing('#modal','modal');

  /* ---------- UI helpers ---------- */
  function showModal(html){
    if(!dom.modal || !dom.modalBody) return alert('Modal não encontrado');
    dom.modalBody.innerHTML = html;
    dom.modal.classList.remove('hidden');
  }
  function closeModal(){ dom.modal?.classList.add('hidden'); if(dom.modalBody) dom.modalBody.innerHTML=''; }
  dom.modalClose?.addEventListener('click', closeModal);

  /* ---------- Auth ---------- */
  function showAuth(){
    const html = `
      <h3>Entrar / Registar</h3>
      <div style="display:grid;gap:8px">
        <input id="auth-identifier" placeholder="Email ou número (+244...)" />
        <input id="auth-password" type="password" placeholder="Senha (mín 4)" />
        <input id="auth-username" placeholder="Nome (só p/ registo)" />
        <div style="display:flex;gap:8px">
          <button id="auth-register" class="btn primary">Registar</button>
          <button id="auth-login" class="btn">Entrar</button>
        </div>
        <div class="muted">Login com email ou número. Conta armazenada localmente (demo).</div>
      </div>`;
    showModal(html);

    document.getElementById('auth-register').addEventListener('click', ()=>{
      const idv = document.getElementById('auth-identifier').value.trim();
      const pass = document.getElementById('auth-password').value;
      const name = document.getElementById('auth-username').value.trim() || idv.split('@')[0] || 'user';
      if(!idv || pass.length < 4) return alert('Identificador e senha (min 4).');
      const users = LS.get('y_users')||[];
      if(users.find(u => u.email === idv || u.phone === idv)) return alert('Usuário já existe.');
      const newU = { id: uid(), email: idv.includes('@') ? idv : null, phone: idv.includes('@') ? null : idv, username: name, avatar: null, bio:'', verified:false };
      users.push(newU); LS.set('y_users', users);
      LS.set('y_session', { id: newU.id });
      closeModal(); renderAll();
      alert('Registrado e logado (demo).');
    });

    document.getElementById('auth-login').addEventListener('click', ()=>{
      const idv = document.getElementById('auth-identifier').value.trim();
      const users = LS.get('y_users')||[];
      const u = users.find(u => u.email === idv || u.phone === idv);
      if(!u) return alert('Usuário não encontrado. Registe-se.');
      LS.set('y_session',{ id: u.id });
      closeModal(); renderAll();
      alert('Login OK (demo).');
    });
  }

  /* ---------- Profile edit / settings / verify / support ---------- */
  function showProfileEdit(){
    const s = currentUser(); if(!s) return showAuth();
    const u = findUser(s.id);
    const html = `
      <h3>Editar Perfil</h3>
      <input id="prof-username" value="${escapeHtml(u.username||'')}" />
      <input id="prof-bio" value="${escapeHtml(u.bio||'')}" />
      <input id="prof-avatar" type="file" accept="image/*" />
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="prof-save" class="btn primary">Salvar</button>
        <button id="prof-verify" class="btn">Pedir selo azul</button>
      </div>
      <div style="margin-top:8px"><strong>Verified:</strong> ${u.verified? 'SIM':'NÃO'}</div>
    `;
    showModal(html);
    document.getElementById('prof-save').addEventListener('click', async ()=>{
      const users = LS.get('y_users')||[];
      const me = users.find(x=>x.id===s.id);
      me.username = document.getElementById('prof-username').value.trim() || me.username;
      me.bio = document.getElementById('prof-bio').value || '';
      if(document.getElementById('prof-avatar').files?.[0]){
        me.avatar = await fileToDataURL(document.getElementById('prof-avatar').files[0]);
      }
      LS.set('y_users', users);
      alert('Perfil salvo.');
      closeModal(); renderAll();
    });
    document.getElementById('prof-verify').addEventListener('click', ()=>{
      const settings = LS.get('y_settings')||{verifiedRequests:[]};
      settings.verifiedRequests = settings.verifiedRequests || [];
      settings.verifiedRequests.push({ id: uid(), userId: s.id, date: now(), status: 'pending' });
      LS.set('y_settings', settings);
      alert('Pedido de verificação enviado (simulado).');
      closeModal();
    });
  }

  function showSettings(){
    const s = currentUser(); if(!s) return showAuth();
    const settings = LS.get('y_settings')||{};
    const html = `
      <h3>Configurações</h3>
      <label><input id="monet-toggle" type="checkbox" ${settings.monetize ? 'checked' : ''}/> Ativar Monetização (simulado)</label>
      <div style="margin-top:8px">
        <button id="save-settings" class="btn primary">Salvar</button>
      </div>
    `;
    showModal(html);
    document.getElementById('save-settings').addEventListener('click', ()=>{
      const st = LS.get('y_settings')||{};
      st.monetize = !!document.getElementById('monet-toggle').checked;
      LS.set('y_settings', st);
      alert('Configurações salvas.');
      closeModal(); renderAll();
    });
  }

  function showSupport(){
    const html = `
      <h3>Suporte & Ajuda</h3>
      <textarea id="support-text" placeholder="Descreva o problema..." style="width:100%;height:120px"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button id="support-send" class="btn primary">Enviar</button></div>
    `;
    showModal(html);
    document.getElementById('support-send').addEventListener('click', ()=>{
      const txt = document.getElementById('support-text').value.trim();
      if(!txt) return alert('Descreva o problema.');
      const tickets = LS.get('y_support')||[];
      tickets.push({ id: uid(), text: txt, at: now() });
      LS.set('y_support', tickets);
      alert('Ticket enviado (local).' );
      closeModal();
    });
  }

  /* ---------- helpers: file -> dataURL ---------- */
  function fileToDataURL(file){
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ()=> res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  /* ---------- Posting ---------- */
  dom.btnPost?.addEventListener('click', async ()=>{
    const s = currentUser(); if(!s) { showAuth(); return; }
    const text = (dom.postContent?.value || '').trim();
    const file = dom.postImage?.files?.[0];
    if(!text && !file) return alert('Adiciona texto ou imagem.');
    let media = null;
    if(file) media = await fileToDataURL(file);
    const posts = LS.get('y_posts')||[];
    posts.unshift({ id: uid(), userId: s.id, text, media, createdAt: now() });
    LS.set('y_posts', posts);
    if(dom.postContent) dom.postContent.value = '';
    if(dom.postImage) dom.postImage.value = '';
    renderAll();
  });

  /* ---------- Interactions ---------- */
  function toggleLike(postId){
    const s = currentUser(); if(!s) { showAuth(); return; }
    const likes = LS.get('y_likes')||[];
    const idx = likes.findIndex(l => l.postId===postId && l.userId===s.id);
    if(idx >= 0){ likes.splice(idx,1); } else { likes.push({ id: uid(), postId, userId: s.id, at: now() }); }
    LS.set('y_likes', likes); renderAll();
  }
  window.toggleLike = toggleLike; // expose for inline handlers if present

  function sharePost(postId){
    const posts = LS.get('y_posts')||[]; const p = posts.find(x=>x.id===postId);
    if(!p) return alert('Post não encontrado');
    const shareUrl = location.origin + location.pathname + '?share=' + postId;
    if(navigator.clipboard) navigator.clipboard.writeText(shareUrl).then(()=> alert('Link copiado: ' + shareUrl));
    else alert('Link: ' + shareUrl);
  }

  function addComment(postId, text){
    const s = currentUser(); if(!s) { showAuth(); return; }
    if(!text?.trim()) return;
    const comments = LS.get('y_comments')||[];
    comments.push({ id: uid(), postId, userId: s.id, text: text.trim(), at: now() });
    LS.set('y_comments', comments); renderAll();
  }
  window.addComment = addComment;

  /* ---------- Render feed ---------- */
  function renderFeed(){
    const posts = LS.get('y_posts')||[];
    const likes = LS.get('y_likes')||[];
    const comments = LS.get('y_comments')||[];
    if(!dom.feed) return;
    dom.feed.innerHTML = '';
    posts.forEach(p=>{
      const u = findUser(p.userId) || { username:'Usuário', avatar:null, verified:false };
      const likeCount = likes.filter(l=>l.postId===p.id).length;
      const commentCount = comments.filter(c=>c.postId===p.id).length;
      const postEl = document.createElement('div');
      postEl.className = 'post card';
      postEl.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center">
          <div class="avatar" style="width:44px;height:44px">${u.avatar ? `<img src="${u.avatar}" style="width:44px;height:44px;border-radius:50%"/>` : (u.username[0]||'U')}</div>
          <div style="flex:1">
            <div style="font-weight:700">${escapeHtml(u.username)} ${u.verified?'<span class="badge-small">✔</span>':''}</div>
            <div class="muted" style="font-size:12px">${p.createdAt}</div>
          </div>
        </div>
        <div style="margin-top:8px">${escapeHtml(p.text||'')}</div>
        ${p.media ? (p.media.startsWith('data:video')? `<video controls src="${p.media}" style="width:100%;border-radius:8px;margin-top:8px"></video>` : `<img src="${p.media}" style="width:100%;border-radius:8px;margin-top:8px"/>`) : ''}
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn small" data-action="like" data-id="${p.id}">❤ ${likeCount}</button>
          <button class="btn small" data-action="toggle-comments" data-id="${p.id}">💬 ${commentCount}</button>
          <button class="btn small" data-action="share" data-id="${p.id}">🔗 Partilhar</button>
        </div>
        <div id="cbox-${p.id}" class="hidden" style="margin-top:8px">
          <input id="cin-${p.id}" placeholder="Escreve um comentário..." style="width:75%;padding:8px;border-radius:8px;border:1px solid #eef2ff"/>
          <button class="btn small" data-action="send-comment" data-id="${p.id}">Enviar</button>
          <div style="margin-top:8px">
            ${comments.filter(c=>c.postId===p.id).map(c=>{
              const cu = findUser(c.userId)||{username:'U'};
              return `<div style="padding:6px;border-top:1px solid #f1f5f9"><strong>${escapeHtml(cu.username)}:</strong> ${escapeHtml(c.text)} <div class="muted" style="font-size:12px">${escapeHtml(c.at)}</div></div>`;
            }).join('')}
          </div>
        </div>
      `;
      dom.feed.appendChild(postEl);
    });

    // attach listeners for action buttons
    dom.feed.querySelectorAll('button[data-action]').forEach(btn=>{
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      btn.addEventListener('click', ()=>{
        if(action === 'like') toggleLike(id);
        if(action === 'toggle-comments') {
          const box = document.getElementById('cbox-'+id);
          if(box) box.classList.toggle('hidden');
        }
        if(action === 'share') sharePost(id);
        if(action === 'send-comment') {
          const input = document.getElementById('cin-'+id);
          if(input) { addComment(id, input.value); input.value=''; }
        }
      });
    });
  }

  /* ---------- Reels ---------- */
  let reelIndex = 0;
  function renderReels(){
    const reels = LS.get('y_reels')||[];
    if(!dom.reelsEl) return;
    dom.reelsEl.innerHTML = '';
    if(reels.length === 0) { dom.reelsEl.innerHTML = '<div class="muted">Sem reels</div>'; return; }
    const r = reels[reelIndex % reels.length];
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    if(r.type === 'img') wrap.innerHTML = `<img src="${r.src}" alt="${escapeHtml(r.title)}" style="width:100%;border-radius:8px"/>`;
    else wrap.innerHTML = `<video src="${r.src}" controls style="width:100%;border-radius:8px"></video>`;
    dom.reelsEl.appendChild(wrap);
  }
  dom.reelNext?.addEventListener('click', ()=>{ reelIndex++; renderReels(); });
  dom.reelPrev?.addEventListener('click', ()=>{ reelIndex = Math.max(0, reelIndex-1); renderReels(); });

  /* ---------- Search ---------- */
  dom.searchGlobal?.addEventListener('keydown', (e)=> { if(e.key === 'Enter') doSearch(dom.searchGlobal.value.trim()); });
  dom.asideSearch?.addEventListener('input', ()=> doSearch(dom.asideSearch.value.trim()));
  function doSearch(q){
    if(!dom.searchResults) return;
    if(!q){ dom.searchResults.innerHTML = ''; return; }
    const users = (LS.get('y_users')||[]).filter(u => u.username?.toLowerCase().includes(q.toLowerCase()));
    const posts = (LS.get('y_posts')||[]).filter(p => p.text?.toLowerCase().includes(q.toLowerCase()));
    dom.searchResults.innerHTML = '';
    users.forEach(u=>{
      const d = document.createElement('div'); d.className = 'search-result';
      d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div>${escapeHtml(u.username)}</div><div><button class="btn small" data-user="${u.id}">Chat</button></div></div>`;
      dom.searchResults.appendChild(d);
      d.querySelector('button')?.addEventListener('click', ()=> openChatWith(u.id));
    });
    posts.forEach(p=>{
      const d = document.createElement('div'); d.className = 'search-result';
      d.innerHTML = `<div>${escapeHtml(p.text || '')}</div>`;
      dom.searchResults.appendChild(d);
    });
  }

  /* ---------- Chat (local) ---------- */
  function openChat(){
    if(!dom.chatPanel) return;
    dom.chatPanel.classList.remove('hidden');
    renderConversations();
  }
  function closeChat(){ dom.chatPanel.classList.add('hidden'); }
  function renderConversations(){
    const msgs = LS.get('y_msgs')||[];
    dom.convList.innerHTML = '';
    // group by user pairs (simple)
    const sessions = {}; // key: otherUserId
    msgs.forEach(m=>{
      const other = m.from === currentUser()?.id ? m.to : m.from;
      if(!sessions[other]) sessions[other] = [];
      sessions[other].push(m);
    });
    Object.keys(sessions).forEach(otherId=>{
      const u = findUser(otherId) || { username: 'Usuário' };
      const btn = document.createElement('div');
      btn.className = 'conv-item';
      btn.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div>${escapeHtml(u.username)}</div><div><button class="btn small">Abrir</button></div></div>`;
      dom.convList.appendChild(btn);
      btn.querySelector('button')?.addEventListener('click', ()=> openConversation(otherId));
    });
    // if no convs, show users to start chat
    if(Object.keys(sessions).length === 0) {
      const users = LS.get('y_users')||[];
      users.forEach(u=>{
        const div = document.createElement('div');
        div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div>${escapeHtml(u.username)}</div><div><button class="btn small">Chat</button></div></div>`;
        dom.convList.appendChild(div);
        div.querySelector('button')?.addEventListener('click', ()=> openConversation(u.id));
      });
    }
  }
  function openConversation(otherId){
    const u = findUser(otherId) || { username: 'Usuário' };
    dom.convWindow.classList.remove('hidden');
    dom.convHead.innerText = u.username;
    renderMessagesFor(otherId);
    dom.convSend.onclick = ()=> {
      const s = currentUser(); if(!s) return showAuth();
      const text = dom.convInput.value.trim(); if(!text) return;
      const msgs = LS.get('y_msgs')||[];
      msgs.push({ id: uid(), from: s.id, to: otherId, text, at: now() });
      LS.set('y_msgs', msgs); dom.convInput.value = ''; renderMessagesFor(otherId);
    };
  }
  function renderMessagesFor(otherId){
    const s = currentUser(); if(!s) return showAuth();
    const msgs = (LS.get('y_msgs')||[]).filter(m=> (m.from===s.id && m.to===otherId) || (m.from===otherId && m.to===s.id));
    dom.convMessages.innerHTML = msgs.map(m=> {
      const who = m.from === s.id ? 'Tu' : (findUser(m.from)?.username || 'U');
      return `<div style="padding:6px"><strong>${escapeHtml(who)}</strong>: ${escapeHtml(m.text)} <div class="muted" style="font-size:12px">${escapeHtml(m.at)}</div></div>`;
    }).join('');
    dom.convMessages.scrollTop = dom.convMessages.scrollHeight;
  }
  function openChatWith(userId){
    openChat();
    setTimeout(()=> openConversation(userId), 200);
  }
  window.openChatWith = openChatWith; // expose to search buttons
  dom.btnOpenChat?.addEventListener('click', ()=> {
    const s = currentUser(); if(!s) return showAuth();
    openChat();
  });
  document.getElementById('chat-close')?.addEventListener('click', ()=> { closeChat(); });

  /* ---------- small utilities ---------- */
  function fileToDataURL(file){
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = ()=> res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  /* ---------- render session and side UI ---------- */
  function updateUIOnAuth(){
    const s = currentUser();
    if(s){
      dom.navLogin?.classList.add('hidden');
      dom.navLogout?.classList.remove('hidden');
      dom.composer?.classList.remove('hidden');
      const me = findUser(s.id);
      dom.sessionAvatar && (dom.sessionAvatar.innerHTML = me?.avatar ? `<img src="${me.avatar}" style="width:84px;height:84px;border-radius:50%"/>` : (me?.username?.[0]||'U'));
      dom.sessionName && (dom.sessionName.innerText = me?.username || me?.email || 'Usuário');
      dom.sessionBio && (dom.sessionBio.innerText = me?.bio || 'Atualize seu perfil.');
      dom.btnEditProfile?.classList.remove('hidden');
    } else {
      dom.navLogin?.classList.remove('hidden');
      dom.navLogout?.classList.add('hidden');
      dom.composer?.classList.add('hidden');
      dom.sessionAvatar && (dom.sessionAvatar.innerText = 'U');
      dom.sessionName && (dom.sessionName.innerText = 'Visitante');
      dom.sessionBio && (dom.sessionBio.innerText = 'Faça login para interagir');
      dom.btnEditProfile?.classList.add('hidden');
    }
  }

  /* ---------- top-level event binding ---------- */
  dom.navLogin?.addEventListener('click', showAuth);
  dom.navLogout?.addEventListener('click', ()=>{
    LS.set('y_session', null); renderAll();
  });
  dom.btnOpenSettings?.addEventListener('click', showSettings);
  dom.btnOpenSupport?.addEventListener('click', showSupport);
  dom.btnOpenSupport2?.addEventListener('click', showSupport);
  dom.btnEditProfile?.addEventListener('click', showProfileEdit);
  dom.navHome?.addEventListener('click', ()=> { window.scrollTo({top:0,behavior:'smooth'}); });
  dom.navReels?.addEventListener('click', ()=> { renderReels(); window.scrollTo({top:0,behavior:'smooth'}); });

  /* ---------- initial demo user (if none) ---------- */
  (function seedDemo(){
    const users = LS.get('y_users')||[];
    if(users.length === 0){
      users.push({ id: 'u_demo', email:'demo@ylo.local', phone:null, username:'demo', avatar:null, bio:'Conta demo', verified:true });
      LS.set('y_users', users);
    }
    const posts = LS.get('y_posts')||[];
    if(posts.length === 0){
      posts.push({ id: uid(), userId: 'u_demo', text: 'Olá mundo YLO', media: null, createdAt: now() });
      LS.set('y_posts', posts);
    }
  })();

  /* ---------- main render loop ---------- */
  function renderAll(){
    ensureInit();
    updateUIOnAuth();
    renderFeed();
    renderReels();
    // update verified badge (simple)
    const settings = LS.get('y_settings')||{};
    if(dom.globalVerified) dom.globalVerified.innerText = settings.verifiedRequests?.length ? '🔵' : '';
  }

  /* ---------- expose small helpers for console debugging ---------- */
  window.YLO = {
    LS,
    uid, now, renderAll, currentUser, findUser
  };

  /* ---------- start ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    renderAll();
    // safety: if feed empty, still render
    setTimeout(()=> renderAll(), 200);
  });

  /* ---------- error handling ---------- */
  window.addEventListener('error', (e) => {
    console.error('YLO runtime error:', e.message, e.filename, e.lineno);
  });

})();
