/*==========================================================
PEDROSO CONSÓRCIOS
PORTAL DO CLIENTE
dashboard.js
==========================================================*/

const usuario = JSON.parse(localStorage.getItem("usuario"));
const token = getToken();

if (!token || !usuario) {
    logout();
}

document.addEventListener("DOMContentLoaded", () => {

    carregarDashboard();

    configurarEventos();

});

function mostrarFeedbackDashboard(tipo, titulo, mensagem) {
    const el = document.getElementById("feedbackDashboard");

    if (!el) {
        return;
    }

    const classes = {
        success: "feedback-banner feedback-banner--success is-visible",
        error: "feedback-banner feedback-banner--error is-visible",
        info: "feedback-banner feedback-banner--info is-visible"
    };

    el.className = classes[tipo] || classes.info;
    el.hidden = false;
    el.innerHTML = `
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        <div><strong>${titulo}</strong>${mensagem}</div>
    `;
    el.focus({ preventScroll: true });
}

function ocultarFeedbackDashboard() {
    const el = document.getElementById("feedbackDashboard");

    if (el) {
        el.hidden = true;
        el.className = "feedback-banner";
        el.textContent = "";
    }
}

async function carregarDashboard() {

    try {

        ocultarFeedbackDashboard();
        mostrarLoading();

        const { response: resposta, data: dados } = await http.get("/portal/dashboard");

        if (resposta.status === 401) {

            return;

        }

        if (!dados.sucesso) {

            throw new Error(dados.mensagem || "Não foi possível carregar o dashboard.");

        }

        preencherDashboard(dados.dados);

    } catch (erro) {

        console.error(erro);

        mostrarFeedbackDashboard(
            "error",
            "Erro ao carregar",
            erro.message || "Tente novamente em instantes."
        );

    } finally {

        esconderLoading();

    }

}

function configurarEventos() {

    irPara("btnContrato", "contrato.html");
    irPara("btnParcelas", "parcelas.html");
    irPara("btnLance", "lance.html");
    irPara("btnPerfil", "perfil.html");
    irPara("btnPerfilAtalho", "perfil.html");

}

function irPara(id, url) {
    const btn = document.getElementById(id);

    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = url;
        });
    }
}

function preencherDashboard(dados) {

    document.getElementById("nomeCliente").textContent =
        dados.nome || "-";

    const contratos = dados.contratos || [];
    const secao = document.getElementById("secaoMeusConsorcios");
    const container = document.getElementById("contratosDashboard");

    if (secao && container && contratos.length > 1) {
        secao.hidden = false;
        container.innerHTML = contratos.map(contrato => {
            const rotulo = [
                contrato.planoNome || "Consórcio",
                contrato.grupo ? `Grupo ${contrato.grupo}` : null,
                contrato.cota ? `Cota ${contrato.cota}` : null
            ].filter(Boolean).join(" • ");

            return `
                <a class="consorcio-link" href="contrato.html?contratoId=${contrato.id}">
                    <div>
                        <strong>${rotulo}</strong>
                        <span>${formatarMoeda(contrato.valorCarta)} • ${contrato.status || "—"}</span>
                    </div>
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </a>
            `;
        }).join("");
    } else if (secao) {
        secao.hidden = true;
    }

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

function atualizarProgresso(pagas, total) {

    const percentual = total > 0
        ? Math.round((pagas / total) * 100)
        : 0;

    document.getElementById("percentualPlano").textContent =
        `${percentual}%`;

    document.getElementById("barraProgresso").style.width =
        `${percentual}%`;

}

function formatarMoeda(valor) {

    if (valor == null) {

        return "—";

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

function mostrarLoading() {

    document.body.classList.add("is-loading");
    document.body.style.cursor = "wait";

}

function esconderLoading() {

    document.body.classList.remove("is-loading");
    document.body.style.cursor = "default";

}

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
