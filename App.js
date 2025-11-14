/* YLO - Versão 100% local (localStorage)
   - usuários, sessão, posts, imagens (dataURL), likes, comments, follows
   - chave localStorage:
     ylo_users, ylo_session, ylo_posts, ylo_likes, ylo_comments, ylo_follows
*/

/* ---------- Helpers de storage ---------- */
const storage = {
  get(key) { return JSON.parse(localStorage.getItem(key) || "null"); },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

function ensureInit() {
  if (!storage.get("ylo_users")) storage.set("ylo_users", []);
  if (!storage.get("ylo_posts")) storage.set("ylo_posts", []);
  if (!storage.get("ylo_likes")) storage.set("ylo_likes", []);
  if (!storage.get("ylo_comments")) storage.set("ylo_comments", []);
  if (!storage.get("ylo_follows")) storage.set("ylo_follows", []);
  if (!storage.get("ylo_session")) storage.set("ylo_session", null);
}
ensureInit();

/* ---------- Utilidades ---------- */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function now() { return new Date().toLocaleString(); }

/* ---------- Elementos DOM ---------- */
const modal = document.getElementById("modal");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const switchToRegister = document.getElementById("switch-to-register");
const switchToLogin = document.getElementById("switch-to-login");
const modalTitle = document.getElementById("modal-title");
const modalClose = document.getElementById("modal-close");

const navLogin = document.getElementById("nav-login");
const navLogout = document.getElementById("nav-logout");
const navFeed = document.getElementById("nav-feed");
const navProfileBtn = document.getElementById("nav-profile");

const composeBox = document.getElementById("compose");
const composeAvatar = document.getElementById("compose-avatar");
const composeUsername = document.getElementById("compose-username");
const postText = document.getElementById("postText");
const postImageInput = document.getElementById("postImage");
const publishBtn = document.getElementById("publishBtn");

const postsContainer = document.getElementById("posts");
const usersList = document.getElementById("users-list");

const sessionAvatar = document.getElementById("session-avatar");
const sessionUsername = document.getElementById("session-username");
const sessionBio = document.getElementById("session-bio");

const profilePage = document.getElementById("profile-page");
const profileAvatar = document.getElementById("profile-avatar");
const profileUsernameInput = document.getElementById("profile-username");
const profileBioInput = document.getElementById("profile-bio");
const profileAvatarInput = document.getElementById("profile-avatar-input");
const saveProfileBtn = document.getElementById("save-profile");
const profileStats = document.getElementById("profile-stats");
const myPostsContainer = document.getElementById("my-posts");
const closeProfile = document.getElementById("close-profile");

/* Auth inputs */
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const regEmail = document.getElementById("reg-email");
const regPassword = document.getElementById("reg-password");
const regUsername = document.getElementById("reg-username");
const regAvatar = document.getElementById("reg-avatar");
const btnLogin = document.getElementById("btn-login");
const btnRegister = document.getElementById("btn-register");

/* Nav toggles */
function showModal(mode="login") {
  modal.classList.remove("hidden");
  if (mode === "login") {
    modalTitle.innerText = "Entrar";
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    switchToRegister.classList.remove("hidden");
    switchToLogin.classList.add("hidden");
  } else {
    modalTitle.innerText = "Registar";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    switchToRegister.classList.add("hidden");
    switchToLogin.classList.remove("hidden");
  }
}
function closeModal() { modal.classList.add("hidden"); }

/* ---------- Sessão ---------- */
function currentUser() { return storage.get("ylo_session"); }

function setSession(user) {
  storage.set("ylo_session", user);
  updateUIOnAuth();
}

/* ---------- Usuários ---------- */
function getUsers() { return storage.get("ylo_users") || []; }
function saveUsers(list) { storage.set("ylo_users", list); }

async function fileToDataUrl(file) {
  return await new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.readAsDataURL(file);
  });
}

/* REGISTER */
btnRegister?.addEventListener("click", async () => {
  const email = regEmail.value.trim();
  const username = regUsername.value.trim() || email.split("@")[0];
  const password = regPassword.value;
  if (!email || !password) return alert("Precisas de email e senha.");
  const users = getUsers();
  if (users.find(u => u.email === email)) return alert("Email já registado.");

  let avatarData = null;
  if (regAvatar.files?.[0]) avatarData = await fileToDataUrl(regAvatar.files[0]);

  const user = { id: uid(), email, username, password, avatar: avatarData, bio: "" };
  users.push(user);
  saveUsers(users);
  setSession({ id: user.id, email: user.email });
  closeModal();
  regEmail.value = regPassword.value = regUsername.value = "";
  regAvatar.value = "";
  renderAll();
});

/* LOGIN */
btnLogin?.addEventListener("click", () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (!email || !password) return alert("Coloca email e senha.");
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return alert("Credenciais inválidas.");
  setSession({ id: user.id, email: user.email });
  closeModal();
  loginEmail.value = loginPassword.value = "";
  renderAll();
});

/* LOGOUT */
navLogout.addEventListener("click", () => {
  storage.set("ylo_session", null);
  renderAll();
});

/* SWITCH AUTH */
switchToRegister.addEventListener("click", () => showModal("register"));
switchToLogin.addEventListener("click", () => showModal("login"));
modalClose.addEventListener("click", closeModal);
navLogin.addEventListener("click", () => showModal("login"));

/* NAV */
navFeed.addEventListener("click", () => {
  document.getElementById("feed-section").scrollIntoView({behavior:"smooth"});
  navFeed.classList.add("active"); navProfileBtn.classList.remove("active");
  profilePage.classList.add("hidden");
});
navProfileBtn.addEventListener("click", () => {
  const user = currentUser();
  if (!user) { showModal("login"); return; }
  openProfile();
});

/* ---------- Postagem ---------- */
publishBtn.addEventListener("click", async () => {
  const user = currentUser();
  if (!user) { showModal("login"); return; }
  const text = postText.value.trim();
  const file = postImageInput.files?.[0];

  if (!text && !file) return alert("Adiciona texto ou imagem.");

  let imgData = null;
  if (file) imgData = await fileToDataUrl(file);

  const posts = storage.get("ylo_posts") || [];
  const newPost = {
    id: uid(),
    userId: user.id,
    text,
    image: imgData,
    createdAt: now()
  };
  posts.unshift(newPost);
  storage.set("ylo_posts", posts);
  postText.value = "";
  postImageInput.value = "";
  renderAll();
});

/* ---------- Like / Comments / Follows helpers ---------- */
function getPosts() { return storage.get("ylo_posts") || []; }
function getLikes() { return storage.get("ylo_likes") || []; }
function getComments() { return storage.get("ylo_comments") || []; }
function getFollows() { return storage.get("ylo_follows") || []; }

function toggleLike(postId) {
  const user = currentUser();
  if (!user) { showModal("login"); return; }
  let likes = getLikes();
  const exists = likes.find(l => l.postId === postId && l.userId === user.id);
  if (exists) likes = likes.filter(l => !(l.postId === postId && l.userId === user.id));
  else likes.push({ id: uid(), postId, userId: user.id, createdAt: now() });
  storage.set("ylo_likes", likes);
  renderAll();
}

function addComment(postId, text) {
  const user = currentUser();
  if (!user) { showModal("login"); return; }
  if (!text?.trim()) return;
  const comments = getComments();
  comments.push({ id: uid(), postId, userId: user.id, text: text.trim(), createdAt: now() });
  storage.set("ylo_comments", comments);
  renderAll();
}

function toggleFollow(targetUserId) {
  const user = currentUser();
  if (!user) { showModal("login"); return; }
  let follows = getFollows();
  const exists = follows.find(f => f.follower === user.id && f.following === targetUserId);
  if (exists) follows = follows.filter(f => !(f.follower === user.id && f.following === targetUserId));
  else follows.push({ id: uid(), follower: user.id, following: targetUserId, createdAt: now() });
  storage.set("ylo_follows", follows);
  renderAll();
}

/* ---------- Profile editing ---------- */
saveProfileBtn.addEventListener("click", async () => {
  const userSession = currentUser();
  if (!userSession) { showModal("login"); return; }
  const users = getUsers();
  const me = users.find(u => u.id === userSession.id);
  if (!me) return alert("Usuário não encontrado.");

  me.username = profileUsernameInput.value.trim() || me.username;
  me.bio = profileBioInput.value.trim() || "";

  if (profileAvatarInput.files?.[0]) {
    me.avatar = await fileToDataUrl(profileAvatarInput.files[0]);
  }

  saveUsers(users);
  alert("Perfil atualizado.");
  renderAll();
});

/* ---------- Rendering ---------- */
function findUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

function renderUsersList() {
  const users = getUsers();
  usersList.innerHTML = "";
  const session = currentUser();
  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "user-item";
    div.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center">
        <div class="avatar" style="width:36px;height:36px;font-size:14px">${u.avatar ? `<img src="${u.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" />` : (u.username?.[0]||'U')}</div>
        <div style="font-weight:700">${u.username}</div>
      </div>
      <div>
        <button class="btn small-btn" data-action="visit" data-id="${u.id}">Visitar</button>
        ${session && session.id !== u.id ? `<button class="btn small-btn" data-action="follow" data-id="${u.id}">Seguir</button>` : ""}
      </div>
    `;
    usersList.appendChild(div);
  });

  // add listeners
  usersList.querySelectorAll("button[data-action]").forEach(btn => {
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    btn.addEventListener("click", () => {
      if (action === "visit") openProfile(id);
      if (action === "follow") toggleFollow(id);
    });
  });
}

function renderPosts() {
  const posts = getPosts();
  const likes = getLikes();
  const comments = getComments();
  postsContainer.innerHTML = "";

  posts.forEach(p => {
    const user = findUserById(p.userId);
    const likeCount = likes.filter(l => l.postId === p.id).length;
    const myLike = currentUser() ? likes.some(l => l.postId === p.id && l.userId === currentUser().id) : false;
    const postEl = document.createElement("div");
    postEl.className = "post card";
    postEl.innerHTML = `
      <div class="post-top">
        <div class="avatar">${user ? (user.avatar ? `<img src="${user.avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" />` : (user.username?.[0]||'U')) : 'U'}</div>
        <div style="flex:1">
          <div class="username">${user ? user.username : "Usuário"}</div>
          <div class="time">${p.createdAt}</div>
        </div>
      </div>
      <div class="text">${p.text || ""}</div>
      ${p.image ? `<img class="post-image" src="${p.image}" />` : ""}
      <div class="post-actions">
        <button class="action-btn like-btn" data-id="${p.id}">${myLike ? "Descurtir" : "Curtir"}</button>
        <div class="action-count">${likeCount} ❤️</div>
        <button class="action-btn comment-toggle" data-id="${p.id}">Comentar</button>
      </div>

      <div class="comments-area" id="comments-${p.id}" style="margin-top:8px;"></div>
    `;

    postsContainer.appendChild(postEl);

    // fill comments
    const cArea = postEl.querySelector(`#comments-${p.id}`);
    const postComments = comments.filter(c => c.postId === p.id);
    postComments.forEach(c => {
      const u = findUserById(c.userId);
      const d = document.createElement("div");
      d.style.padding = "8px 6px"; d.style.borderTop = "1px solid #f1f5f9";
      d.innerHTML = `<strong>${u ? u.username : 'U'}</strong> <span style="color:#6b7280;font-size:12px">${c.createdAt}</span><div style="margin-top:6px">${c.text}</div>`;
      cArea.appendChild(d);
    });

    // comment form
    const cf = document.createElement("div");
    cf.style.marginTop = "8px";
    cf.innerHTML = `
      <input placeholder="Escreve um comentário..." class="comment-input" data-id="${p.id}" style="width:70%;padding:8px;border-radius:8px;border:1px solid #eef2ff" />
      <button class="btn small-btn comment-send" data-id="${p.id}" style="margin-left:8px;padding:8px 10px">Enviar</button>
    `;
    cArea.appendChild(cf);

    // listeners like / comment
    postEl.querySelector(".like-btn").addEventListener("click", () => toggleLike(p.id));
    postEl.querySelector(".comment-send").addEventListener("click", () => {
      const id = postEl.querySelector(".comment-input").dataset.id;
      const text = postEl.querySelector(".comment-input").value;
      addComment(id, text);
    });

    // toggle comment area visibility
    const toggleBtn = postEl.querySelector(".comment-toggle");
    toggleBtn.addEventListener("click", () => {
      cArea.classList.toggle("hidden");
    });
  });
}

/* Render session / right panel / compose visibility */
function updateUIOnAuth() {
  const userSession = currentUser();
  if (userSession) {
    navLogin.classList.add("hidden");
    navLogout.classList.remove("hidden");
    composeBox.classList.remove("hidden");
    // set session info
    const me = findUserById(userSession.id);
    sessionAvatar.innerHTML = me?.avatar ? `<img src="${me.avatar}" style="width:84px;height:84px;border-radius:50%;object-fit:cover" />` : (me?.username?.[0]||"U");
    sessionUsername.innerText = me?.username ?? me?.email;
    sessionBio.innerText = me?.bio || "Atualize seu perfil.";
    composeAvatar.innerHTML = me?.avatar ? `<img src="${me.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" />` : (me?.username?.[0]||"U");
    composeUsername.innerText = me?.username || me?.email;
  } else {
    navLogin.classList.remove("hidden");
    navLogout.classList.add("hidden");
    composeBox.classList.add("hidden");
    sessionAvatar.innerHTML = "U";
    sessionUsername.innerText = "Visitante";
    sessionBio.innerText = "Faça login ou registre-se para participar.";
    composeAvatar.innerHTML = "";
    composeUsername.innerText = "";
  }
}

/* Open profile page (own or other) */
function openProfile(userId = null) {
  const session = currentUser();
  const idToOpen = userId || (session ? session.id : null);
  if (!idToOpen) { showModal("login"); return; }
  const user = findUserById(idToOpen);
  if (!user) return alert("Usuário não encontrado.");
  profilePage.classList.remove("hidden");
  profileAvatar.innerHTML = user.avatar ? `<img src="${user.avatar}" style="width:84px;height:84px;border-radius:50%;object-fit:cover" />` : (user.username?.[0]||"U");
  profileUsernameInput.value = user.username;
  profileBioInput.value = user.bio || "";
  // stats
  const posts = getPosts().filter(p => p.userId === idToOpen);
  const followers = getFollows().filter(f => f.following === idToOpen).length;
  const following = getFollows().filter(f => f.follower === idToOpen).length;
  profileStats.innerHTML = `<div>Posts: ${posts.length}</div><div>Seguidores: ${followers}</div><div>Seguindo: ${following}</div>`;
  // my posts
  myPostsContainer.innerHTML = "";
  posts.forEach(p => {
    const d = document.createElement("div");
    d.className = "post";
    d.style.marginBottom = "8px";
    d.innerHTML = `<div class="time" style="font-size:12px;color:#6b7280">${p.createdAt}</div><div style="margin-top:6px">${p.text||""}</div>${p.image?`<img src="${p.image}" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-top:8px">`:""}`;
    myPostsContainer.appendChild(d);
  });
}

/* Close profile */
closeProfile.addEventListener("click", () => profilePage.classList.add("hidden"));

/* ---------- Render all ---------- */
function renderAll() {
  ensureInit();
  updateUIOnAuth();
  renderUsersList();
  renderPosts();
}

/* ---------- start ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // quick demo user (if no users exist)
  if ((getUsers() || []).length === 0) {
    saveUsers([ { id: "u_demo", email: "demo@ylo.local", password: "123456", username: "demo", avatar:null, bio:"Conta demo" } ]);
  }
  renderAll();
});
