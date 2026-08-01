const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
const token = getToken();

if (!token || !usuario) {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    preencherUsuarioLocal();
    carregarDadosPortal();

    document.getElementById("btnVoltar")?.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    document.getElementById("btnSair")?.addEventListener("click", logout);
});

function preencherUsuarioLocal() {
    const nome = usuario.nome || "Cliente";
    definirTexto("nomePerfil", nome);
    definirTexto("tituloPerfil", nome.split(" ")[0] || "Perfil");
    definirTexto("emailPerfil", usuario.email || "—");

    const avatar = document.getElementById("avatarIniciais");

    if (avatar) {
        const partes = nome.trim().split(/\s+/);
        const iniciais = partes.length >= 2
            ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
            : nome.slice(0, 2).toUpperCase();
        avatar.textContent = iniciais;
    }
}

async function carregarDadosPortal() {
    try {
        const { response, data: json } = await http.get("/portal/dashboard");

        if (response.status === 401) {
            return;
        }

        if (!json.sucesso || !json.dados) {
            return;
        }

        const dados = json.dados;
        definirTexto("nomePerfil", dados.nome || usuario.nome);
        definirTexto("tituloPerfil", (dados.nome || usuario.nome || "Perfil").split(" ")[0]);
        definirTexto("grupoPerfil", dados.grupo ?? "—");
        definirTexto("cotaPerfil", dados.cota ?? "—");
    } catch (erro) {
        console.error(erro);
    }
}

function definirTexto(id, valor) {
    const el = document.getElementById(id);

    if (el) {
        el.textContent = valor ?? "—";
    }
}
