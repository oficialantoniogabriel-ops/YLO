/* YLO — script.js (demo local) */
/* Storage keys: y_users, y_session, y_posts, y_likes, y_comments, y_settings */
const LS = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){return null} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};
function ensure(){
  if(!LS.get('y_users')) LS.set('y_users', [
    // founder default user (you) — verified
    { id: 'u_founder', name: 'António Ndala', identifier:'founder@ylo.local', avatar:null, bio:'Fundador da YLO', followers:12000, verified:true, founder:true }
  ]);
  if(!LS.get('y_session')) LS.set('y_session', null);
  if(!LS.get('y_posts')) LS.set('y_posts', [
    { id:'p_demo', userId:'u_founder', text:'Bem-vindo ao YLO! Rede social demo.', media:null, createdAt:new Date().toLocaleString() }
  ]);
  if(!LS.get('y_likes')) LS.set('y_likes', []);
  if(!LS.get('y_comments')) LS.set('y_comments', []);
  if(!LS.get('y_settings')) LS.set('y_settings', { monetized:[], verifiedRequests:[] });
}
ensure();

/* Helpers */
const uid = ()=> Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const now = ()=> new Date().toLocaleString();
function findUser(id){ return (LS.get('y_users')||[]).find(u=>u.id===id) || null; }
function currentUser(){ return LS.get('y_session'); }

/* DOM */
const composer = document.getElementById('composer');
const btnPost = document.getElementById('btn-post');
const postText = document.getElementById('post-text');
const postFile = document.getElementById('post-file');
const feedEl = document.getElementById('feed');
const topProfile = document.getElementById('top-profile');
const btnLoginTop = document.getElementById('btn-login-top');
const btnRegisterTop = document.getElementById('btn-register-top');
const miniName = document.getElementById('mini-name');
const miniFollowers = document.getElementById('mini-followers');
const miniAvatar = document.getElementById('mini-avatar');
const btnRequestMonet = document.getElementById('btn-request-monet');
const btnOpenSupport = document.getElementById('btn-open-support');
const globalSearch = document.getElementById('global-search');

/* UI updates */
function renderAll(){
  // session / header
  const session = currentUser();
  if(session){
    const me = findUser(session.id);
    if(me){
      // show composer
      composer?.removeAttribute('hidden');
      topProfile.textContent = me.name[0] || 'U';
      btnLoginTop?.classList?.add('hidden');
      btnRegisterTop?.classList?.add('hidden');
      miniName && (miniName.textContent = me.name);
      miniFollowers && (miniFollowers.textContent = `${me.followers || 0} seguidores`);
      miniAvatar && (miniAvatar.innerHTML = me.avatar? `<img src="${me.avatar}" style="width:64px;height:64px;border-radius:50%;object-fit:cover">` : (me.name[0]||'U'));
    }
  } else {
    composer?.setAttribute('hidden','');
    topProfile.textContent = 'U';
    btnLoginTop?.classList?.remove('hidden');
    btnRegisterTop?.classList?.remove('hidden');
    miniName && (miniName.textContent = 'Visitante');
    miniFollowers && (miniFollowers.textContent = 'Faça login');
    miniAvatar && (miniAvatar.innerHTML = 'U');
  }
  renderFeed();
}
function renderFeed(){
  const posts = LS.get('y_posts')||[];
  const users = LS.get('y_users')||[];
  const likes = LS.get('y_likes')||[];
  const comments = LS.get('y_comments')||[];
  feedEl.innerHTML = '';
  posts.forEach(p=>{
    const u = users.find(x=>x.id===p.userId) || {name:'Usuário', avatar:null, verified:false};
    const likeCount = likes.filter(l=>l.postId===p.id).length;
    const myLike = currentUser() ? likes.some(l=>l.postId===p.id && l.userId===currentUser().id) : false;
    const div = document.createElement('div'); div.className='post card';
    div.innerHTML = `
      <div class="meta"><div class="avatar" style="width:44px;height:44px">${u.avatar? `<img src="${u.avatar}" style="width:44px;height:44px;border-radius:50%"/>` : (u.name[0]||'U')}</div>
      <div style="flex:1"><div style="font-weight:700">${u.name} ${u.verified?'<span class="badge-blue">✔</span>':''}</div>
      <div class="muted">${p.createdAt}</div></div></div>
      <div class="content" style="margin-top:8px">${escapeHtml(p.text||'')}</div>
      ${p.media? `<div style="margin-top:8px">${p.media.startsWith('data:video')? `<video controls src="${p.media}" style="width:100%;border-radius:8px"></video>` : `<img src="${p.media}" style="width:100%;border-radius:8px"/>`}</div>` : ''}
      <div class="post-actions" style="margin-top:8px;display:flex;gap:8px">
        <button class="btn small" data-action="like" data-id="${p.id}">${myLike? 'Descurtir' : '❤ Curtir'} (${likeCount})</button>
        <button class="btn small" data-action="comment" data-id="${p.id}">💬 Comentários</button>
        <button class="btn small" data-action="share" data-id="${p.id}">🔗 Partilhar</button>
      </div>
      <div id="comments-${p.id}" class="comments-area" style="margin-top:8px;"></div>
    `;
    feedEl.appendChild(div);

    // fill comments area
    const cArea = div.querySelector(`#comments-${p.id}`);
    comments.filter(c=>c.postId===p.id).forEach(c=>{
      const cu = users.find(x=>x.id===c.userId) || {name:'U'};
      const item = document.createElement('div');
      item.style.padding='8px 6px'; item.style.borderTop='1px solid #f1f5f9';
      item.innerHTML = `<strong>${cu.name}</strong> <div class="muted" style="font-size:12px">${c.at}</div><div style="margin-top:6px">${escapeHtml(c.text)}</div>`;
      cArea.appendChild(item);
    });

    // events
    div.querySelectorAll('button[data-action]').forEach(b=>{
      b.addEventListener('click', async (ev)=>{
        const act = b.dataset.action; const id = b.dataset.id;
        if(act==='like') toggleLike(id);
        if(act==='comment'){
          const txt = prompt('Escreve um comentário:');
          if(txt) addComment(id, txt);
        }
        if(act==='share'){
          navigator.clipboard?.writeText(location.href + '?share=' + id).then(()=> alert('Link copiado'), ()=> alert('Link: ' + (location.href + '?share=' + id)));
        }
      });
    });
  });
}

/* interactions */
function toggleLike(postId){
  const session = currentUser();
  if(!session) return location.href='login.html';
  const likes = LS.get('y_likes')||[];
  const ex = likes.find(l=>l.postId===postId && l.userId===session.id);
  if(ex) LS.set('y_likes', likes.filter(l=>!(l.postId===postId && l.userId===session.id)));
  else { likes.push({ id: uid(), postId, userId: session.id, at: now() }); LS.set('y_likes', likes); }
  renderAll();
}
function addComment(postId, text){
  const session = currentUser();
  if(!session) return location.href='login.html';
  const comments = LS.get('y_comments')||[];
  comments.push({ id: uid(), postId, userId: session.id, text: text.trim(), at: now() });
  LS.set('y_comments', comments); renderAll();
}

/* posting */
async function toDataUrl(file){
  return await new Promise(res=>{
    const r = new FileReader();
    r.onload = ()=> res(r.result);
    r.readAsDataURL(file);
  });
}
btnPost?.addEventListener('click', async ()=>{
  const session = currentUser(); if(!session) return location.href='login.html';
  const text = postText.value.trim();
  const file = postFile.files?.[0];
  if(!text && !file) return alert('Adiciona texto ou imagem.');
  let media = null;
  if(file) media = await toDataUrl(file);
  const posts = LS.get('y_posts')||[];
  posts.unshift({ id: uid(), userId: session.id, text, media, createdAt: now() });
  LS.set('y_posts', posts);
  postText.value=''; postFile.value=''; renderAll();
});

/* auth: login/register (works on login.html / register.html) */
document.addEventListener('DOMContentLoaded', ()=>{
  // login page actions
  const loginBtn = document.getElementById('btn-login');
  if(loginBtn){
    loginBtn.addEventListener('click', ()=>{
      const idv = document.getElementById('login-identifier').value.trim();
      if(!idv) return alert('Coloca email ou número.');
      const users = LS.get('y_users')||[];
      const u = users.find(u=>u.identifier===idv || u.email===idv || u.phone===idv);
      if(!u) return alert('Usuário não encontrado. Regista-te.');
      LS.set('y_session', { id: u.id });
      alert('Login OK (demo).'); location.href='index.html';
    });
  }
  // register page
  const regBtn = document.getElementById('btn-register');
  if(regBtn){
    regBtn.addEventListener('click', async ()=>{
      const name = document.getElementById('reg-name').value.trim();
      const idv = document.getElementById('reg-identifier').value.trim();
      const pass = document.getElementById('reg-password').value;
      if(!name || !idv || pass.length < 4) return alert('Preenche nome, identificador e senha (min 4).');
      const users = LS.get('y_users')||[];
      if(users.find(u=>u.identifier===idv || u.email===idv)) return alert('Identificador já existe.');
      let avatar = null;
      const file = document.getElementById('reg-avatar')?.files?.[0];
      if(file) avatar = await toDataUrl(file);
      const newU = { id: uid(), name, identifier: idv, avatar, bio:'', followers:0, verified:false };
      users.push(newU); LS.set('y_users', users);
      LS.set('y_session', { id: newU.id });
      alert('Conta criada. Bem-vindo!'); location.href='index.html';
    });
  }

  // profile page populators
  if(document.getElementById('profile-username')){
    const s = currentUser();
    if(!s) return location.href='login.html';
    const me = findUser(s.id);
    document.getElementById('profile-username').textContent = me.name;
    document.getElementById('profile-bio').textContent = me.bio || '';
    document.getElementById('profile-avatar-large').innerHTML = me.avatar? `<img src="${me.avatar}" style="width:84px;height:84px;border-radius:50%"/>` : (me.name[0]||'U');
    const posts = (LS.get('y_posts')||[]).filter(p=>p.userId===me.id);
    const stats = `${posts.length} posts • ${me.followers} seguidores`;
    document.getElementById('profile-stats').textContent = stats;
    const pcontainer = document.getElementById('profile-posts');
    pcontainer.innerHTML = posts.map(p=>`<div class="post card" style="margin-bottom:8px"><div class="muted">${p.createdAt}</div><div>${escapeHtml(p.text)}</div></div>`).join('');
  }

  // header search on any page
  const gs = document.getElementById('global-search');
  if(gs) gs.addEventListener('keydown', (e)=>{
    if(e.key==='Enter') doSearch(gs.value.trim());
  });

  // support button
  const sbtn = document.getElementById('btn-open-support');
  if(sbtn) sbtn.addEventListener('click', ()=> { const t = prompt('Descreve o problema:'); if(t){ const tickets = LS.get('y_support')||[]; tickets.push({ id: uid(), text: t, at: now() }); LS.set('y_support', tickets); alert('Ticket criado (demo).'); } });

  // monetization request
  btnRequestMonet?.addEventListener('click', ()=>{
    const s = currentUser(); if(!s) return location.href='login.html';
    const me = findUser(s.id);
    if((me.followers||0) < 5000) return alert('Monetização disponível apenas a partir de 5.000 seguidores.');
    const settings = LS.get('y_settings'); settings.monetized.push({ userId: me.id, at: now(), status:'pending' }); LS.set('y_settings', settings);
    alert('Pedido de monetização enviado.');
  });

  // render initial
  renderAll();
});

/* search */
function doSearch(q){
  if(!q) return alert('Escreve algo para pesquisar.');
  const users = LS.get('y_users')||[];
  const posts = LS.get('y_posts')||[];
  const uu = users.filter(u=>u.name.toLowerCase().includes(q.toLowerCase()) || (u.identifier||'').toLowerCase().includes(q.toLowerCase()));
  const pp = posts.filter(p=> (p.text||'').toLowerCase().includes(q.toLowerCase()));
  let out = '';
  if(uu.length) out += '<h4>Usuários</h4>' + uu.map(u=>`<div style="padding:6px 0"><strong>${u.name}</strong> <span class="muted">${u.identifier}</span></div>`).join('');
  if(pp.length) out += '<h4>Posts</h4>' + pp.map(p=>{
    const u = findUser(p.userId) || {name:'U'}; return `<div style="padding:6px 0"><strong>${u.name}</strong>: ${escapeHtml(p.text)}</div>`;
  }).join('');
  if(!out) out = '<div class="muted">Nada encontrado</div>';
  // open results
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Resultados</title><link rel="stylesheet" href="style.css"></head><body style="padding:16px"><h3>Pesquisa: ${escapeHtml(q)}</h3>${out}<p><a href="index.html">Voltar</a></p></body></html>`);
}

/* util */
function escapeHtml(s){ return (s||'').toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
