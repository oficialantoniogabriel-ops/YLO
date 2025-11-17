// Base do GitHub Pages
const BASE = "/YLO/";

// -------- BOTÕES DA PÁGINA INICIAL --------
const btnLogin = document.getElementById("btn-login");
if (btnLogin) {
    btnLogin.onclick = () => {
        window.location.href = BASE + "login.html";
    };
}

const btnRegister = document.getElementById("btn-register");
if (btnRegister) {
    btnRegister.onclick = () => {
        window.location.href = BASE + "register.html";
    };
}

// -------- LINKS DO MENU --------
function go(page) {
    window.location.href = BASE + page;
}

const menuHome = document.getElementById("menu-home");
if (menuHome) menuHome.onclick = () => go("home.html");

const menuActivity = document.getElementById("menu-activity");
if (menuActivity) menuActivity.onclick = () => go("activity.html");

const menuReels = document.getElementById("menu-reels");
if (menuReels) menuReels.onclick = () => go("reels.html");

const menuMonet = document.getElementById("menu-monet");
if (menuMonet) menuMonet.onclick = () => go("monet.html");

const menuPerfil = document.getElementById("menu-perfil");
if (menuPerfil) menuPerfil.onclick = () => go("perfil.html");
