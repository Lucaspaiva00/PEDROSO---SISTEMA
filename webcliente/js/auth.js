
const API_URL = "http://localhost:3000";

const formLogin = document.getElementById("formLogin");
const btnEntrar = document.getElementById("btnEntrar");
const mensagem = document.getElementById("mensagem");
const campoCpf = document.getElementById("cpf");
const campoSenha = document.getElementById("senha");

campoCpf.addEventListener("input", formatarCPF);

formLogin.addEventListener("submit", realizarLogin);

function formatarCPF(e) {

    let valor = e.target.value.replace(/\D/g, "");

    valor = valor
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = valor;

}

async function realizarLogin(event) {

    event.preventDefault();

    mensagem.textContent = "";

    const cpf = campoCpf.value.replace(/\D/g, "");
    const senha = campoSenha.value.trim();

    if (!cpf || !senha) {

        mensagem.textContent = "Informe o CPF e a senha.";

        return;

    }

    btnEntrar.disabled = true;

    btnEntrar.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Entrando...
    `;
    try {

        const response = await fetch(`${API_URL}/auth/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                login: cpf,
                senha
            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.mensagem || "CPF ou senha inválidos.");

        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        mensagem.style.color = "#22c55e";
        mensagem.textContent = "Login realizado com sucesso!";

        setTimeout(() => {

            window.location.href = "dashboard.html";

        }, 600);

    } catch (error) {

        mensagem.style.color = "#ef4444";
        mensagem.textContent = error.message;

        btnEntrar.disabled = false;

        btnEntrar.innerHTML = `
            <i class="fas fa-right-to-bracket"></i>
            Entrar
        `;

    }
}

window.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    if (!token) {
        return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    if (usuario.role === "CLIENTE") {

        window.location.href = "dashboard.html";

    }

});