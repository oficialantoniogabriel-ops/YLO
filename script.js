// Navegação entre telas (SPA)
const screens = {
  home: document.getElementById("screen-home"),
  search: document.getElementById("screen-search"),
  reels: document.getElementById("screen-reels"),
  chat: document.getElementById("screen-chat"),
  settings: document.getElementById("screen-settings"),
};

function openScreen(name){
  Object.values(screens).forEach(s => s.classList.remove("active-screen"));
  screens[name].classList.add("active-screen");
}

// Botões
document.getElementById("btn-home").onclick    = ()=> openScreen("home");
document.getElementById("btn-search").onclick  = ()=> openScreen("search");
document.getElementById("btn-reels").onclick   = ()=> openScreen("reels");
document.getElementById("btn-chat").onclick    = ()=> openScreen("chat");
document.getElementById("btn-settings").onclick= ()=> openScreen("settings");

// Pesquisa funcional
document.getElementById("search-input").addEventListener("input", e=>{
  const term = e.target.value.toLowerCase();
  const box = document.getElementById("search-results");

  if(!term){ box.innerHTML=""; return; }

  const users = JSON.parse(localStorage.getItem("y_users") || "[]");

  const results = users
    .filter(u => u.username?.toLowerCase().includes(term))
    .map(u => `<div style='padding:10px;background:#fff;border-radius:8px;margin-top:5px'>${u.username}</div>`)
    .join("");

  box.innerHTML = results || "<p>Nenhum resultado.</p>";
});
