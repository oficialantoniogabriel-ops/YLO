// ====== NAVEGAÇÃO ENTRE PÁGINAS ======

const goLogin = document.getElementById("go-login");
if (goLogin) goLogin.onclick = () => window.location.href = "login.html";

const goRegister = document.getElementById("go-register");
if (goRegister) goRegister.onclick = () => window.location.href = "register.html";

// ====== LOGIN SIMPLIFICADO (fake até integrar backend) ======
const btnLogin = document.getElementById("btn-login");
if (btnLogin) {
  btnLogin.onclick = () => {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value.trim();

    if (!email || !pass) {
      alert("Preencha todos os campos!");
      return;
    }

    // Login fake só para navegar
    localStorage.setItem("ylo_user", email);
    window.location.href = "perfil.html";
  };
}

// ====== REGISTRO SIMPLIFICADO ======
const btnRegister = document.getElementById("btn-register");
if (btnRegister) {
  btnRegister.onclick = () => {
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-password").value.trim();

    if (!name || !email || !pass) {
      alert("Preencha todos os campos!");
      return;
    }

    localStorage.setItem("ylo_user", email);
    localStorage.setItem("ylo_name", name);
    window.location.href = "perfil.html";
  };
  }
