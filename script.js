// ----------------------
// SISTEMA DE NAVEGAÇÃO YLO (SPA)
// ----------------------

const app = document.getElementById("app");

// TEMPLATES DAS TELAS
const screens = {
  home: `
    <div class="screen">
      <h2>Feed</h2>
      <p>Bem-vindo à YLO!</p>
    </div>
  `,

  chat: `
    <div class="screen">
      <h2>Chats</h2>
      <p>Aqui aparecem as conversas.</p>
    </div>
  `,

  amigos: `
    <div class="screen">
      <h2>Amigos</h2>
      <input id="searchFriends" type="text" placeholder="Pesquisar amigos..." />
      <div id="friendsList"></div>
    </div>
  `,

  pesquisa: `
    <div class="screen">
      <h2>Pesquisar</h2>
      <input id="globalSearch" type="text" placeholder="Pesquisar..." />
      <div id="searchResults"></div>
    </div>
  `,

  config: `
    <div class="screen">
      <h2>Configurações</h2>

      <div class="card">Conta</div>
      <div class="card">Privacidade</div>
      <div class="card">Moedas (inclui KZ)</div>
      <div class="card">Centro de Anúncios</div>
      <div class="card">Monetização – mínimo 5.000 seguidores</div>
      <div class="card">Legal & Segurança</div>
    </div>
  `,

  perfil: `
    <div class="screen">
      <h2>Perfil</h2>
      <div class="profile-header">
        <img src="icons/user.svg" class="avatar">
        <h3>António Gabriel <span class="badge">✔ Fundador</span></h3>
      </div>
    </div>
  `,
};

// ----------------------
// FUNÇÃO DE ABRIR TELAS
// ----------------------
function openScreen(name) {
  if (!screens[name]) {
    app.innerHTML = "<p>Erro: tela não existe.</p>";
    return;
  }
  app.innerHTML = screens[name];
  attachEvents(name);
}

// ----------------------
// EVENTOS DAS TELAS
// ----------------------
function attachEvents(name) {

  // PESQUISA GLOBAL
  if (name === "pesquisa") {
    const input = document.getElementById("globalSearch");
    const results = document.getElementById("searchResults");

    input.addEventListener("input", () => {
      const q = input.value.toLowerCase();
      if (!q) { results.innerHTML = ""; return; }

      results.innerHTML = `
        <div class="result">Nada encontrado ainda…</div>
      `;
    });
  }

  // PESQUISAR AMIGOS
  if (name === "amigos") {
    const input = document.getElementById("searchFriends");
    const list = document.getElementById("friendsList");

    input.addEventListener("input", () => {
      const q = input.value.toLowerCase();
      if (!q) { list.innerHTML = ""; return; }

      list.innerHTML = `<div class="result">Resultados de amigos…</div>`;
    });
  }
}

// ----------------------
// BOTÕES DA BARRA INFERIOR
// ----------------------
window.openHome = () => openScreen("home");
window.openChat = () => openScreen("chat");
window.openAmigos = () => openScreen("amigos");
window.openPesquisa = () => openScreen("pesquisa");
window.openConfig = () => openScreen("config");
window.openPerfil = () => openScreen("perfil");

// INICIAR NA HOME
openScreen("home");
