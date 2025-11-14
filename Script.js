import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "COLE_AQUI_A_URL";
const SUPABASE_ANON = "COLE_AQUI_A_CHAVE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ELEMENTOS DA UI
const authSection = document.getElementById("auth-section");
const feedSection = document.getElementById("feed-section");
const feed = document.getElementById("feed");
const userEmail = document.getElementById("user-email");

// =========================
// AUTENTICAÇÃO
// =========================

async function signUp() {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return alert(error.message);

    alert("Conta criada! Agora podes fazer login.");
}

async function signIn() {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
    });

    if (error) return alert(error.message);

    loadUser();
}

async function loadUser() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        userEmail.textContent = data.session.user.email;
        authSection.classList.add("hidden");
        feedSection.classList.remove("hidden");
        loadPosts();
    }
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

// =========================
// POSTS
// =========================

async function createPost() {
    const content = document.getElementById("post-content").value.trim();
    if (!content) return;

    const { error } = await supabase
        .from("posts")
        .insert({ content });

    if (error) return alert(error.message);

    document.getElementById("post-content").value = "";
    loadPosts();
}

async function loadPosts() {
    const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    feed.innerHTML = "";

    posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        div.innerHTML = `
            <p>${post.content}</p>
            <span class="post-date">${new Date(post.created_at).toLocaleString()}</span>
        `;

        feed.appendChild(div);
    });
}

// Carrega user se já estiver logado
loadUser();import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "COLE_AQUI_A_URL";
const SUPABASE_ANON = "COLE_AQUI_A_CHAVE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ELEMENTOS DA UI
const authSection = document.getElementById("auth-section");
const feedSection = document.getElementById("feed-section");
const feed = document.getElementById("feed");
const userEmail = document.getElementById("user-email");

// =========================
// AUTENTICAÇÃO
// =========================

async function signUp() {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return alert(error.message);

    alert("Conta criada! Agora podes fazer login.");
}

async function signIn() {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
    });

    if (error) return alert(error.message);

    loadUser();
}

async function loadUser() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        userEmail.textContent = data.session.user.email;
        authSection.classList.add("hidden");
        feedSection.classList.remove("hidden");
        loadPosts();
    }
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

// =========================
// POSTS
// =========================

async function createPost() {
    const content = document.getElementById("post-content").value.trim();
    if (!content) return;

    const { error } = await supabase
        .from("posts")
        .insert({ content });

    if (error) return alert(error.message);

    document.getElementById("post-content").value = "";
    loadPosts();
}

async function loadPosts() {
    const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    feed.innerHTML = "";

    posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";

        div.innerHTML = `
            <p>${post.content}</p>
            <span class="post-date">${new Date(post.created_at).toLocaleString()}</span>
        `;

        feed.appendChild(div);
    });
}

// Carrega user se já estiver logado
loadUser();
