/* YLO - 100% local (localStorage) */
/* Chaves localStorage:
   ylo_users, ylo_session, ylo_posts, ylo_likes, ylo_comments, ylo_follows
*/

const storage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch(e){ return null; } },
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

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function now() { return new Date().toLocaleString(); }

/* DOM */
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

/* modal helpers */
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

/* session */
function currentUser() { return storage.get("ylo_session"); }
function setSession(user) { storage.set("ylo_session", user); updateUIOnAuth(); }

/* users */
function getUsers() { return storage.get("ylo_users") || []; }
function saveUsers(list) { storage.set("ylo_users", list); }

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
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

/* ---------- Posts ---------- */
publishBtn.addEventListener("click", async () => {
  const user = currentUser();
  if (!user) { showModal("login"); return; }
  const text = postText.value.trim();
  const file = postImageInput.files?.[0];
  if (!text && !file) return alert("Adiciona texto ou imagem.");

  let imgData = null;
  if (file) imgData = await fileToDataUrl(file);

  const posts = storage.get("ylo_posts") || [];
  const newPost = { id: uid(), userId: user.id, text, image: imgData, createdAt: now() };
  posts.unshift(newPost);
  storage.set("ylo_posts", posts);
  postText.value = "";
  postImageInput.value = "";
  renderAll();
});

/* likes/comments/follows */
function getPosts() { return storage.get("ylo_posts") || []; }
function getLikes() { return storage.get("ylo_likes") || []; }
function getComments() { return storage.get("ylo_comments") || []; }
function getFollows() { return storage.get("ylo_follows") || []; }

function toggleLike(postId) {
  const user = currentUser(); if (!user) { showModal("login"); return; }
  let likes = getLikes();
  const exists = likes.find(l => l.postId === postId && l.userId === user.id);
  if (exists) likes = likes.filter(l => !(l.postId === postId && l.userId === user.id));
  else likes.push({ id: uid(), postId, userId: user.id, createdAt: now() });
  storage.set("ylo_likes", likes);
  renderAll();
}

function addComment(postId, text) {
  const user = currentUser(); if (!user) { showModal("login"); return; }
  if (!text?.trim()) return;
  const comments = getComments();
  comments.push({ id: uid(), postId, userId: user.id, text: text.trim(), createdAt: now() });
  storage.set("ylo_comments", comments);
  renderAll();
}

function toggleFollow(targetUserId) {
  const user = currentUser(); if (!user) { showModal("login"); return; }
  let follows = getFollows();
  const exists = follows.find(f => f.follower === user.id && f.following === targetUserId);
  if (exists) follows = follows.filter(f => !(f.follower === user.id && f.following === targetUserId));
  else follows.push({ id: uid(), follower: user.id, following: targetUserId, createdAt: now() });
  storage.set("ylo_follows", follows);
  renderAll();
}

/* profile edit */
saveProfileBtn.addEventListener("click", async () => {
  const userSession = currentUser(); if (!userSession) { showModal("login"); return; }
  const users = getUsers(); const me = users.find(u => u.id === userSession.id); if (!me) return alert("Usuário não encontrado.");
  me.username = profileUsernameInput.value.trim() || me.username;
  me.bio = profileBioInput.value.trim() || "";
  if (profileAvatarInput.files?.[0]) me.avatar = await fileToDataUrl(profileAvatarInput.files[0]);
  saveUsers(users);
  alert("Perfil atualizado.");
  renderAll();
});

/* rendering */
function findUserById(id) { return getUsers().find(u => u.id === id) || null; }

function renderUsersList() {
