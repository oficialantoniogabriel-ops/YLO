/* YLO — app.js (100% local) 
   Funcionalidades: auth (email/phone), posts, likes, comments, share,
   reels, search, chat, monetização, pedido selo verificado, suporte.
*/

/* ---------- storage helpers ---------- */
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){return null} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};
function ensure(){
  if(!LS.get('y_users')) LS.set('y_users', []);
  if(!LS.get('y_session')) LS.set('y_session', null);
  if(!LS.get('y_posts')) LS.set('y_posts', []);
  if(!LS.get('y_likes')) LS.set('y_likes', []);
  if(!LS.get('y_comments')) LS.set('y_comments', []);
  if(!LS.get('y_follows')) LS.set('y_follows', []);
  if(!LS.get('y_msgs')) LS.set('y_msgs', []);
  if(!LS.get('y_reels')) {
    LS.set('y_reels', [
      {id:'r1', type:'img', src:'https://picsum.photos/seed/1/800/600', title:'Sunset'},
      {id:'r2', type:'img', src:'https://picsum.photos/seed/2/800/600', title:'City'},
      {id:'r3', type:'img', src:'https://picsum.photos/seed/3/800/600', title:'Ocean'}
    ]);
  }
  if(!LS.get('y_settings')) LS.set('y_settings', {monetize:false,verifiedRequests:[]});
}
ensure();

/* ---------- utils ---------- */
const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const now = ()=> new Date().toLocaleString();

function findUser(id){ return (LS.get('y_users')||[]).find(u=>u.id===id) || null; }
function currentUser(){ return LS.get('y_session'); }

/* ---------- DOM refs ---------- */
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

/* ---------- basic UI helpers ---------- */
function showModal(html){
  dom.modalBody.innerHTML = html;
  dom.modal.classList.remove('hidden');
}
function closeModal(){ dom.modal.classList.add('hidden'); dom.modalBody.innerHTML = ''; }
dom.modalClose.addEventListener('click', closeModal);

/* ---------- Auth (email or phone) ---------- */
function showAuth(){
  const html = `
    <h3>Entrar / Registar</h3>
    <div style="display:grid;gap:8px">
      <input id="auth-identifier" placeholder="Email ou número (+244...)" />
      <input id="auth-password" type="password" placeholder="Senha (mín 4)" />
      <input id="auth-username" placeholder="Nome (apenas para registro)" />
      <div style="display:flex;gap:8px">
        <button id="auth-register" class="btn primary">Registar</button>
        <button id="auth-login" class="btn">Entrar</button>
      </div>
      <div class="muted">Login com email ou número. Conta armazenada localmente.</div>
    </div>
  `;
  showModal(html);

  document.getElementById('auth-register').addEventListener('click', async ()=>{
    const idv = document.getElementById('auth-identifier').value.trim();
    const pass = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-username').value.trim() || idv.split('@')[0];
    if(!idv || pass.length<4) return alert('Identificador e senha (min 4).');
    const users = LS.get('y_users') || [];
    if(users.find(u=>u.email===idv || u.phone===idv)) return alert('Já existe usuário.');
    const newU = {id:uid(), email: idv.includes('@')?idv:null, phone: idv.includes('@')?null:idv, username:name, avatar:null, bio:'', verified:false};
    users.push(newU); LS.set('y_users', users);
    LS.set('y_session', {id:newU.id}); renderAll(); closeModal();
    alert('Registrado e logado.');
  });

  document.getElementById('auth-login').addEventListener('click', ()=>{
    const idv = document.getElementById('auth-identifier').value.trim();
    const pass = document.getElementById('auth-password').value;
    // Note: demo doesn't store passwords properly (demo only). We'll accept identifier if exists.
    const users = LS.get('y_users')||[];
    const u = users.find(u=> (u.email===idv || u.phone===idv) );
    if(!u) return alert('Usuário não encontrado. Registe-se.');
    LS.set('y_session',{id:u.id}); renderAll(); closeModal(); alert('Login OK (demo).');
  });
}

/* ---------- Profile edit / settings / monetization / verify ---------- */
function showProfileEdit(){
  const s = currentUser(); if(!s) return showAuth();
  const u = findUser(s.id);
  const html = `
    <h3>Editar Perfil</h3>
    <input id="prof-username" value="${u.username||''}" />
    <input id="prof-bio" value="${u.bio||''}" />
    <input id="prof-avatar" type="file" accept="image/*" />
    <div style="display:flex;gap:8px;margin-top:8px">
      <button id="prof-save" class="btn primary">Salvar</button>
      <button id="prof-verify" class="btn">Pedir selo azul</button>
    </div>
    <div style="margin-top:8px"><strong>Verified:</strong> ${u.verified? 'SIM':'NÃO'}</div>
  `;
  showModal(html);
  document.getElementById('prof-save').addEventListener('click', async ()=>{
    const users = LS.get('y_users');
    const uidx = users.find(x=>x.id===s.id);
    uidx.username = document.getElementById('prof-username').value.trim() || uidx.username;
    uidx.bio = document.getElementById('prof-bio').value;
    if(document.getElementById('prof-avatar').files?.[0]){
      const d = await toDataURL(document.getElementById('prof-avatar').files[0]);
      uidx.avatar = d;
    }
    LS.set('y_users', users);
    alert('Perfil salvo.'); renderAll(); closeModal();
  });
  document.getElementById('prof-verify').addEventListener('click', ()=>{
    const settings = LS.get('y_settings');
    const sReq = settings.verifiedRequests || [];
    sReq.push({id:uid(), userId:s.id, date:now(), status:'pending'});
    settings.verifiedRequests = sReq; LS.set('y_settings', settings);
    alert('Pedido de verificação enviado. (Simulado)'); closeModal();
  });
}

function showSettings(){
  const s = currentUser(); if(!s) return showAuth();
  const settings = LS.get('y_settings');
  const monet = settings.monetize? 'checked':'';
  const html = `
    <h3>Configurações</h3>
    <label><input id="monet-toggle" type="checkbox" ${monet}/> Ativar Monetização (simulado)</label>
    <div style="margin-top:8px">
      <button id="save-settings" class="btn primary">Salvar</button>
    </div>
  `;
  showModal(html);
  document.getElementById('save-settings').addEventListener('click', ()=>{
    const settings = LS.get('y_settings');
    settings.monetize = document.getElementById('monet-toggle').checked;
    LS.set('y_settings', settings);
    alert('Configurações salvas.');
    closeModal();
  });
}

/* ---------- Support ---------- */
function showSupport(){
  const html = `
    <h3>Suporte & Ajuda</h3>
    <p>Para relatar problemas, descreva e clique enviar. (local demo)</p>
    <textarea id="support-text" placeholder="Descreva o problema..." style="width:100%;height:100px"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px"><button id="support-send" class="btn primary">Enviar</button></div>
  `;
  showModal(html);
  document.getElementById('support-send').addEventListener('click', ()=>{
    const txt = document.getElementById('support-text').value.trim();
    if(!txt) return alert('Descreve o problema.');
    // store in localStorage as support tickets
    const tickets = LS.get('y_support')||[];
    tickets.push({id:uid(), text:txt, at:now()});
    LS.set('y_support', tickets);
    alert('Ticket enviado (local).'); closeModal();
  });
}

/* ---------- posts: create / render / like / comment / share ---------- */
async function toDataURL(file){
  return await new Promise(res=>{
    const r = new FileReader();
    r.onload = ()=> res(r.result);
    r.readAsDataURL(file);
  });
}

document.getElementById('nav-login').addEventListener('click', showAuth);
document.getElementById('btn-open-settings').addEventListener('click', showSettings);
document.getElementById('btn-open-support').addEventListener('click', showSupport);
document.getElementById('btn-open-support-2').addEventListener('click', showSupport);

/* posting */
dom.btnPost?.addEventListener('click', async ()=>{
  const s = currentUser(); if(!s) { showAuth(); return; }
  const text = (dom.postContent.value || '').trim();
  const file = dom.postImage.files?.[0];
  if(!text && !file) return alert('Adiciona texto ou imagem.');
  let media = null;
  if(file) media = await toDataURL(file);
  const posts = LS.get('y_posts')||[];
  posts.unshift({id:uid(), userId:s.id, text, media, createdAt:now()});
  LS.set('y_posts', posts);
  dom.postContent.value=''; dom.postImage.value='';
  renderAll();
});

/* interactions */
function toggleLike(postId){
  const s = currentUser(); if(!s) { showAuth(); return; }
  const likes = LS.get('y_likes')||[];
  const ex = likes.find(l=>l.postId===postId && l.userId===s.id);
  if(ex) {
    LS.set('y_likes', likes.filter(l=>!(l.postId===postId && l.userId===s.id)));
  } else {
    likes.push({id:uid(), postId, userId:s.id, at:now()}); LS.set('y_likes', likes);
  }
  renderAll();
}
function sharePost(postId){
  const posts = LS.get('y_posts')||[]; const p = posts.find(x=>x.id===postId);
  if(!p) return alert('Post não encontrado');
  // emulate share: create a simple share link (page local)
  const shareUrl = location.origin + location.pathname + '?share=' + postId;
  navigator.clipboard?.writeText(shareUrl).then(()=> alert('Link copiado: ' + shareUrl), ()=> alert('Link: ' + shareUrl));
}
function addComment(postId, text){
  const s = currentUser(); if(!s) { showAuth(); return; }
  if(!text?.trim()) return;
  const comments = LS.get('y_comments')||[];
  comments.push({id:uid(), postId, userId:s.id, text:text.trim(), at:now()});
  LS.set('y_comments', comments); renderAll();
}

/* render feed */
function renderFeed(){
  const posts = LS.get('y_posts')||[];
  const likes = LS.get('y_likes')||[];
  const comments = LS.get('y_comments')||[];
  dom.feed.innerHTML = '';
  posts.forEach(p=>{
    const u = findUser(p.userId) || {username:'Usuário', avatar:null};
    const el = document.createElement('div'); el.className='post card';
    el.innerHTML = `
      <div class="meta">
        <div class="avatar" style="width:44px;height:44px">${u.avatar? `<img src="${u.avatar}" style="width:44px;height:44px;border-radius:50%"/>` : (u.username[0]||'U')}</div>
        <div style="flex:1">
          <div class="who">${u.username} ${u.verified?'<span class="badge-small">✔</span>':''}</div>
          <div class="muted">${p.createdAt}</div>
        </div>
      </div>
      <div class="content">${escapeHtml(p.text||'')}</div>
      ${p.media? (p.media.startsWith('data:video')? `<video controls src="${p.media}" style="width:100%;border-radius:8px;margin-top:8px"></video>` : `<img src="${p.media}" style="width:100%;border-radius:8px;margin-top:8px"/>`) : ''}
      <div class="post-actions">
        <button class="btn small" onclick="toggleLike('${p.id}')">❤ ${likes.filter(l=>l.postId===p.id).length}</button>
        <button class="btn small" onclick="document.getElementById('cbox-${p.id}').classList.toggle('hidden')">💬 ${comments.filter(c=>c.postId===p.id).length}</button>
        <button class="btn small" onclick="sharePost('${p.id}')">🔗 Partilhar</button>
      </div>
      <div id="cbox-${p.id}" class="hidden" style="margin-top:8px">
        <input id="cin-${p.id}" placeholder="Escreve um comentário..." style="width:75%;padding:8px;border-radius:8px;border:1px solid #eef2ff"/>
        <button class="btn small" onclick="(function(){ addComment('${p.id}', document.getElementById('cin-${p.id}').value); document.getElementById('cin-${p.id}').value='';})()">Enviar</button>
        <div style="margin-top:8px">
          ${comments.filter(c=>c.postId===p.id).map(c=>{
            const cu = findUser(c.userId)||{username:'U'};
            return `<div style="padding:6px;border-top:1px solid #f1f5f9"><strong>${cu.username}:</strong> ${escapeHtml(c.text)} <div class="muted" style="font-size:12px">${c.at}</div></div>`;
          }).join('')}
        </div>
      </div>
    `;
    dom.feed.appendChild(el);
  });
}

/* escape html */
function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* ---------- reels ---------- */
let reelIndex = 0;
function renderReels(){
  const reels = LS.get('y_reels')||[];
  dom.reelsEl.innerHTML = '';
  if(reels.length===0) { dom.reelsEl.innerHTML='<div class="muted">Sem reels</div>'; return; }
  const r = reels[reelIndex % reels.length];
  const wrapper = document.createElement('div');
  if(r.type==='img') wrapper.innerHTML = `<img src="${r.src}" alt="${r.title}" />`;
  else wrapper.innerHTML = `<video src="${r.src}" controls></video>`;
  dom.reelsEl.appendChild(wrapper);
}
document.getElementById('reel-next').addEventListener('click', ()=>{ reelIndex++; renderReels(); });
document.getElementById('reel-prev').addEventListener('click', ()=>{ reelIndex = Math.max(0,reelIndex-1); renderReels(); });

/* ---------- search ---------- */
dom.searchGlobal.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doSearch(dom.searchGlobal.value.trim()); });
dom.asideSearch.addEventListener('input', ()=> doSearch(dom.asideSearch.value.trim()));
function doSearch(q){
  if(!q) { dom.searchResults.innerHTML=''; return; }
  const users = (LS.get('y_users')||[]).filter(u=>u.username?.toLowerCase().includes(q.toLowerCase()));
  const posts = (LS.get('y_posts')||[]).filter(p=>p.text?.toLowerCase().includes(q.toLowerCase()));
  dom.searchResults.innerHTML = '';
  users.forEach(u=>{
    const d = document.createElement('div'); d.className='search-result'; d.innerHTML = `<div>${u.username}</div><div><button class="btn small" onclick="openChatWith('${u.id}')">Chat</button></div>`;
    dom.searchResults.appendChild(d);
  });
  posts.forEach(p=>{
    const d = document.createElement('div'); d.className='search-result'; d.inner
