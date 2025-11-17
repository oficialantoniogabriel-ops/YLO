/* =============================
   YLO — Navegação / Telas
   =============================*/

/* Seleciona botões da topbar */
const btnHome     = document.getElementById("btn-home");
const btnSearch   = document.getElementById("btn-search");
const btnReels    = document.getElementById("btn-reels");
const btnChat     = document.getElementById("btn-chat");
const btnSettings = document.getElementById("btn-settings");

/* Seleciona telas */
const screens = {
  home: document.getElementById("screen-home"),
  search: document.getElementById("screen-search"),
  reels: document.getElementById("screen-reels"),
  chat: document.getElementById("screen-chat"),
  settings: document.getElementById("screen-settings")
};

/* Função que troca de tela */
function openScreen(name) {
  Object.keys(screens).forEach(scr => {
    screens[scr].classList.remove("active-screen");
  });

  screens[name].classList.add("active-screen");
}

/* Eventos */
btnHome.addEventListener("click", () => openScreen("home"));
btnSearch.addEventListener("click", () => openScreen("search"));
btnReels.addEventListener("click", () => openScreen("reels"));
btnChat.addEventListener("click", () => openScreen("chat"));
btnSettings.addEventListener("click", () => openScreen("settings"));

/* =============================
   YLO — Sistema de Pesquisa
   =============================*/

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

/* Banco de dados local temporário */
let fakeUsers = [
  { name: "António Ndala", tag: "@fundador", founder: true },
  { name: "Maria Lopes", tag: "@maria" },
  { name: "João Miguel", tag: "@joao" },
  { name: "YLO Oficial", tag: "@ylo" }
];

searchInput.addEventListener("input", () => {
  let q = searchInput.value.trim().toLowerCase();
  searchResults.innerHTML = "";

  if (q.length === 0) return;

  let list = fakeUsers.filter(u =>
    u.name.toLowerCase().includes(q) || u.tag.toLowerCase().includes(q)
  );

  if (list.length === 0) {
    searchResults.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    return;
  }

  list.forEach(user => {
    let seal = user.founder ? "✔️" : "";
    let item = document.createElement("div");
    item.style.padding = "10px 0";

    item.innerHTML = `
      <strong>${user.name} ${seal}</strong><br>
      <span style="color:#666">${user.tag}</span>
    `;

    searchResults.appendChild(item);
  });
});

/* =============================
   YLO — Chat Placeholder
   =============================*/
screens.chat.innerHTML = `
  <div class="center">
    <h2>Chat</h2>
    <p>O sistema de chat será ativado quando adicionarmos Firebase ou Supabase.</p>
  </div>
`;

/* =============================
   YLO — Configurações Placeholder
   =============================*/
screens.settings.innerHTML = `
  <div class="center">
    <h2>Configurações</h2>
    <p>Aqui teremos: Conta, Segurança, Notificações, Privacidade, Moedas (KZ incluído).</p>
  </div>
`;

/* =============================
   YLO — Reels Placeholder
   =============================*/
screens.reels.innerHTML = `
  <div class="center">
    <h2>Reels</h2>
    <p>Reels será integrado depois (vídeos curtos estilo TikTok).</p>
  </div>
`;
