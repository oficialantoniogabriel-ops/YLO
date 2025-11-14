// Carregar posts salvos no navegador
let posts = JSON.parse(localStorage.getItem("ylo_posts")) || [];

// Exibir os posts ao abrir o site
window.onload = function () {
  mostrarPosts();
};

// Função para publicar um novo post
function publicarPost() {
  const texto = document.getElementById("postText").value.trim();

  if (texto === "") {
    alert("Escreve algo antes de publicar!");
    return;
  }

  const novoPost = {
    texto: texto,
    data: new Date().toLocaleString(),
  };

  // Adiciona ao array
  posts.unshift(novoPost);

  // Guardar no localStorage
  localStorage.setItem("ylo_posts", JSON.stringify(posts));

  // Limpar caixa
  document.getElementById("postText").value = "";

  // Mostrar no site
  mostrarPosts();
}

// Função que mostra os posts no feed
function mostrarPosts() {
  const lista = document.getElementById("posts");
  lista.innerHTML = "";

  posts.forEach((p) => {
    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <p class="text">${p.texto}</p>
      <p class="date">${p.data}</p>
    `;

    lista.appendChild(div);
  });
}
