if(!text.trim()) return;
  const comments = getComments();
  comments.push({ id: uid(), postId, userId: user.id, text, createdAt: now() });
  storage.set("ylo_comments", comments);
  renderAll();
}

/* Follow */
function toggleFollow(targetId){
  const user = currentUser();
  if(!user){ showModal("login"); return; }
  let follows = getFollows();
  const exists = follows.find(f=>f.userId===user.id && f.targetId===targetId);
  if(exists) follows = follows.filter(f=>!(f.userId===user.id && f.targetId===targetId));
  else follows.push({ id: uid(), userId:user.id, targetId, createdAt:now() });
  storage.set("ylo_follows", follows);
  renderAll();
}

/* ---------- Render Posts ---------- */
function renderPosts(){
  const posts = getPosts();
  const users = getUsers();
  const likes = getLikes();
  const comments = getComments();
  const session = currentUser();

  postsContainer.innerHTML = posts.map(p=>{
    const u = users.find(x=>x.id===p.userId);
    const avatar = u?.avatar ? `<img src="${u.avatar}" class="avatar">` : `<div class="avatar">${u.username[0]}</div>`;
    const liked = likes.some(l=>l.postId===p.id && l.userId===session?.id);
    const likeCount = likes.filter(l=>l.postId===p.id).length;
    const commentCount = comments.filter(c=>c.postId===p.id).length;

    return `
      <div class="post card">
        <div class="post-top">
          ${avatar}
          <div>
            <div class="username">${u?.username || "?"}</div>
            <div class="time">${p.createdAt}</div>
          </div>
        </div>
        <div class="text">${p.text || ""}</div>
        ${p.image ? `<img class="post-image" src="${p.image}">` : ""}

        <div class="post-actions">
          <button class="action-btn" onclick="toggleLike('${p.id}')">
            ❤️ ${liked ? "Já não gosto" : "Gosto"}
          </button>
          <span class="action-count">${likeCount}</span>

          <button class="action-btn" onclick="showCommentBox('${p.id}')">💬 Comentar</button>
          <span class="action-count">${commentCount}</span>
        </div>

        <div id="cbox-${p.id}" class="hidden" style="margin-top:8px;">
          <textarea id="cmt-${p.id}" placeholder="Escrever comentário..." style="width:100%;border:1px solid #e6eefc;border-radius:6px;padding:6px;"></textarea>
          <button class="btn small-btn" onclick="submitComment('${p.id}')">Enviar</button>
        </div>

        <div class="comments">
          ${comments.filter(c=>c.postId===p.id).map(c=>{
            const cu = users.find(x=>x.id===c.userId);
            return `<div style="margin-top:6px;"><b>${cu?.username}:</b> ${c.text}</div>`;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");
}

/* Comment box helpers */
window.showCommentBox = function(id){
  document.getElementById("cbox-"+id).classList.toggle("hidden");
};
window.submitComment = function(id){
  const el = document.getElementById("cmt-"+id);
  addComment(id, el.value);
  el.value="";
};

/* ---------- Render Users List ---------- */
function renderUsers(){
  const users = getUsers();
  const session = currentUser();
  const follows = getFollows();

  usersList.innerHTML = users
    .filter(u=>u.id !== session?.id)
    .map(u=>{
      const isFollowing = follows.some(f=>f.userId===session?.id && f.targetId===u.id);
      return `
        <div class="user-item">
          <span>${u.username}</span>
          <button class="btn small-btn" onclick="toggleFollow('${u.id}')">
            ${isFollowing ? "Seguindo" : "Seguir"}
          </button>
        </div>
      `;
    }).join("");
}

/* ---------- Profile ---------- */
function openProfile(){
  const s = currentUser();
  if(!s) return;

  const u = getUsers().find(x=>x.id===s.id);
  profileAvatar.innerHTML = u.avatar ? `<img src="${u.avatar}" style="width:84px;height:84px;border-radius:50%;">` : u.username[0];
  profileUsernameInput.value = u.username;
  profileBioInput.value = u.bio || "";

  const posts = getPosts().filter(p=>p.userId===u.id);
  const likes = getLikes().filter(l=>l.userId===u.id);
  const follows = getFollows().filter(f=>f.userId===u.id);
  const followers = getFollows().filter(f=>f.targetId===u.id);

  profileStats.innerHTML = `
    <div>Posts: ${posts.length}</div>
    <div>Gostos dados: ${likes.length}</div>
    <div>A seguir: ${follows.length}</div>
    <div>Seguidores: ${followers.length}</div>
  `;

  myPostsContainer.innerHTML = posts.map(p=>`
    <div class="card" style="margin-bottom:10px;">
      <div>${p.text}</div>
      ${p.image ? `<img src="${p.image}" style="width:100%;border-radius:8px;margin-top:6px;">` : ""}
    </div>
  `).join("");

  navFeed.classList.remove("active");
  navProfileBtn.classList.add("active");
  profilePage.classList.remove("hidden");
}

saveProfileBtn.addEventListener("click", async ()=>{
  const s = currentUser();
  const users = getUsers();
  const u = users.find(x=>x.id===s.id);

  u.username = profileUsernameInput.value.trim() || u.username;
  u.bio = profileBioInput.value.trim() || "";

  if(profileAvatarInput.files?.[0]){
    u.avatar = await fileToDataUrl(profileAvatarInput.files[0]);
  }

  saveUsers(users);
  storage.set("ylo_session", { id:u.id, email:u.email });
  alert("Perfil atualizado!");
  openProfile();
  renderAll();
});

closeProfile.addEventListener("click", ()=>{
  profilePage.classList.add("hidden");
  navProfileBtn.classList.remove("active");
  navFeed.classList.add("active");
});

/* ---------- Session UI ---------- */
function updateUIOnAuth(){
  const user = currentUser();

  if(user){
    navLogin.classList.add("hidden");
    navLogout.classList.remove("hidden");
    composeBox.classList.remove("hidden");

    const u = getUsers().find(x=>x.id===user.id);
    sessionAvatar.innerHTML = u.avatar ? `<img src="${u.avatar}" style="width:84px;height:84px;border-radius:50%;">` : u.username[0];
    sessionUsername.innerText = u.username;
    sessionBio.innerText = u.bio || "";

    composeAvatar.innerText = u.username[0];
    composeUsername.innerText = u.username;
  } else {
    navLogin.classList.remove("hidden");
    navLogout.classList.add("hidden");
    composeBox.classList.add("hidden");
    sessionAvatar.innerHTML = "U";
    sessionUsername.innerText = "Visitante";
    sessionBio.innerText = "Faça login ou registre-se para participar.";
  }
}

/* ---------- Render All ---------- */
function renderAll(){
  updateUIOnAuth();
  renderPosts();
  renderUsers();
}

/* Start */
renderAll();
