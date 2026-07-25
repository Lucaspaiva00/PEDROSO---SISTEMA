/*==========================================================
PEDROSO CONSÓRCIOS
PORTAL DO CLIENTE
contrato.js
==========================================================*/

const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!token || !usuario) {

    logout();

}

document.addEventListener("DOMContentLoaded", () => {

    carregarContrato();

    configurarEventos();

});

/*==========================================================
CARREGAR CONTRATO
==========================================================*/

async function carregarContrato() {

    try {

        mostrarLoading();

        const resposta = await fetch(`${API_URL}/portal/contrato`, {

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

        preencherContrato(dados.dados);

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível carregar o contrato.");

    } finally {

        esconderLoading();

    }

}

/*==========================================================
EVENTOS
==========================================================*/

function configurarEventos() {

    const btnVoltar = document.getElementById("btnVoltar");

    if (btnVoltar) {

        btnVoltar.addEventListener("click", () => {

            window.location.href = "dashboard.html";

        });

    }

    const btnVisualizarContrato = document.getElementById("btnVisualizarContrato");

    if (btnVisualizarContrato) {

        btnVisualizarContrato.addEventListener("click", () => {

            visualizarContrato();

        });

    }

    const btnDownloadContrato = document.getElementById("btnDownloadContrato");

    if (btnDownloadContrato) {

        btnDownloadContrato.addEventListener("click", () => {

            downloadContrato();

        });

    }

    const btnCompartilharContrato = document.getElementById("btnCompartilharContrato");

    if (btnCompartilharContrato) {

        btnCompartilharContrato.addEventListener("click", () => {

            compartilharContrato();

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
PREENCHER CONTRATO
==========================================================*/

function preencherContrato(contrato) {

    document.getElementById("statusContrato").textContent =
        contrato.status || "-";

    document.getElementById("mensagemStatus").textContent =
        obterMensagemStatus(contrato.status);

    document.getElementById("grupo").textContent =
        contrato.grupo || "-";

    document.getElementById("cota").textContent =
        contrato.cota || "-";

    document.getElementById("plano").textContent =
        contrato.plano?.nome || "-";

    document.getElementById("tipoConsorcio").textContent =
        contrato.tipoConsorcio || "-";

    document.getElementById("valorCarta").textContent =
        formatarMoeda(contrato.valorCartaCredito);

    document.getElementById("valorParcela").textContent =
        formatarMoeda(contrato.valorParcela);

    document.getElementById("parcelasTotais").textContent =
        contrato.quantidadeParcelas || 0;

    document.getElementById("parcelasPagas").textContent =
        contrato.parcelasPagas || 0;

    document.getElementById("parcelasRestantes").textContent =
        contrato.parcelasRestantes || 0;

    document.getElementById("dataContrato").textContent =
        formatarData(contrato.dataContratacao);

    document.getElementById("numeroContrato").textContent =
        contrato.numeroContrato || contrato.id || "-";

}

/*==========================================================
MENSAGEM DO STATUS
==========================================================*/

function obterMensagemStatus(status) {

    switch ((status || "").toUpperCase()) {

        case "ATIVO":
            return "Contrato em situação regular.";

        case "QUITADO":
            return "Contrato totalmente quitado.";

        case "CANCELADO":
            return "Contrato cancelado.";

        case "PENDENTE":
            return "Existem pendências neste contrato.";

        case "INADIMPLENTE":
            return "Existem parcelas em atraso.";

        default:
            return "Situação do contrato.";
    }

}

/*==========================================================
UTILITÁRIOS
==========================================================*/

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {

        style: "currency",

        currency: "BRL"

    });

}

function formatarData(data) {

    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR");

}

function mostrarLoading() {

    document.getElementById("statusContrato").textContent =
        "Carregando...";

}

function esconderLoading() {

}

/*==========================================================
AÇÕES
==========================================================*/

function visualizarContrato() {

    alert("Visualização do contrato em desenvolvimento.");

}

function downloadContrato() {

    alert("Download do contrato em desenvolvimento.");

}

async function compartilharContrato() {

    if (navigator.share) {

        try {

            await navigator.share({

                title: "Meu Contrato",

                text: "Confira meu contrato da Pedroso Consórcios.",

                url: window.location.href

            });

        } catch (erro) {

            console.log(erro);

        }

    } else {

        alert("Seu navegador não suporta compartilhamento.");

    }

}