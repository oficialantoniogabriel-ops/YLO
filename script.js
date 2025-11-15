/* YLO — Single-file app logic (localStorage) */
/* Keys used: ylo_users, ylo_session, ylo_posts, ylo_likes, ylo_comments, ylo_messages, ylo_reels, ylo_settings, ylo_requests */

const storage = {
  get(k){ return JSON.parse(localStorage.getItem(k) || "null"); },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

function ensureInit(){
  if(!storage.get("ylo_users")) storage.set("ylo_users", []);
  if(!storage.get("ylo_posts")) storage.set("ylo_posts", []);
  if(!storage.get("ylo_likes")) storage.set("ylo_likes", []);
  if(!storage.get("ylo_comments")) storage.set("ylo_comments", []);
  if(!storage.get("ylo_messages")) storage.set("ylo_messages", []);
  if(!storage.get("ylo_reels")) storage.set("ylo_reels", sampleReels());
  if(!storage.get("ylo_settings")) storage.set("ylo_settings", { monet:false });
  if(!storage.get("ylo_requests")) storage.set("ylo_requests", []);
}
ensureInit();

/* Utilities */
const uid = ()=> Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const now = ()=> new Date().toLocaleString();
function toast(msg, time=2500){ const el=document.getElementById('toast'); el.innerText=msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),time); }

/* Sample reels generator (demo content) */
function sampleReels(){
  return [
    { id: uid(), title:"Visão Matinal", type:"image", src:null, placeholderColor:"#f97316", createdAt: now() },
    { id: uid(), title:"Dicas Rápidas", type:"image", src:null, placeholderColor:"#06b6d4", createdAt: now() },
    { id: uid(), title:"Momento YLO", type:"image", src:null, placeholderColor:"#7c3aed", createdAt: now() }
  ];
}

/* DOM elements */
const feedEl = document.getElementById('feed');
const reelsEl = document.getElementById('reelsContainer');
const profileNameEl = document.getElementById('profileName');
const profileEmailEl = document.getElementById('profileEmail');
const profileAvatarEl = document.getElementById('profileAvatar');
const profileBadgeEl = document.getElementById('profileBadge');
const userQuickEl = document.getElementById('userQuick');
const searchInput = document.getElementById('searchInput');

/* Auth modals */
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

/* Chat */
const chatPanel = document.getElementById('chatPanel');
const convListEl = document.getElementById('convList');
const messagesEl = document.getElementById('messages');
const convTop = document.getElementById('convTop');
const msgInput = document.getElementById('msgInput');

/* New post */
const modalNewPost = document.getElementById('modalNewPost');
const newPostText = document.getElementById('newPostText');
const newPostMedia = document.getElementById('newPostMedia');

/* Profile modal */
const modalProfile = document.getElementById('modalProfile');
const inputName = document.getElementById('inputName');
const inputEmailPhone = document.getElementById('inputEmailPhone');
const inputBio = document.getElementById('inputBio');
const inputAvatarFile = document.getElementById('inputAvatarFile');
const profileAvatarEditor = document.getElementById('profileAvatarEditor');
const profileStatsEl = document.getElementById('profileStats');
const profileRequestsEl = document.getElementById('profileRequests');

/* Support */
const supportModal = document.getElementById('supportModal');
const supportText = document.getElementById('supportText');

/* Buttons */
const btnNewPost = document.getElementById('btnNewPost');
const btnReels = document.getElementById('btnReels');
const btnChatOpen = document.getElementById('btnChatOpen');
const btnSupport = document.getElementById('btnSupport');
const btnProfile = document.getElementById('btnProfile');
const btnLogout = document.getElementById('btnLogout');
const btnHelp = document.getElementById('btnHelp');
const toggleMonet = document.getElementById('toggleMonet');
const btnRequestBadge = document.getElementById('btnRequestBadge');

/* Auth controls */
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');
const btnSwitchToRegister = document.getElementById('btnSwitchToRegister');
const btnSwitchToLogin = document.getElementById('btnSwitchToLogin');
const closeAuth = document.getElementById('closeAuth');
const closeNewPost = document.getElementById('closeNewPost');
const publishPostBtn = document.getElementById('publishPost');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const chatClose = document.getElementById('chatClose');
const sendSupportBtn = document.getElementById('sendSupport');

/* Inputs login/register */
const loginId = document.getElementById('loginId');
const loginPassword = document.getElementById('loginPassword');
const regName = document.getElementById('regName');
const regEmailPhone = document.getElementById('regEmailPhone');
const regPassword = document.getElementById('regPassword');
const regAvatarFile = document.getElementById('regAvatarFile');

/* messages composer */
const msgSendBtn = document.getElementById('msgSend');

/* utility functions for users/posts/messages */
function getUsers(){ return storage.get('ylo_users') || []; }
function saveUsers(u){ storage.set('ylo_users', u); }
function getSession(){ return storage.get('ylo_session'); }
function setSession(s){ storage.set('ylo_session', s); updateUI(); }
function getPosts(){ return storage.get('ylo_posts') || []; }
function setPosts(p){ storage.set('ylo_posts', p); }
function getLikes(){ return storage.get('ylo_likes') || []; }
function setLikes(l){ storage.set('ylo_likes', l); }
function getComments(){ return storage.get('ylo_comments') || []; }
function setComments(c){ storage.set('ylo_comments', c); }
function getMessages(){ return storage.get('ylo_messages') || []; }
function setMessages(m){ storage.set('ylo_messages', m); }
function getReels(){ return storage.get('ylo_reels') || []; }
function getSettings(){ return storage.get('ylo_settings') || { monet:false }; }
function setSettings(s){ storage.set('ylo_settings', s); }
function getRequests(){ return storage.get('ylo_requests') || []; }
function setRequests(r){ storage.set('ylo_requests', r); }

/* Helpers for avatars */
async function fileToDataUrl(file){
  return await new Promise(res=>{
    const r=new FileReader();
    r.onload = ()=> res(r.result);
    r.readAsDataURL(file);
  });
}

/* Create demo user if none */
function ensureDemo(){
  const u = getUsers();
  if(u.length===0){
    const demo = { id:'u_demo', name:'demo', email:'demo@ylo.local', phone:null, pass:'123456', avatar:null, bio:'Conta demo', verified:false, monet:false };
    saveUsers([demo]);
  }
}
ensureDemo();

/* ---------- Render functions ---------- */

function renderReels(){
  const reels = getReels();
  reelsEl.innerHTML = '';
  reels.forEach(r=>{
    const div = document.createElement('div');
    div.className='reel';
    div.innerHTML = `<div class="badge">${r.title}</div><div style="font-size:18px">${r.title}</div>`;
    div.style.background = r.placeholderColor || '#111';
    div.addEventListener('click', ()=> openReel(r.id));
    reelsEl.appendChild(div);
  });
}

function renderFeed(filterText=''){
  const posts = getPosts().slice().reverse(); // newest first
  feedEl.innerHTML = '';
  const likes = getLikes();
  const comments = getComments();
  const me = getSession();
  posts.forEach(p=>{
    if(filterText && !p.text.toLowerCase().includes(filterText.toLowerCase())) return;
    const user = getUsers().find(u=>u.id===p.userId) || {name:'Usuário', avatar:null};
    const postEl = document.createElement('div');
    postEl.className = 'post';
    postEl.innerHTML = `
      <div class="post-top">
        <div class="avatar">${user.avatar ? `<img src="${user.avatar}" style="width:48px;height:48px;border-radius:50%"/>` : (user.name[0]||'U')}</div>
        <div style="flex:1">
          <div class="username">${user.name}${user.verified? ' ✅' : ''}</div>
          <div class="meta">${p.createdAt}</div>
        </div>
      </div>
      <div class="text">${escapeHtml(p.text)}</div>
      ${p.media? (p.mediaType.startsWith('image')? `<img src="${p.media}" />` : `<video controls src="${p.media}" style="max-width:100%;border-radius:8px"></video>`) : ''}
      <div class="actions">
        <button class="action-btn like-btn" data-id="${p.id}">❤️ ${likes.filter(l=>l.postId===p.id).length}</button>
        <button class="action-btn comment-btn" data-id="${p.id}">💬 ${comments.filter(c=>c.postId===p.id).length}</button>
        <button class="action-btn share-btn" data-id="${p.id}">🔗 Partilhar</button>
      </div>
      <div class="comments-area" id="comments-${p.id}"></div>
    `;
    feedEl.appendChild(postEl);

    // comments
    const cArea = postEl.querySelector(`#comments-${p.id}`);
    comments.filter(c=>c.postId===p.id).forEach(c=>{
      const u = getUsers().find(x=>x.id===c.userId) || {name:'U'};
      const d = document.createElement('div');
      d.style.padding = '6px 0';
      d.innerHTML = `<b>${u.name}</b> <span class="muted" style="font-size:12px">${c.createdAt}</span><div>${escapeHtml(c.text)}</div>`;
      cArea.appendChild(d);
    });

    // comment input
    const commentForm = document.createElement('div');
    commentForm.style.marginTop='8px';
    commentForm.innerHTML = `<input placeholder="Comentar..." class="comment-input" data-id="${p.id}" style="width:70%;padding:8px;border-radius:8px;border:1px solid #eef2ff"/><button class="btn small-btn comment-send" data-id="${p.id}" style="margin-left:8px">Enviar</button>`;
    cArea.appendChild(commentForm);

    // listeners
    postEl.querySelector('.like-btn').addEventListener('click', ()=> toggleLike(p.id));
    postEl.querySelector('.comment-send').addEventListener('click', (e)=> {
      const id = e.target.dataset.id; const input = postEl.querySelector(`.comment-input[data-id="${id}"]`);
      addComment(id, input.value); input.value='';
    });
    postEl.querySelector('.share-btn').addEventListener('click', ()=> {
      const url = location.origin + location.pathname + `#post=${p.id}`;
      navigator.clipboard?.writeText(url).then(()=> toast('Link copiado para partilhar'));
    });
  });
}

/* Escape HTML small helper */
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- Auth / Users ---------- */

async function registerUser(){
  const name = regName.value.trim();
  const idOrPhone = regEmailPhone.value.trim();
  const pass = regPassword.value;
  if(!name || !idOrPhone || !pass) return toast('Preenche todos os campos');
  const users = getUsers();
  if(users.find(u=>u.email === idOrPhone || u.phone === idOrPhone)) return toast('Conta já existe');
  let avatar = null;
  if(regAvatarFile.files?.[0]) avatar = await fileToDataUrl(regAvatarFile.files[0]);
  const user = { id: uid(), name, email: idOrPhone.includes('@')? idOrPhone : null, phone: idOrPhone.includes('@')? null : idOrPhone, pass, avatar, bio:'', verified:false, monet:false };
  users.push(user); saveUsers(users);
  setSession({ id:user.id }); toast('Conta criada'); closeAuthModal(); updateUI();
}

function loginUser(){
  const id = loginId.value.trim();
  const pass = loginPassword.value;
  const users = getUsers();
  const user = users.find(u=> (u.email===id || u.phone===id) && u.pass===pass);
  if(!user) return toast('Credenciais inválidas');
  setSession({ id:user.id }); toast('Bem-vindo '+user.name); closeAuthModal();
}

/* ---------- Posts ---------- */

async function createPost(){
  const me = getSession();
  if(!me) { openAuthModal(); return; }
  const text = newPostText.value.trim();
  if(!text && !newPostMedia.files?.[0]) return toast('Adiciona texto ou media');
  let media=null, mediaType=null;
  if(newPostMedia.files?.[0]) {
    media = await fileToDataUrl(newPostMedia.files[0]);
    mediaType = newPostMedia.files[0].type;
  }
  const posts = getPosts();
  const p = { id: uid(), userId: me.id, text, media, mediaType, createdAt: now() };
  posts.push(p); setPosts(posts);
  newPostText.value=''; newPostMedia.value='';
  closeNewPostModal(); renderFeed(); toast('Publicado');
}

/* likes/comments */
function toggleLike(postId){
  const me = getSession(); if(!me){ openAuthModal(); return; }
  let likes = getLikes();
  const exists = likes.find(l=> l.postId===postId && l.userId===me.id);
  if(exists) likes = likes.filter(l=>!(l.postId===postId && l.userId===me.id));
  else likes.push({ id: uid(), postId, userId: me.id, createdAt: now() });
  setLikes(likes); renderFeed();
}
function addComment(postId, text){
  const me = getSession(); if(!me){ openAuthModal(); return; }
  if(!text?.trim()) return;
  const comments = getComments();
  comments.push({ id: uid(), postId, userId: me.id, text:text.trim(), createdAt: now() });
  setComments(comments); renderFeed();
}

/* ---------- Chat ---------- */

let activeConversation = null;
function renderConversations(){
  const me = getSession(); convListEl.innerHTML='';
  if(!me){ convListEl.innerHTML = '<div class="muted">Faz login para conversar</div>'; return; }
  const users = getUsers().filter(u=>u.id !== me.id);
  const msgs = getMessages();
  users.forEach(u=>{
    const last = msgs.filter(m=> (m.fromId===me.id && m.toId===u.id) || (m.fromId===u.id && m.toId===me.id)).slice(-1)[0];
    const div = document.createElement('div'); div.className='conv-item';
    div.innerHTML = `<span>${u.name}</span><small class="muted">${last ? last.text.slice(0,20) : ''}</small>`;
    div.addEventListener('click', ()=> openConversation(u.id));
    convListEl.appendChild(div);
  });
}

function openConversation(otherId){
  activeConversation = otherId;
  const users = getUsers();
  const u = users.find(x=>x.id===otherId) || {name:'?'}; convTop.innerText = u.name;
  renderMessagesFor(otherId);
}

function renderMessagesFor(otherId){
  const me = getSession(); if(!me) return;
  const msgs = getMessages().filter(m=> (m.fromId===me.id && m.toId===otherId) || (m.fromId===otherId && m.toId===me.id));
  messagesEl.innerHTML=''; msgs.forEach(m=>{
    const d = document.createElement('div'); d.className = 'msg '+(m.fromId===me.id? 'me':'they'); d.innerText = m.text + '\n';
    const time = document.createElement('div'); time.style.fontSize='11px'; time.style.opacity='0.7'; time.innerText = m.createdAt;
    d.appendChild(time); messagesEl.appendChild(d);
  }); messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sendMessage(){
  const me = getSession(); if(!me){ openAuthModal(); return; }
  const other = activeConversation; if(!other) { toast('Seleciona conversa'); return; }
  const text = msgInput.value.trim(); if(!text) return;
  const msgs = getMessages(); msgs.push({ id: uid(), fromId: me.id, toId: other, text, createdAt: now(), read:false }); setMessages(msgs);
  msgInput.value=''; renderMessagesFor(other); renderConversations();
}

/* ---------- Reels open ---------- */
function openReel(id){
  const reels = getReels(); const r = reels.find(x=>x.id===id); if(!r) return;
  toast('Abrindo: '+r.title);
  // simple: create a post from reel preview
  const me = getSession();
}

/* ---------- Profile / settings ---------- */
async function saveProfile(){
  const s = getSession(); if(!s) { openAuthModal(); return; }
  const users = getUsers(); const u = users.find(x=>x.id===s.id);
  u.name = inputName.value.trim() || u.name;
  const emailPhone = inputEmailPhone.value.trim();
  if(emailPhone.includes('@')) u.email = emailPhone; else u.phone = emailPhone;
  u.bio = inputBio.value.trim();
  if(inputAvatarFile.files?.[0]) u.avatar = await fileToDataUrl(inputAvatarFile.files[0]);
  saveUsers(users); setSession({ id:u.id }); toast('Perfil salvo'); closeProfileModal(); renderFeed();
}

/* request badge / monetization */
function requestBadge(){
  const me = getSession(); if(!me){ openAuthModal(); return; }
  const reqs = getRequests(); reqs.push({ id: uid(), userId: me.id, type:'badge', status:'pending', createdAt: now() }); setRequests(reqs);
  toast('Pedido de selo azul enviado');
}
function toggleMonetizeSetting(){
  const s = getSettings(); s.monet = !s.monet; setSettings(s);
  toast('Monetização ' + (s.monet? 'ativada' : 'desativada'));
}

/* ---------- Support ---------- */
function sendSupport(){
  const txt = supportText.value.trim(); if(!txt) return toast('Escreve o problema');
  // save as a request
  const reqs = getRequests(); reqs.push({ id: uid(), type:'support', text: txt, createdAt: now() }); setRequests(reqs);
  supportText.value=''; toast('Suporte enviado'); closeSupportModal();
}

/* ---------- UI open/close helpers ---------- */
function openAuthModal(){ authModal.classList.remove('hidden'); loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); }
function closeAuthModal(){ authModal.classList.add('hidden'); }
function openNewPostModal(){ modalNewPost.classList.remove('hidden'); }
function closeNewPostModal(){ modalNewPost.classList.add('hidden'); }
function openProfileModal(){ modalProfile.classList.remove('hidden'); }
function closeProfileModal(){ modalProfile.classList.add('hidden'); }
function openChatPanel(){ chatPanel.classList.remove('hidden'); renderConversations(); }
function closeChatPanel(){ chatPanel.classList.add('hidden'); }
function openSupportModal(){ supportModal.classList.remove('hidden'); }
function closeSupportModal(){ supportModal.classList.add('hidden'); }

/* ---------- Update UI ---------- */
function updateUI(){
  const s = getSession(); const users = getUsers();
  if(s){
    const me = users.find(u=>u.id===s.id);
    profileNameEl.innerText = me.name; profileEmailEl.innerText = me.email || me.phone || '';
    profileAvatarEl.innerHTML = me.avatar ? `<img src="${me.avatar}" style="width:84px;height:84px;border-radius:50%"/>` : (me.name[0]||'U');
    profileAvatarEditor.innerHTML = profileAvatarEl.innerHTML;
    userQuickEl.innerText = me.name;
    document.getElementById('btnLogout').classList.remove('hidden');
  } else {
    profileNameEl.innerText = 'Visitante'; profileEmailEl.innerText=''; profileAvatarEl.innerHTML='U';
    userQuickEl.innerText = 'Visitante'; document.getElementById('btnLogout').classList.add('hidden');
  }
  // settings checkbox
  toggleMonet.checked = getSettings().monet;
  // render feed/reels
  renderReels(); renderFeed();
}

/* ---------- Events binding ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderReels(); renderFeed(); updateUI();
});

/* Header buttons */
btnNewPost.addEventListener('click', ()=> {
  const s = getSession(); if(!s) { openAuthModal(); return; }
  openNewPostModal();
});
document.getElementById('btnReels').addEventListener('click', ()=> {
  window.scrollTo({top:0,behavior:'smooth'}); toast('Rolando aos reels');
});
btnChatOpen.addEventListener('click', ()=> {
  const s = getSession(); if(!s) { openAuthModal(); return; }
  openChatPanel();
});
btnProfile.addEventListener('click', ()=> {
  const s = getSession(); if(!s) { openAuthModal(); return; }
  openProfileModal();
});
document.getElementById('btnHelp').addEventListener('click', ()=> openSupportModal());

/* new post modal */
document.getElementById('closeNewPost').addEventListener('click', ()=> closeNewPostModal());
publishPostBtn.addEventListener('click', ()=> createPost());
document.getElementById('closeProfileBtn').addEventListener('click', ()=> closeProfileModal());
document.getElementById('saveProfileBtn').addEventListener('click', ()=> saveProfile());

/* auth */
btnSwitchToRegister.addEventListener('click', ()=> { loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); authTitle.innerText='Registar'; });
btnSwitchToLogin.addEventListener('click', ()=> { registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); authTitle.innerText='Entrar'; });
closeAuth.addEventListener('click', ()=> closeAuthModal());
document.getElementById('btnRegister').addEventListener('click', ()=> registerUser());
document.getElementById('btnLogin').addEventListener('click', ()=> loginUser());
document.getElementById('btnLogout').addEventListener('click', ()=> { storage.set('ylo_session', null); updateUI(); toast('Saíste'); });

/* chat */
chatClose.addEventListener('click', ()=> closeChatPanel());
msgSendBtn.addEventListener('click', ()=> sendMessage());
msgInput.addEventListener('keydown', (e)=> { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

/* support */
document.getElementById('sendSupport').addEventListener('click', ()=> sendSupport());
document.getElementById('closeSupport').addEventListener('click', ()=> closeSupportModal());

/* other small bindings */
document.getElementById('btnRequestBadge').addEventListener('click', ()=> requestBadge());
toggleMonet.addEventListener('change', ()=> toggleMonetizeSetting());
document.getElementById('btnNewPost').addEventListener('click', ()=> openNewPostModal());

/* search */
searchInput.addEventListener('input', (e)=> renderFeed(e.target.value));

/* attachments: register avatar preview */
regAvatarFile?.addEventListener && regAvatarFile.addEventListener('change', async function(){
  if(this.files?.[0]) {
    const data = await fileToDataUrl(this.files[0]);
    // preview not required, but we store on register.
  }
});

/* support send button */
sendSupportBtn?.addEventListener && sendSupportBtn.addEventListener('click', ()=> sendSupport());

/* share via hash open */
window.addEventListener('hashchange', ()=> {
  const h = location.hash.replace('#','');
  if(h.startsWith('post=')){
    const id = h.split('=')[1];
    const el = [...document.querySelectorAll('.post')].find(x=> x.querySelector(`.like-btn[data-id="${id}"]`));
    if(el) el.scrollIntoView({behavior:'smooth'});
  }
});

/* open profile modal from right panel button */
document.getElementById('btnProfile').addEventListener('click', ()=> {
  const s = getSession(); if(!s) { openAuthModal(); return; }
  const users = getUsers(); const me = users.find(u=>u.id===s.id);
  inputName.value = me.name; inputEmailPhone.value = me.email || me.phone || '';
  inputBio.value = me.bio || ''; profileAvatarEditor.innerHTML = me.avatar? `<img src="${me.avatar}" style="width:84px;height:84px;border-radius:50%"/>` : me.name[0];
  openProfileModal();
});

/* finalize UI first-time: ensure demo user session not logged */
updateUI();
