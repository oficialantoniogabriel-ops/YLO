/* ========================
   YLO — Controlo de Telas
   ======================== */

const pages = {
    home: `
        <h2>Feed</h2>
        <p>Bem-vindo ao YLO! Aqui aparecerão publicações reais.</p>
    `,

    chat: `
        <h2>Mensagens</h2>
        <p>Aqui aparecerá a lista de conversas.</p>
    `,

    settings: `
        <h2>Configurações</h2>
        <ul class="settings-list">
            <li>Editar Perfil</li>
            <li>Privacidade</li>
            <li>Idioma</li>
            <li>Alterar senha</li>
            <li>Notificações</li>
        </ul>
    `,

    help: `
        <h2>Ajuda & Suporte</h2>
        <p>Centro de suporte YLO. Como podemos ajudar?</p>
    `,

    monet: `
        <h2>Monetização YLO</h2>
        <p>Disponível para contas com +5.000 seguidores.</p>
        <p>Suporte a moedas: KZ, USD, BRL, EUR.</p>
    `,

    profile: `
        <h2>Seu Perfil</h2>
        <p>Aqui vai aparecer informação da conta.</p>
    `,

    search: `
        <h2>Pesquisar</h2>
        <input id="search-input" placeholder="Buscar pessoas…" />
        <div id="search-results"></div>
    `
};

/* ======= troca de telas ======= */

function openPage(name) {
    document.getElementById("app-page").innerHTML = pages[name] || "<p>Erro ao carregar.</p>";
}

/* ====== Botões ====== */

document.getElementById("btn-open-settings").onclick = () => openPage("settings");
document.getElementById("btn-open-chat").onclick = () => openPage("chat");
document.getElementById("btn-open-support").onclick = () => openPage("help");
document.getElementById("btn-open-support-2").onclick = () => openPage("help");
document.getElementById("nav-monet").onclick = () => openPage("monet");
document.getElementById("btn-edit-profile").onclick = () => openPage("profile");
document.getElementById("nav-home").onclick = () => openPage("home");
document.getElementById("nav-activity").onclick = () => openPage("profile");  
document.getElementById("nav-reels").onclick = () => openPage("home");

/* ======= Pesquisa funcional ======= */
document.getElementById("global-search").addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
        openPage("search");
        document.getElementById("search-input").value = e.target.value;
        showResults(e.target.value);
    }
});

function showResults(text){
    const box = document.getElementById("search-results");
    box.innerHTML = `
        <p>Resultados para: <strong>${text}</strong></p>
        <div class="search-item">Nenhum usuário encontrado (demo)</div>
    `;
}

/* abrir home ao carregar */
openPage("home");
