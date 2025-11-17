/* YLO — app.js (local-first) */
const LS = {
  get(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};
function ensure(){
  if(!LS.get('y_users')) LS.set('y_users', [
    // fundador demo
    {id:'u_founder', username:'António Ndala', email:'founder@ylo.local', phone:null, avatar:null, bio:'Fundador da YLO', followers:5200, verified:true, role:'founder'}
  ]);
  if(!LS.get('y_session')) LS.set('y_session', null);
  if(!LS.get('y_posts')) LS.set('y_posts', [
    {id:'p_demo', userId:'u_founder', text:'Bem-vindo ao YLO! Aqui podes partilhar o teu mundo.', media:null, createdAt:new Date().toLocaleString(), likes:5, shares:1, comments:[]}
  ]);
  if(!LS.get('y_reels')) LS.set('y_reels', [
    {id:'r1', type:'img', src:'https://picsum.photos/seed/1/600/400', title:'Pôr do sol'},
    {id:'r2', type:'img', src:'https://picsum.photos/seed/2/600/400', title:'Cidade'}
  ]);
  if(!LS.get('y_messages')) LS.set('y_messages', []);
  if(!LS.get('y_ads')) LS.set('y_ads', [{id:'ad1', content:'Anuncie no YLO — contacto@example.com'}]);
  if(!LS.get('y_settings')) LS.set('y_settings', {monetizeEnabled:false, monetizeThreshold:5000});
}
ensure();

/* DOM refs */
const refs = {
  loginBtn: document.getElementById('btn-login'),
  logoutBtn: document.getElementById('btn-logout'),
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.getElementById('modal-close'),
  composer: document.getElementById('composer'),
  postText: document.getElementById('post-text'),
  postMedia: document.getElementById('post-media'),
  btnPublish: document.getElementById('btn-publish'),
  feed: document.getElementById('feed'),
  miniAvatar: document.getElementById('mini-avatar'),
  miniUsername: document.getElementById('mini-username'),
  miniFollowers: document.getElementById('mini-followers'),
  btnEdit: document.getElementById('btn-edit'),
  btnSupport: document.getElementById('btn-support'),
  searchInput: document.getElementById('global-search'),
  adsCard: document.getElementById('ads-card'),
  yearSpan: document.getElementById('year')
};

/* nav buttons */
document.getElementById('nav-home').addEventListener('click', ()=>showScreen('home'));
document.getElementById('nav-reels').addEventListener('click', ()=>showScreen('reels'));
document.getElementById('nav-activity').addEventListener('click', ()=>showScreen('activity'));
document.getElementById('nav-monet').addEventListener('click', ()=>showScreen('monet'));
document.getElementById('nav-profile').addEventListener('click', ()=>openProfileLocal());

/* topbar buttons */
refs.loginBtn.addEventListener('click', ()=>showAuth());
refs.logoutBtn.addEventListener('click', ()=>{LS.set('y_session', null); renderAll();});

/* modal close */
document.getElementById('modal-close').addEventListener('click', ()=>{refs.modal.classList.add('hidden'); refs.modalBody.innerHTML='';});

/* show screen */
function showScreen(name){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.nav-btn')).find(x=>x.textContent.trim().toLowerCase().startsWith(name));
  if(btn) btn.classList.add('active');
  // simple logic: if name home show feed
  if(name==='home') renderFeed();
  if(name==='reels') renderReels();
  if(name==='monet') showMonet();
}

/* Auth */
function showAuth(){
  refs.modal.classList.remove('hidden');
  refs.modalBody.innerHTML = `
    <h3>Entrar / Registar</h3>
    <input id="auth-id" placeholder="Email ou +244..." />
    <input id="auth-pass" placeholder="Senha (demo não valida)" />
    <input id="auth-name" placeholder="Nome (apenas para registo)" />
    <div style="margin-top:8px"><button id="do-register" class="btn primary">Registar</button> <button id="do-login" class="btn">Entrar</button></div>
    <div class="muted" style="margin-top:8px">Login local: apenas demo (sem senha real).</div>
  `;
  document.getElementById('do-register').addEventListener('click', ()=>{
    const id = document.getElementById('auth-id').value.trim();
    const name = document.getElementById('auth-name').value.trim() || id.split('@')[0];
    if(!id) return alert('Coloca email ou telefone');
    const users = LS.get('y_users')||[];
    if(users.find(u=>u.email===id || u.phone===id)) return alert('Já existe user');
    const u = {id:'u_'+Date.now().toString(36), username:name, email: id.includes('@')?id:null, phone: id.includes('@')?null:id, avatar:null, bio:'', followers:0, verified:false, role:'user'};
    users.push(u); LS.set('y_users', users); LS.set('y_session', {id:u.id}); refs.modal.classList.add('hidden'); renderAll();
  });
  document.getElementById('do-login').addEventListener('click', ()=>{
    const id = document.getElementById('auth-id').value.trim();
    const users = LS.get('y_users')||[]; const u = users.find(x=>x.email===id||x.phone===id);
    if(!u) return alert('Usuário não encontrado. Regista-te.');
    LS.set('y_session', {id:u.id}); refs.modal.classList.add('hidden'); renderAll();
  });
}

/* Profile open (local page) */
function openProfileLocal(){
  const s = LS.get('y_session');
  if(!s) return showAuth();
  const users = LS.get('y_users')||[]; const me = users.find(u=>u.id===s.id);
  refs.modal.classList.remove('hidden');
  refs.modalBody.innerHTML = `
    <h3>Meu Perfil</h3>
    <div style="display:flex;gap:12px;align-items:center">
      <div style="width:80px;height:80px;border-radius:12px;background:#eee">${me.avatar?'<img src="'+me.avatar+'" style="width:80px;height:80px;border-radius:12px"/>':me.username[0]}</div>
      <div>
        <div style="font-weight:700">${me.username} ${me.verified?'<span style="color:#0ea5a4">✔</span>':''}</div>
        <div class="muted">${me.followers} seguidores</div>
      </div>
    </div>
    <div style="margin-top:8px">
      <input id="prof-username" value="${me.username}" />
      <input id="prof-bio" value="${me.bio||''}" />
      <input id="prof-avatar" type="file" />
      <div style="margin-top:8px"><button id="prof-save" class="btn primary">Salvar</button> <button id="prof-verify" class="btn">Pedir selo azul</button></div>
    </div>
  `;
  document.getElementById('prof-save').addEventListener('click', async ()=>{
    const users = LS.get('y_users'); const mm = users.find(x=>x.id===me.id);
    mm.username = document.getElementById('prof-username').value.trim()||mm.username;
    mm.bio = document.getElementById('prof-bio').value.trim();
    if(document.getElementById('prof-avatar').files?.[0]){
      mm.avatar = await toDataURL(document.getElementById('prof-avatar').files[0]);
    }
    LS.set('y_users', users); alert('Perfil salvo'); refs.modal.classList.add('hidden'); renderAll();
  });
  document.getElementById('prof-verify').addEventListener('click', ()=>{
    const settings = LS.get('y_settings'); const reqs = settings.verifiedRequests||[];
    reqs.push({id:'vr_'+Date.now().toString(36), userId:me.id, date:new Date().toLocaleString(), status:'pending'});
    settings.verifiedRequests = reqs; LS.set('y_settings', settings); alert('Pedido enviado (simulado).'); refs.modal.classList.add('hidden');
  });
}

/* helper: file -> dataURL */
function toDataURL(file){ return new Promise(res=>{
  const r = new FileReader(); r.onload = ()=>res(r.result); r.readAsDataURL(file);
});}

/* Publish post */
document.getElementById('btn-publish').addEventListener('click', async ()=>{
  const s = LS.get('y_session'); if(!s) return showAuth();
  const text = document.getElementById('post-text').value.trim();
  const file = document.getElementById('post-media').files?.[0];
  if(!text && !file) return alert('Escreve algo ou escolhe media');
  let media = null; if(file) media = await toDataURL(file);
  const posts = LS.get('y_posts')||[]; posts.unshift({id:'p_'+Date.now().toString(36), userId:s.id, text, media, createdAt:new Date().toLocaleString(), likes:0, shares:0, comments:[]});
  LS.set('y_posts', posts); document.getElementById('post-text').value=''; document.getElementById('post-media').value=''; renderAll();
});

/* render feed */
function renderFeed(){
  const posts = LS.get('y_posts')||[]; const users = LS.get('y_users')||[];
  refs.feed.innerHTML=''; posts.forEach(p=>{
    const u = users.find(x=>x.id===p.userId) || {username:'Usuário', avatar:null};
    const el = document.createElement('div'); el.className='post card';
    el.innerHTML = `
      <div class="meta"><div class="avatar">${u.avatar?'<img src="'+u.avatar+'" style="width:56px;height:56px;border-radius:50%"/>':u.username[0]}</div>
      <div style="flex:1"><div style="font-weight:700">${u.username} ${u.verified?'<span style="color:#0ea5a4">✔</span>':''}</div><div class="muted">${p.createdAt}</div></div></div>
      <div class="content">${escapeHtml(p.text||'')}</div>
      ${p.media? (p.media.startsWith('data:video')?'<video controls src="'+p.media+'"></video>':'<img src="'+p.media+'"/>') : ''}
      <div class="post-actions">
        <button class="btn small" data-id="${p.id}" onclick="toggleLike('${p.id}')">❤ ${p.likes}</button>
        <button class="btn small" onclick="openComments('${p.id}')">💬 ${p.comments.length}</button>
        <button class="btn small" onclick="sharePost('${p.id}')">🔗 Partilhar</button>
      </div>
    `;
    refs.feed.appendChild(el);
  });
}

/* like */
window.toggleLike = function(postId){
  const s = LS.get('y_session'); if(!s) return showAuth();
  const posts = LS.get('y_posts')||[]; const p = posts.find(x=>x.id===postId); if(!p) return;
  p.likes = (p.likes||0)+1; LS.set('y_posts', posts); renderAll();
}

/* comments popup */
window.openComments = function(postId){
  refs.modal.classList.remove('hidden');
  refs.modalBody.innerHTML = `<h3>Comentários</h3><div id="cm-list"></div><input id="cm-input" placeholder="Escreve..." /><button id="cm-send" class="btn">Enviar</button>`;
  const posts = LS.get('y_posts')||[]; const p = posts.find(x=>x.id===postId);
  function refresh(){ document.getElementById('cm-list').innerHTML = p.comments.map(c=>`<div><strong>${(LS.get('y_users')||[]).find(u=>u.id===c.userId)?.username}</strong>: ${escapeHtml(c.text)}</div>`).join(''); }
  refresh();
  document.getElementById('cm-send').addEventListener('click', ()=>{
    const s = LS.get('y_session'); if(!s) return showAuth();
    const t = document.getElementById('cm-input').value.trim(); if(!t) return;
    p.comments.push({id:'c_'+Date.now().toString(36), userId:s.id, text:t, at:new Date().toLocaleString()}); LS.set('y_posts', posts); refresh(); renderAll();
  });
}

/* share */
window.sharePost = function(postId){
  const url = location.origin + location.pathname + '?share=' + postId;
  navigator.clipboard?.writeText(url).then(()=> alert('Link copiado: '+url), ()=> alert('Link: '+url));
}

/* reels */
let reelIndex = 0;
function renderReels(){
  const reels = LS.get('y_reels')||[]; const el = document.getElementById('reel-thumb'); el.innerHTML='';
  if(!reels.length) return el.innerHTML='<div class="muted">Sem reels</div>';
  const r = reels[reelIndex % reels.length];
  if(r.type==='img') el.innerHTML = `<img src="${r.src}" style="width:100%;border-radius:8px"/>`;
  else el.innerHTML = `<video src="${r.src}" controls style="width:100%"></video>`;
}
document.getElementById('reel-next').addEventListener('click', ()=>{reelIndex++; renderReels();});
document.getElementById('reel-prev').addEventListener('click', ()=>{reelIndex=Math.max(0,reelIndex-1); renderReels();});

/* search */
refs.searchInput.addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase(); if(!q){renderAll(); return;}
  const users = (LS.get('y_users')||[]).filter(u=>u.username.toLowerCase().includes(q));
  const posts = (LS.get('y_posts')||[]).filter(p=>p.text?.toLowerCase().includes(q));
  refs.feed.innerHTML = '';
  users.forEach(u=>{refs.feed.innerHTML += `<div class="card"><strong>${u.username}</strong> <div class="muted">${u.followers} seguidores</div></div>`});
  posts.forEach(p=>{refs.feed.innerHTML += `<div class="card"><div class="muted">${p.createdAt}</div><div>${escapeHtml(p.text)}</div></div>`});
});

/* support */
refs.btnSupport.addEventListener('click', ()=>{refs.modal.classList.remove('hidden'); refs.modalBody.innerHTML=`<h3>Suporte</h3><textarea id="sup-txt" style="width:100%;height:120px"></textarea><div style="margin-top:8px"><button id="sup-send" class="btn primary">Enviar</button></div>`; document.getElementById('sup-send').addEventListener('click', ()=>{const t=document.getElementById('sup-txt').value.trim(); if(!t) return alert('Escreve'); const tickets=LS.get('y_support')||[]; tickets.push({id:'tk_'+Date.now().toString(36), text:t, at:new Date().toLocaleString()}); LS.set('y_support', tickets); alert('Ticket enviado (local)'); refs.modal.classList.add('hidden');});});

/* monetization screen */
function showMonet(){
  refs.modal.classList.remove('hidden');
  const s = LS.get('y_session'); if(!s) return showAuth();
  const users = LS.get('y_users')||[]; const me = users.find(u=>u.id===s.id);
  const settings = LS.get('y_settings')||{};
  refs.modalBody.innerHTML = `<h3>Monetização</h3>
    <div>Requisito: ${settings.monetizeThreshold} seguidores</div>
    <div>Teus seguidores: ${me.followers}</div>
    <div style="margin-top:8px">
      ${me.followers >= settings.monetizeThreshold ? '<button id="mon-enable" class="btn primary">Ativar Monetização</button>' : '<div class="muted">Apenas disponível com seguidores suficientes.</div>'}
    </div>`;
  if(me.followers >= settings.monetizeThreshold) document.getElementById('mon-enable').addEventListener('click', ()=>{settings.monetizeEnabled=true; LS.set('y_settings', settings); alert('Monetização ativada (simulada)'); refs.modal.classList.add('hidden');});
}

/* helpers */
function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function renderMini(){
  const s = LS.get('y_session'); const users=LS.get('y_users')||[]; const me = s? users.find(u=>u.id===s.id):null;
  refs.miniAvatar.innerHTML = me? (me.avatar? `<img src="${me.avatar}" style="width:72px;height:72px;border-radius:12px"/>` : me.username[0]) : 'U';
  refs.miniUsername.textContent = me? me.username : 'Visitante';
  refs.miniFollowers.textContent = me? me.followers + ' seguidores' : 'Faça login';
  if(me){refs.btnEdit.classList.remove('hidden'); refs.btnFollow.classList.remove('hidden'); refs.btnEdit.onclick = ()=>openProfileLocal();} else {refs.btnEdit.classList.add('hidden'); refs.btnFollow.classList.add('hidden');}
}

function renderAds(){
  const ads = LS.get('y_ads')||[]; refs.adsCard.querySelector('.ads-body').textContent = ads[0]?.content || 'Anúncios aqui';
}

function renderAll(){
  renderFeed(); renderReels(); renderMini(); renderAds();
  const s = LS.get('y_session'); if(s){refs.loginBtn.classList.add('hidden'); refs.logoutBtn.classList.remove('hidden'); refs.composer.classList.remove('hidden')} else {refs.loginBtn.classList.remove('hidden'); refs.logoutBtn.classList.add('hidden'); refs.composer.classList.add('hidden')}
  document.getElementById('year').textContent = new Date().getFullYear();
}
renderAll();
