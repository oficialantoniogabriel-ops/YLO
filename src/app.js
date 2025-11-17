/* YLO - single-file app logic (localStorage) */

/* --- storage helpers --- */
const LS = {
  get(k){ try{return JSON.parse(localStorage.getItem(k));}catch(e){return null} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};
function ensure() {
  if(!LS.get('y_users')) LS.set('y_users', [
    // demo founder user (you)
    { id: 'u_founder', username:'António Ndala', email:'founder@ylo.local', avatar:null, bio:'Fundador da YLO', followers:12000, verified:true }
  ]);
  if(!LS.get('y_session')) LS.set('y_session', null);
  if(!LS.get('y_posts')) LS.set('y_posts', [
    { id:'p_demo', userId:'u_founder', text:'Bem-vindo ao YLO! Este é um post de exemplo.', media:null, createdAt: new Date().toLocaleString() }
  ]);
  if(!LS.get('y_reels')) LS.set('y_reels', [
    {id:'r1', type:'img', src:'https://picsum.photos/seed/1/800/420', title:'Pôr do sol'},
    {id:'r2', type:'img', src:'https://picsum.photos/seed/2/800/420', title:'Cidade'}
  ]);
  if(!LS.get('y_likes')) LS.set('y_likes', []);
  if(!LS.get('y_comments')) LS.set('y_comments', []);
  if(!LS.get('y_settings')) LS.set('y_settings', { monetizeRequests:[]});
}
ensure();

/* --- util --- */
const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const nowStr = ()=> new Date().toLocaleString();
function findUser(id){ return (LS.get('y_users')||[]).find(u=>u.id===id) || null; }
function currentUser(){ return LS.get('y_session'); }

/* --- DOM refs --- */
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const refs = {
  btnHome: '#btn-home', btnReels:'#btn-reels', btnActivity:'#btn-activity', btnMonet:'#btn-monet', btnProfile:'#btn-profile',
  topSearch:'#top-search', btnTopSearch:'#btn-top-search',
  asideSearch:'#aside-search', searchResults:'#search-results',
  navLogin:'#nav-login', navLogout:'#nav-logout',
  authModal:'#auth-modal', authClose:'#auth-close', authRegister:'#auth-register', authLogin:'#auth-login',
  authIdentifier:'#auth-identifier', authPassword:'#auth-password', authUsername:'#auth-username',
  composer:'#composer', composerText:'#composer-text', composerFile:'#composer-file', composerCurrency:'#composer-currency', btnPublish:'#btn-publish',
  feed:'#feed', reels:'#reels', reelNext:'#reel-next', reelPrev:'#reel-prev',
  btnOpenSupport:'#btn-open-support', chatModal:'#chat-modal', chatClose:'#chat-close', chatList:'#chat-list', chatSend:'#chat-send', chatInput:'#chat-input',
  sessionAvatar:'#session-avatar', sessionUsername:'#session-username', sessionFollowers:'#session-followers', btnEditProfile:'#btn-edit-profile',
  profileCard:'#profile-card', btnEnableMonet:'#btn-enable-monet', monetInfo:'#monet-info',
  topNavBtns:'.nav-btn', screenSelector:'.screen', composerSelector:'#composer'
};

/* --- helper for element get --- */
function el(sel){ return document.querySelector(sel); }
function els(sel){ return Array.from(document.querySelectorAll(sel)); }

/* --- navigation --- */
function switchScreen(screenId) {
  els('.screen').forEach(s=>s.classList.remove('active'));
  const elScreen = el('#'+screenId);
  if(elScreen) elScreen.classList.add('active');
  // top nav active
  els('.nav-btn').forEach(b=>b.classList.remove('active'));
  // map id to top nav
  const map = { home:'btn-home', reels:'btn-reels', activity:'btn-activity', monet:'btn-monet', profile:'btn-profile' };
  const btnId = map[screenId];
  if(btnId) document.getElementById(btnId).classList.add('active');
}

/* attach top nav events */
document.getElementById('btn-home').addEventListener('click', ()=>{ switchScreen('screen-home'); renderFeed(); });
document.getElementById('btn-reels').addEventListener('click', ()=>{ switchScreen('screen-reels'); renderReels(); });
document.getElementById('btn-activity').addEventListener('click', ()=>{ switchScreen('screen-activity'); });
document.getElementById('btn-monet').addEventListener('click', ()=>{ switchScreen('screen-monet'); updateMonetUI(); });
document.getElementById('btn-profile').addEventListener('click', ()=>{ openProfile(currentUser()? currentUser().id : null); });

/* aside nav */
document.getElementById('nav-home-aside').addEventListener('click', ()=>{ switchScreen('screen-home'); });
document.getElementById('nav-reels-aside').addEventListener('click', ()=>{ switchScreen('screen-reels'); renderReels(); });
document.getElementById('nav-activity-aside').addEventListener('click', ()=>{ switchScreen('screen-activity'); });
document.getElementById('nav-monet-aside').addEventListener('click', ()=>{ switchScreen('screen-monet'); updateMonetUI(); });

/* --- search --- */
function searchAll(q){
  if(!q) return [];
  q = q.toLowerCase();
  const users = (LS.get('y_users')||[]).filter(u=> (u.username||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
  const posts = (LS.get('y_posts')||[]).filter(p=> (p.text||'').toLowerCase().includes(q));
  return { users, posts };
}
document.getElementById('top-search').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') {
    const r = searchAll(e.target.value.trim());
    renderSearchResults(r);
    switchScreen('screen-home'); // keep context
  }
});
document.getElementById('btn-top-search').addEventListener('click', ()=>{
  const q = document.getElementById('top-search').value.trim();
  const r = searchAll(q);
  renderSearchResults(r);
});
document.getElementById('aside-search').addEventListener('input',(e)=>{
  const q = e.target.value.trim();
  const r = searchAll(q);
  renderSearchResults(r);
});
function renderSearchResults({users=[], posts=[]}){
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if(users.length===0 && posts.length===0){ container.innerHTML = '<div class="muted">Nenhum resultado</div>'; return; }
  users.forEach(u=>{
    const d = document.createElement('div'); d.className='search-result';
    d.innerHTML = `<div><strong>${u.username}</strong> <span class="muted">${u.email||''}</span> ${u.verified?'<span class="verified-badge">✔</span>':''}</div>
                   <div><button class="btn small" onclick="openProfile('${u.id}')">Visitar</button></div>`;
    container.appendChild(d);
  });
  posts.forEach(p=>{
    const u = findUser(p.userId) || { username:'Usuário' };
    const d = document.createElement('div'); d.className='search-result';
    d.innerHTML = `<div><strong>${u.username}</strong> — ${p.text||''}</div>
                   <div><button class="btn small" onclick="window.alert('Abrir post demo')">Abrir</button></div>`;
    container.appendChild(d);
  });
}

/* --- auth (local demo) --- */
document.getElementById('nav-login').addEventListener('click', ()=> el('#auth-modal').classList.remove('hidden'));
document.getElementById('auth-close').addEventListener('click', ()=> el('#auth-modal').classList.add('hidden'));
document.getElementById('auth-register').addEventListener('click', ()=>{
  const idv = el('#auth-identifier').value.trim();
  const pass = el('#auth-password').value;
  const username = el('#auth-username').value.trim() || idv.split('@')[0] || 'user';
  if(!idv || pass.length<4) return alert('Coloca email/telefone e senha (mín 4).');
  const users = LS.get('y_users') || [];
  if(users.find(u=>u.email===idv || u.phone===idv)) return alert('Usuário já existe.');
  const newU = { id: uid(), username, email: idv.includes('@')?idv:null, phone: idv.includes('@')?null:idv, avatar:null, bio:'', followers:0, verified:false };
  users.push(newU);
  LS.set('y_users', users);
  LS.set('y_session', { id: newU.id });
  el('#auth-modal').classList.add('hidden');
  renderAll();
});
document.getElementById('auth-login').addEventListener('click', ()=>{
  const idv = el('#auth-identifier').value.trim();
  const users = LS.get('y_users')||[];
  const u = users.find(u=> u.email===idv || u.phone===idv);
  if(!u) return alert('Usuário não encontrado. Regista-te.');
  LS.set('y_session', { id: u.id });
  el('#auth-modal').classList.add('hidden');
  renderAll();
});
document.getElementById('nav-logout').addEventListener('click', ()=>{
  LS.set('y_session', null);
  renderAll();
});

/* --- composer / posts --- */
function fileToDataURL(file){ return new Promise(res=>{
  const r = new FileReader(); r.onload = ()=> res(r.result); r.readAsDataURL(file);
});}
document.getElementById('btn-publish').addEventListener('click', async ()=>{
  const s = currentUser();
  if(!s) { el('#auth-modal').classList.remove('hidden'); return; }
  const text = el('#composer-text').value.trim();
  const file = el('#composer-file').files?.[0];
  if(!text && !file) return alert('Adiciona texto ou imagem.');
  let media = null;
  if(file) media = await fileToDataURL(file);
  const posts = LS.get('y_posts') || [];
  posts.unshift({ id: uid(), userId: s.id, text, media, createdAt: nowStr() });
  LS.set('y_posts', posts);
  el('#composer-text').value=''; el('#composer-file').value='';
  renderFeed();
});

/* --- render feed --- */
function renderFeed(){
  const feed = el('#feed'); feed.innerHTML = '';
  const posts = LS.get('y_posts') || [];
  posts.forEach(p=>{
    const u = findUser(p.userId) || { username:'Usuário' };
    const div = document.createElement('div'); div.className='post card';
    const likeCount = (LS.get('y_likes')||[]).filter(l=>l.postId===p.id).length;
    const comments = (LS.get('y_comments')||[]).filter(c=>c.postId===p.id);
    div.innerHTML = `
      <div class="meta">
        <div class="avatar">${u.avatar? `<img src="${u.avatar}" style="width:44px;height:44px;border-radius:50%"/>` : (u.username[0]||'U')}</div>
        <div style="flex:1">
          <div><strong>${u.username}</strong> ${u.verified?'<span class="verified-badge">✔</span>':''}</div>
          <div class="muted">${p.createdAt}</div>
        </div>
      </div>
      <div class="content">${escapeHtml(p.text||'')}</div>
      ${p.media? (p.media.startsWith('data:video')? `<video controls src="${p.media}"></video>` : `<img src="${p.media}">` ) : ''}
      <div class="post-actions">
        <button class="btn small" onclick="toggleLike('${p.id}')">❤ ${likeCount}</button>
        <button class="btn small" onclick="toggleComments('${p.id}')">💬 ${comments.length}</button>
        <button class="btn small" onclick="sharePost('${p.id}')">🔗 Partilhar</button>
      </div>
      <div id="comments-box-${p.id}" class="card hidden" style="margin-top:8px">
        <div id="comments-list-${p.id}"></div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <input id="cinput-${p.id}" placeholder="Comenta..." style="flex:1;padding:8px;border-radius:8px;border:1px solid #eef2ff"/>
          <button class="btn small" onclick="(function(){ addComment('${p.id}', document.getElementById('cinput-${p.id}').value); document.getElementById('cinput-${p.id}').value='';})()">Enviar</button>
        </div>
      </div>
    `;
    feed.appendChild(div);
    // render comments inside
    const cl = document.getElementById(`comments-list-${p.id}`);
    cl.innerHTML = '';
    comments.forEach(c=>{
      const cu = findUser(c.userId) || { username:'U' };
      const d = document.createElement('div'); d.innerHTML = `<strong>${cu.username}</strong> ${escapeHtml(c.text)} <div class="muted" style="font-size:12px">${c.at}</div>`;
      cl.appendChild(d);
    });
  });
}
function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* --- likes / comments / share --- */
window.toggleLike = function(postId){
  const s = currentUser(); if(!s) { el('#auth-modal').classList.remove('hidden'); return; }
  const likes = LS.get('y_likes')||[];
  const ex = likes.find(l=>l.postId===postId && l.userId===s.id);
  if(ex) LS.set('y_likes', likes.filter(l=>!(l.postId===postId && l.userId===s.id)));
  else { likes.push({ id: uid(), postId, userId: s.id, at: nowStr() }); LS.set('y_likes', likes); }
  renderFeed();
};
window.toggleComments = function(postId){
  const elBox = el(`#comments-box-${postId}`);
  if(elBox) elBox.classList.toggle('hidden');
};
function addComment(postId, text){
  const s = currentUser(); if(!s) { el('#auth-modal').classList.remove('hidden'); return; }
  if(!text?.trim()) return;
  const comments = LS.get('y_comments')||[];
  comments.push({ id: uid(), postId, userId: s.id, text: text.trim(), at: nowStr() });
  LS.set('y_comments', comments);
  renderFeed();
}
function sharePost(postId){
  const url = location.origin + location.pathname + `?share=${postId}`;
  navigator.clipboard?.writeText(url).then(()=> alert('Link copiado: '+url), ()=> alert('Link: '+url));
}

/* --- reels --- */
let reelIndex = 0;
function renderReels(){
  const reels = LS.get('y_reels')||[];
  const container = el('#reels'); container.innerHTML = '';
  if(reels.length===0){ container.innerHTML = '<div class="muted">Sem reels</div>'; return; }
  const r = reels[reelIndex % reels.length];
  if(r.type==='img') container.innerHTML = `<img src="${r.src}" alt="${r.title}" style="width:100%"/>`;
  else container.innerHTML = `<video controls src="${r.src}" style="width:100%"></video>`;
}
document.getElementById('reel-next').addEventListener('click', ()=>{ reelIndex++; renderReels(); });
document.getElementById('reel-prev').addEventListener('click', ()=>{ reelIndex = Math.max(0,reelIndex-1); renderReels(); });

/* --- chat (demo) --- */
document.getElementById('btn-open-support').addEventListener('click', ()=> el('#chat-modal').classList.remove('hidden'));
document.getElementById('chat-close').addEventListener('click', ()=> el('#chat-modal').classList.add('hidden'));
document.getElementById('chat-send').addEventListener('click', ()=>{
  const text = el('#chat-input').value.trim(); if(!text) return;
  const list = LS.get('y_msgs')||[];
  list.push({ id: uid(), from: currentUser()?.id || 'guest', text, at: nowStr() });
  LS.set('y_msgs', list);
  renderChat();
  el('#chat-input').value='';
});
function renderChat(){
  const list = LS.get('y_msgs')||[];
  const root = el('#chat-list'); root.innerHTML = '';
  list.slice(-50).forEach(m=>{
    const u = findUser(m.from) || { username:'Visitante' };
    const d = document.createElement('div'); d.innerHTML = `<strong>${u.username}</strong> <div class="muted" style="font-size:12px">${m.at}</div><div>${escapeHtml(m.text)}</div>`;
    root.appendChild(d);
  });
}

/* --- profile --- */
function openProfile(userId){
  const uid = userId || (currentUser()? currentUser().id : null);
  if(!uid){ el('#auth-modal').classList.remove('hidden'); return; }
  const u = findUser(uid); if(!u) return alert('Usuário não encontrado.');
  switchScreen('screen-profile');
  const card = el('#profile-card');
  card.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <div class="avatar">${u.avatar?'<img src="'+u.avatar+'" style="width:64px;height:64px;border-radius:50%"/>':(u.username[0]||'U')}</div>
      <div>
        <h3>${u.username} ${u.verified?'<span class="verified-badge">✔</span>':''}</h3>
        <div class="muted">${u.bio||''}</div>
        <div style="margin-top:6px"><strong>${u.followers||0}</strong> seguidores</div>
      </div>
    </div>
    <div style="margin-top:12px">
      <button class="btn" onclick="followUser('${u.id}')">${currentUser() && currentUser().id===u.id ? 'Editar Perfil' : 'Seguir'}</button>
    </div>
  `;
}

/* follow */
function followUser(targetId){
  const s = currentUser(); if(!s) { el('#auth-modal').classList.remove('hidden'); return; }
  const users = LS.get('y_users')||[];
  const me = findUser(s.id);
  const target = findUser(targetId);
  if(!target) return;
  // simple followers increment (demo)
  target.followers = (target.followers||0) + 1;
  LS.set('y_users', users);
  alert('Seguido (demo).');
  renderAll();
}

/* --- monetization rules --- */
document.getElementById('btn-enable-monet').addEventListener('click', ()=>{
  const s = currentUser(); if(!s) { el('#auth-modal').classList.remove('hidden'); return; }
  const me = findUser(s.id);
  if((me.followers||0) < 5000) return alert('Monetização disponível apenas para usuários com 5000+ seguidores.');
  const settings = LS.get('y_settings'); settings.monetizeRequests = settings.monetizeRequests || [];
  settings.monetizeRequests.push({ id: uid(), userId: me.id, date: nowStr(), status:'pending' });
  LS.set('y_settings', settings);
  alert('Pedido de monetização enviado (simulado).');
  updateMonetUI();
});

function updateMonetUI(){
  const s = currentUser();
  if(!s){ el('#monet-info').innerText = 'Inicia sessão para pedir monetização.'; return; }
  const me = findUser(s.id);
  el('#monet-info').innerText = `Seus seguidores: ${me.followers || 0}. Requisito: 5000.`;
}

/* --- render session + UI --- */
function updateSessionUI(){
  const s = currentUser();
  if(s){
    const me = findUser(s.id);
    document.getElementById('nav-login').classList.add('hidden');
    document.getElementById('nav-logout').classList.remove('hidden');
    document.getElementById('composer').classList.remove('hidden');
    document.getElementById('composer-avatar').innerText = me.username[0] || 'U';
    document.getElementById('session-avatar').innerText = me.username[0] || 'U';
    document.getElementById('session-username').innerText = me.username;
    document.getElementById('session-followers').innerText = `${me.followers||0} seguidores`;
    if(me.verified) document.querySelector('.founder .verified-badge')?.classList.add('visible');
    document.getElementById('btn-edit-profile').classList.remove('hidden');
  } else {
    document.getElementById('nav-login').classList.remove('hidden');
    document.getElementById('nav-logout').classList.add('hidden');
    document.getElementById('composer').classList.add('hidden');
    document.getElementById('session-avatar').innerText = 'U';
    document.getElementById('session-username').innerText = 'Visitante';
    document.getElementById('session-followers').innerText = '0 seguidores';
    document.getElementById('btn-edit-profile').classList.add('hidden');
  }
}

/* --- helpers UI --- */
function renderAll(){
  updateSessionUI();
  renderFeed();
  renderReels();
  renderChat();
  updateMonetUI();
}

/* --- init: if URL has "?share=" open that post (demo) --- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderAll();
  // quick click handlers for aside links
  document.getElementById('btn-ads').addEventListener('click', ()=> alert('Anúncio (simulado)'));
  document.getElementById('btn-open-support').addEventListener('click', ()=> el('#chat-modal').classList.remove('hidden'));
  // open composer for logged in
  if(currentUser()) document.getElementById('composer').classList.remove('hidden');
});
