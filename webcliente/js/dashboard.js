/*==========================================================
PEDROSO CONSÓRCIOS
PORTAL DO CLIENTE
dashboard.js
==========================================================*/

const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!token || !usuario) {

    logout();

}

document.addEventListener("DOMContentLoaded", () => {

    carregarDashboard();

    configurarEventos();

});

/*==========================================================
CARREGAR DASHBOARD
==========================================================*/

async function carregarDashboard() {

    try {

        mostrarLoading();

        const resposta = await fetch(`${API_URL}/portal/dashboard`, {

            headers: {

                Authorization: `Bearer ${token}`

            }

        });

        if (resposta.status === 401) {

            logout();

            return;

        }

        const dados = await resposta.json();

        if (!dados.sucesso) {

            throw new Error(dados.mensagem);

        }

        preencherDashboard(dados.dados);

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível carregar o dashboard.");

    } finally {

        esconderLoading();

    }

}

/*==========================================================
EVENTOS
==========================================================*/

function configurarEventos() {

    const btnContrato = document.getElementById("btnContrato");

    if (btnContrato) {

        btnContrato.addEventListener("click", () => {

            window.location.href = "contrato.html";

        });

    }

    const btnParcelas = document.getElementById("btnParcelas");

    if (btnParcelas) {

        btnParcelas.addEventListener("click", () => {

            window.location.href = "parcelas.html";

        });

    }

    const btnPerfil = document.getElementById("btnPerfil");

    if (btnPerfil) {

        btnPerfil.addEventListener("click", () => {

            window.location.href = "perfil.html";

        });

    }

}

/*==========================================================
LOGOUT
==========================================================*/

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    window.location.href = "login.html";

}

/*==========================================================
PREENCHER DASHBOARD
==========================================================*/

function preencherDashboard(dados) {

    document.getElementById("nomeCliente").textContent =
        dados.nome || "-";

    document.getElementById("valorCarta").textContent =
        formatarMoeda(dados.valorCarta);

    document.getElementById("valorParcela").textContent =
        formatarMoeda(dados.proximaParcela);

    document.getElementById("dataVencimento").textContent =
        `Vencimento: ${formatarData(dados.proximoVencimento)}`;

    document.getElementById("statusContrato").textContent =
        dados.status || "-";

    document.getElementById("grupo").textContent =
        dados.grupo || "-";

    document.getElementById("cota").textContent =
        dados.cota || "-";

    document.getElementById("parcelasPagas").textContent =
        `${dados.parcelasPagas} Pagas`;

    document.getElementById("parcelasRestantes").textContent =
        `${dados.parcelasRestantes} Restantes`;

    atualizarProgresso(
        dados.parcelasPagas,
        dados.parcelasTotais
    );

}

/*==========================================================
BARRA DE PROGRESSO
==========================================================*/

function atualizarProgresso(pagas, total) {

    const percentual = total > 0
        ? Math.round((pagas / total) * 100)
        : 0;

    document.getElementById("percentualPlano").textContent =
        `${percentual}%`;

    document.getElementById("barraProgresso").style.width =
        `${percentual}%`;

}

/*==========================================================
FORMATAÇÃO
==========================================================*/

function formatarMoeda(valor) {

    if (valor == null) {

        return "R$ 0,00";

    }

    return Number(valor).toLocaleString("pt-BR", {

        style: "currency",

        currency: "BRL"

    });

}

function formatarData(data) {

    if (!data) {

        return "--/--/----";

    }

    return new Date(data).toLocaleDateString("pt-BR");

}

/*==========================================================
LOADING
==========================================================*/

function mostrarLoading() {

    document.body.style.cursor = "wait";

}

function esconderLoading() {

    document.body.style.cursor = "default";

}

/*==========================================================
SAUDAÇÃO
==========================================================*/

atualizarSaudacao();

function atualizarSaudacao() {

    const hora = new Date().getHours();

    const elemento = document.querySelector(".header-small");

    if (!elemento) {

        return;

    }

    if (hora < 12) {

        elemento.textContent = "Bom dia 👋";

    } else if (hora < 18) {

        elemento.textContent = "Boa tarde 👋";

    } else {

        elemento.textContent = "Boa noite 👋";

    }

}

/*==========================================================
UTILITÁRIOS
==========================================================*/

function definirTexto(id, valor) {

    const elemento = document.getElementById(id);

    if (!elemento) {

        return;

    }

    elemento.textContent = valor ?? "-";

}

function definirHTML(id, valor) {

    const elemento = document.getElementById(id);

    if (!elemento) {

        return;

    }

    elemento.innerHTML = valor ?? "";

}

/*==========================================================
LOG
==========================================================*/

console.log("Dashboard carregado com sucesso.");