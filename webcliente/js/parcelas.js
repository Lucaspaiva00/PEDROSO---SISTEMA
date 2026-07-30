/*==========================================================
PEDROSO CONSÓRCIOS
PORTAL DO CLIENTE
parcelas.js
==========================================================*/

const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));
let proximaParcela = null;
let parcelaSelecionada = null;

if (!token || !usuario) {

    logout();

}

document.addEventListener("DOMContentLoaded", () => {

    carregarParcelas();

    configurarEventos();

});

/*==========================================================
CARREGAR PARCELAS
==========================================================*/

async function carregarParcelas() {

    try {

        mostrarLoading();

        const resposta = await fetch(`${API_URL}/portal/parcelas`, {

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

        preencherTela(dados.dados);

    } catch (erro) {

        console.error(erro);

        alert("Não foi possível carregar as parcelas.");

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

    const btnBoleto = document.getElementById("btnBoleto");

    if (btnBoleto) {

        btnBoleto.addEventListener("click", () => {

            abrirBoleto();

        });

    }

    const btnPix = document.getElementById("btnPix");

    if (btnPix) {

        btnPix.addEventListener("click", () => {

            copiarPix();

        });

    }

    const btnComprovante = document.getElementById("btnComprovante");

    if (btnComprovante) {

        btnComprovante.addEventListener("click", () => {

            abrirComprovante();

        });

    }

    const btnFecharModal = document.getElementById("btnFecharModal");

    if (btnFecharModal) {

        btnFecharModal.addEventListener("click", () => {

            document
                .getElementById("modalParcela")
                .classList.remove("show");

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
PREENCHER TELA
==========================================================*/

function preencherTela(dados) {

    const proxima = dados.proximaParcela;
    proximaParcela = dados.proximaParcela;
    if (!proxima) {

        document.getElementById("valorProximaParcela").textContent =
            "R$ 0,00";

        document.getElementById("vencimentoProximaParcela").textContent =
            "Nenhuma parcela pendente.";

        document.getElementById("statusProximaParcela").textContent =
            "SEM PARCELAS";

        renderizarHistorico(dados.parcelas);

        return;

    }

    document.getElementById("valorProximaParcela").textContent =
        formatarMoeda(proxima.valor);

    document.getElementById("vencimentoProximaParcela").textContent =
        `Vence em ${formatarData(proxima.vencimento)}`;

    const badge = document.getElementById("statusProximaParcela");

    badge.textContent = proxima.status;

    badge.className = obterClasseStatus(proxima.status);

    renderizarHistorico(dados.parcelas);

}

/*==========================================================
HISTÓRICO
==========================================================*/


function renderizarHistorico(parcelas) {

    const lista = document.getElementById("listaParcelas");

    lista.innerHTML = "";

    if (!parcelas || parcelas.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">
                Nenhuma parcela encontrada.
            </div>
        `;

        return;
    }

    parcelas.forEach(parcela => {

        const card = document.createElement("div");

        card.className = `parcela-item ${parcela.status.toLowerCase()}`;

        card.innerHTML = `

            <div class="parcela-topo">

                <div>

                    <div class="parcela-numero">
                        Parcela ${String(parcela.numero).padStart(3, "0")}
                    </div>

                    <div class="parcela-data">
                        ${formatarData(parcela.vencimento)}
                    </div>

                </div>

                <span class="${obterClasseStatus(parcela.status)}">
                    ${parcela.status}
                </span>

            </div>

            <div class="parcela-valor">
                ${formatarMoeda(parcela.valor)}
            </div>

            <div class="parcela-seta">
                <i class="fa-solid fa-chevron-right"></i>
            </div>

        `;

        card.onclick = () => abrirModal(parcela);

        lista.appendChild(card);

    });

}
/*==========================================================
MODAL
==========================================================*/

function abrirModal(parcela) {

    parcelaSelecionada = parcela;

    document.getElementById("modalNumero").textContent =
        String(parcela.numero).padStart(3, "0");

    document.getElementById("modalValor").textContent =
        formatarMoeda(parcela.valor);

    document.getElementById("modalVencimento").textContent =
        formatarData(parcela.vencimento);

    document.getElementById("modalStatus").textContent =
        parcela.status;

    document
        .getElementById("modalParcela")
        .classList.add("show");
    console.log(JSON.stringify(parcela, null, 2));

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

function obterClasseStatus(status) {

    switch ((status || "").toUpperCase()) {

        case "PAGO":
            return "badge badge-success";

        case "PENDENTE":
            return "badge badge-warning";

        case "ATRASADO":
            return "badge badge-danger";

        default:
            return "badge";

    }

}

function mostrarLoading() {

    document.getElementById("listaParcelas").innerHTML = `

        <div class="empty-state">

            Carregando parcelas...

        </div>

    `;

}

function esconderLoading() {

}

/*==========================================================
AÇÕES
==========================================================*/

function abrirBoleto() {

    if (!proximaParcela) {

        return alert("Nenhum boleto disponível.");

    }

    window.open(

        proximaParcela.bankSlipUrl ||

        proximaParcela.invoiceUrl,

        "_blank"

    );

}

function copiarPix() {

    if (!proximaParcela?.pixCopiaCola) {

        return alert("PIX indisponível.");

    }

    navigator.clipboard.writeText(

        proximaParcela.pixCopiaCola

    );

    alert("Código PIX copiado.");

}

function abrirComprovante() {

    if (!proximaParcela?.invoiceUrl) {

        return alert("Comprovante indisponível.");

    }

    window.open(

        proximaParcela.invoiceUrl,

        "_blank"

    );

}

/*==========================================================
MODAL
==========================================================*/

window.addEventListener("click", (event) => {

    const modal = document.getElementById("modalParcela");

    if (event.target === modal) {

        modal.classList.remove("show");

    }

});

function abrirBoletoModal() {

    if (!parcelaSelecionada) return;

    const url =
        parcelaSelecionada.bankSlipUrl ||
        parcelaSelecionada.invoiceUrl;

    if (!url) {

        alert("Boleto indisponível.");

        return;

    }

    window.open(url, "_blank");

}

function mostrarPixModal() {

    if (!parcelaSelecionada?.pixQrCode) {

        alert("PIX indisponível.");

        return;

    }

    window.open(parcelaSelecionada.pixQrCode, "_blank");

}
async function copiarPixModal() {

    if (!parcelaSelecionada?.pixCopiaCola) {

        alert("PIX indisponível.");

        return;

    }

    await navigator.clipboard.writeText(
        parcelaSelecionada.pixCopiaCola
    );

    alert("Código PIX copiado.");

}

function abrirComprovanteModal() {

    if (!parcelaSelecionada?.invoiceUrl) {

        alert("Comprovante indisponível.");

        return;

    }

    window.open(
        parcelaSelecionada.invoiceUrl,
        "_blank"
    );

}

document
    .getElementById("btnModalBoleto")
    .addEventListener("click", abrirBoletoModal);

document
    .getElementById("btnModalPix")
    .addEventListener("click", mostrarPixModal);

document
    .getElementById("btnModalCopiarPix")
    .addEventListener("click", copiarPixModal);

document
    .getElementById("btnModalComprovante")
    .addEventListener("click", abrirComprovanteModal);