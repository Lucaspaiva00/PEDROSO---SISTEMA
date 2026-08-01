const form = document.getElementById("formLogin");
const mensagemEl = document.getElementById("mensagem");

form.addEventListener("submit", login);

function exibirMensagemLogin(texto, tipo = "error") {
    if (!mensagemEl) {
        return;
    }

    mensagemEl.textContent = texto;
    mensagemEl.style.color = tipo === "success" ? "#166534" : "#991b1b";
}

async function login(e) {

    e.preventDefault();

    exibirMensagemLogin("");

    const login = document.getElementById("email").value.trim();

    const senha = document.getElementById("senha").value;

    try {

        const { response, data: dados } = await http.post("/auth/login", {
                login,
                senha
            }, { auth: false });

        if (!response.ok || !dados?.sucesso) {

            exibirMensagemLogin(dados?.mensagem || "Não foi possível entrar.");

            return;

        }

        localStorage.setItem(

            "token",

            dados.token

        );

        localStorage.setItem(

            "usuario",

            JSON.stringify(dados.usuario)

        );

        window.location.href = "dashboard.html";

    }

    catch (erro) {

        console.error(erro);

        exibirMensagemLogin("Erro ao conectar ao servidor. Tente novamente.");

    }

}
