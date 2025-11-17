/* YLO — main.js (localStorage based)
   - Ligar em todas páginas (inclusivo home/reels/activity/monet/profile)
   - Deve ser incluído com: <script defer src="assets/js/main.js"></script>
*/

/* --------- Setup localStorage defaults --------- */
const STORAGE_KEYS = {
  users: 'ylo_users',
  session: 'ylo_session',
  posts: 'ylo_posts',
  settings: 'ylo_settings'
};

function lsGet(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null } }
function lsSet(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

function ensureInit(){
  if(!lsGet(STORAGE_KEYS.users)) lsSet(STORAGE_KEYS.users, [
    { id:'u_demo', username:'YLO Oficial', email:'demo@ylo.local', avatar:null, verified:true, followers: 0 }
  ]);
  if(!lsGet(STORAGE_KEYS.session)) lsSet(STORAGE_KEYS.session, null);
  if(!lsGet(STORAGE_KEYS.posts)) lsSet(STORAGE_KEYS.posts, []);
  if(!lsGet(STORAGE_KEYS.settings)) lsSet(STORAGE_KEYS.settings, { monetize:false, monetRequests:[] });
}
ensureInit();

/* --------- Helpers --------- */
function currentUser(){ return lsGet(STORAGE_KEYS.session); }
function findUserById(id){ return (lsGet(STORAGE_KEYS.users)||[]).find(u=>u.id===id) || null; }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function now(){ return new Date().toLocaleString(); }

/* --------- Auth: register / login / logout --------- */
function registerLocal(identifier, password, username){
  // identifier can be email or phone - in demo we don't store password securely
  const users = lsGet(STORAGE_KEYS.users) || [];
  const exists = users.find(u => u.email === identifier || u.phone === identifier);
  if(exists) throw new Error('Usuário já existe');
  const u = { id: uid(), username: username || identifier.split('@')[0], email: identifier.includes('@')?identifier:null, phone: identifier.includes('@')?null:identifier, avatar:null, verified:false, followers:0 };
  users.push(u); lsSet(STORAGE_KEYS.users, users);
  lsSet(STORAGE_KEYS.session, { id: u.id });
  return u;
}

function loginLocal(identifier){
  const users = lsGet(STORAGE_KEYS.users) || [];
  const u = users.find(x => x.email === identifier || x.phone === identifier);
  if(!u) throw new Error('Usuário não encontrado');
  lsSet(STORAGE_KEYS.session, { id: u.id });
  return u;
}

function logout(){
  lsSet(STORAGE_KEYS.session, null);
  // redirect to index or refresh
  if(location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
    renderAuthUI();
  } else {
    location.href = 'index.html';
  }
}

/* --------- UI rendering functions (guarded by existence) --------- */

function renderTopbarProfile(){
  const session = currentUser();
  const profileNameEls = document.querySelectorAll('#profile-name, #session-name');
  const followersEls = document.querySelectorAll('#followers-count');
  const avatarEls = document.querySelectorAll('.profile-avatar, #session-avatar');

  if(session){
    const u = findUserById(session.id);
    if(profileNameEls) profileNameEls.forEach(e=> e.textContent = u.username);
    if(followersEls) followersEls.forEach(e=> e.textContent = (u.followers||0)+' seguidores');
  } else {
    if(profileNameEls) profileNameEls.forEach(e=> e.textContent = 'Visitante');
    if(followersEls) followersEls.forEach(e=> e.textContent = '0 seguidores');
  }
}

/* --------- Home: post publishing & feed rendering --------- */
function attachHomeEvents(){
  const postBtn = document.querySelector('.feed-box .btn-primary');
  const textarea = document.querySelector('.feed-box textarea');
  if(postBtn){
    postBtn.addEventListener('click', async ()=>{
      const session = currentUser();
      if(!session){ alert('Faz login para publicar.'); location.href='login.html'; return; }
      const text = textarea.value.trim();
      if(!text) return alert('Escreve algo antes de publicar.');
      const posts = lsGet(STORAGE_KEYS.posts) || [];
      posts.unshift({ id: uid(), userId: session.id, text, media:null, createdAt: now() });
      lsSet(STORAGE_KEYS.posts, posts);
      textarea.value = '';
      renderFeed();
    });
  }
}

function renderFeed(){
  const feedEl = document.querySelector('.post-list') || document.querySelector('.container .feed-area') || document.querySelector('.container');
  // we support a few layouts; try to find a dedicated feed container first
  let target = document.querySelector('#feed') || document.querySelector('.feed-area') || document.querySelector('.container');
  if(!target) return;
  const posts = lsGet(STORAGE_KEYS.posts) || [];
  // ensure we render into a sub-container not override whole page; try to find .feed-wrap
  let feedWrap = document.querySelector('#ylo-feed-wrap');
  if(!feedWrap){
    feedWrap = document.createElement('div');
    feedWrap.id = 'ylo-feed-wrap';
    // place near top of middle column
    const middle = document.querySelector('.feed-box') || document.querySelector('.container');
    if(middle) middle.parentNode.insertBefore(feedWrap, middle.nextSibling);
    else target.appendChild(feedWrap);
  }
  feedWrap.innerHTML = '';
  if(posts.length === 0){
    feedWrap.innerHTML = '<div class="card post-card"><div class="muted">Ainda não existem publicações. Sê o primeiro!</div></div>';
    return;
  }
  posts.forEach(p=>{
    const u = findUserById(p.userId) || { username:'Usuário', avatar:null };
    const el = document.createElement('div');
    el.className = 'post-card card';
    el.innerHTML = `
      <div class="meta">
        <div class="avatar">${u.avatar ? `<img src="${u.avatar}" style="width:44px;height:44px;border-radius:50%"/>` : (u.username[0]||'U')}</div>
        <div style="flex:1">
          <div class="who">${u.username} ${u.verified?'<span class="badge-small" style="background:#1877F2;color:#fff;padding:2px 6px;border-radius:999px;font-size:11px;">✔</span>':''}</div>
          <div class="muted">${p.createdAt}</div>
        </div>
      </div>
      <div class="content" style="margin-top:8px">${escapeHtml(p.text)}</div>
      <div class="post-actions" style="margin-top:12px;display:flex;gap:8px;align-items:center">
        <button class="btn small" data-action="like" data-id="${p.id}">❤ <span class="like-count">${countLikes(p.id)}</span></button>
        <button class="btn small" data-action="comment" data-id="${p.id}">💬</button>
        <button class="btn small" data-action="share" data-id="${p.id}">🔗</button>
      </div>
    `;
    feedWrap.appendChild(el);

    // bind actions
    el.querySelectorAll('button[data-action]').forEach(btn=>{
      btn.addEventListener('click', (ev)=>{
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if(action==='like') toggleLike(id);
        if(action==='comment') {
          const txt = prompt('Escreve o comentário:');
          if(txt) addComment(id, txt);
        }
        if(action==='share') {
          navigator.clipboard?.writeText(location.href + '?share=' + id).then(()=> alert('Link copiado!'), ()=> alert('Link: ' + (location.href + '?share='+id)));
        }
      });
    });
  });
}

/* likes/comments helpers (simple local) */
function countLikes(postId){
  const likes = lsGet('ylo_likes') || [];
  return likes.filter(l => l.postId === postId).length;
}
function toggleLike(postId){
  const session = currentUser();
  if(!session){ alert('Login necessário'); location.href='login.html'; return; }
  let likes = lsGet('ylo_likes') || [];
  const found = likes.find(l => l.postId === postId && l.userId === session.id);
  if(found) likes = likes.filter(l => !(l.postId === postId && l.userId === session.id));
  else likes.push({ id: uid(), postId, userId: session.id, at: now() });
  lsSet('ylo_likes', likes);
  renderFeed();
}
function addComment(postId, text){
  const session = currentUser();
  if(!session){ alert('Login necessário'); location.href='login.html'; return; }
  const comments = lsGet('ylo_comments') || [];
  comments.push({ id: uid(), postId, userId: session.id, text, at: now() });
  lsSet('ylo_comments', comments);
  alert('Comentário adicionado (local).');
  renderFeed();
}

/* --------- Search (page search.html or search area) --------- */
function attachSearch(){
  const input = document.querySelector('#search-input') || document.querySelector('#global-search');
  const results = document.querySelector('#search-results') || document.querySelector('#search-results');
  if(!input || !results) return;
  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if(!q) return;
    const users = lsGet(STORAGE_KEYS.users) || [];
    const matched = users.filter(u => (u.username||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
    if(matched.length === 0) { results.innerHTML = '<div class="muted">Nenhum resultado encontrado</div>'; return; }
    matched.forEach(u=>{
      const div = document.createElement('div'); div.className = 'search-result';
      div.innerHTML = `<div><strong>${u.username}</strong><div class="muted">${u.email||u.phone||''}</div></div><div><button class="btn small" data-id="${u.id}">Visitar</button></div>`;
      results.appendChild(div);
      div.querySelector('button')?.addEventListener('click', ()=> { location.href = 'profile.html?u=' + u.id; });
    });
  });
}

/* --------- Profile page rendering --------- */
function renderProfilePage(){
  const profileName = document.querySelector('#profile-name');
  const followersCount = document.querySelector('#followers-count');
  const avatarEl = document.querySelector('.avatar');
  const params = new URLSearchParams(location.search);
  const uParam = params.get('u');
  const userId = uParam || (currentUser() && currentUser().id);
  if(!userId) return;
  const u = findUserById(userId);
  if(!u) return;
  if(profileName) profileName.textContent = u.username;
  if(followersCount) followersCount.textContent = (u.followers||0) + ' seguidores';
  if(avatarEl) avatarEl.innerHTML = u.avatar ? `<img src="${u.avatar}" style="width:88px;height:88px;border-radius:50%"/>` : (u.username[0]||'U');
}

/* --------- Monetization checks --------- */
function attachMonetEvents(){
  const btn = document.querySelector('.card .btn-primary');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const s = currentUser();
    if(!s){ alert('Faz login para ver elegibilidade.'); location.href='login.html'; return; }
    const u = findUserById(s.id);
    if((u.followers||0) >= 5000){
      alert('Parabéns! És elegível para monetização. (simulação)');
    } else {
      alert('Tu precisas de 5.000 seguidores para monetizar. Continua a criar conteúdo!');
    }
  });
}

/* --------- Utility: escape html --------- */
function escapeHtml(s){ return (s||'').toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* --------- Render overall UI elements depending on page --------- */
function renderAuthUI(){
  // if on home or profile and user logged in, redirect to home
  const session = currentUser();
  // update header/profile pieces if exist
  const logoutBtn = document.querySelector('.logout-btn');
  if(logoutBtn){
    if(session) { logoutBtn.style.display = 'inline-block'; } else { logoutBtn.style.display = 'none'; }
  }
  renderTopbarProfile();
}

function attachAuthForms(){
  // login page
  const loginForm = document.querySelector('#login-form');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const id = document.querySelector('#login-identifier').value.trim();
      try { loginLocal(id); alert('Login efetuado (demo).'); location.href = 'home.html'; }
      catch(err){ alert(err.message); }
    });
  }
  // register page
  const regForm = document.querySelector('#register-form');
  if(regForm){
    regForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const id = document.querySelector('#reg-identifier').value.trim();
      const name = document.querySelector('#reg-username').value.trim();
      try { registerLocal(id, 'demo', name); alert('Conta criada e logado (demo).'); location.href = 'home.html'; } catch(err){ alert(err.message); }
    });
  }
}

/* --------- Init: attach events if elements exist on the current page --------- */
document.addEventListener('DOMContentLoaded', ()=>{
  ensureInit();
  // attach home events if present
  attachHomeEvents();
  renderFeed();
  attachSearch();
  renderProfilePage();
  attachMonetEvents();
  attachAuthForms();

  // global logout link(s)
  document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', ()=> logout()));

  // ensure top nav active link highlights
  document.querySelectorAll('.top-nav a').forEach(a=>{
    if(a.href && location.pathname.endsWith(a.getAttribute('href'))) a.classList.add('active');
  });

  renderAuthUI();
});

/* Expose small helpers for console / buttons */
window.YLO = {
  loginLocal, registerLocal, logout, renderFeed, renderProfilePage
};
