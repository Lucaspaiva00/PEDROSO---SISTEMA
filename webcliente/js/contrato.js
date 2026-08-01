const usuario = JSON.parse(localStorage.getItem("usuario"));
const token = getToken();

if (!token || !usuario) {

    logout();

}

document.addEventListener("DOMContentLoaded", () => {

    carregarContrato();

    configurarEventos();

});

async function carregarContrato() {

    try {

        mostrarLoading();

        const { response: resposta, data: dados } = await http.get("/portal/contrato");

        if (resposta.status === 401) {

            return;

        }

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

    if (!contratoAtual?.pdfUrl) {

        alert("Contrato indisponível.");

        return;

    }

    window.open(contratoAtual.pdfUrl, "_blank");

}

function downloadContrato() {

    if (!contratoAtual?.pdfUrl) {

        alert("Contrato indisponível.");

        return;

    }

    const a = document.createElement("a");

    a.href = contratoAtual.pdfUrl;

    a.download = "";

    a.click();

}

async function compartilharContrato() {

    if (!contratoAtual?.pdfUrl) {

        alert("Contrato indisponível.");

        return;

    }

    if (navigator.share) {

        await navigator.share({

            title: "Contrato",

            url: contratoAtual.pdfUrl

        });

    } else {

        await navigator.clipboard.writeText(
            contratoAtual.pdfUrl
        );

        alert("Link copiado.");

    }

}