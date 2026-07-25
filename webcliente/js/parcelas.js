/*==========================================================
PEDROSO CONSÓRCIOS
PORTAL DO CLIENTE
parcelas.js
==========================================================*/

const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));

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

        card.className = "parcel-card";

        card.innerHTML = `

            <div class="parcel-header">

                <strong>

                    Parcela ${String(parcela.numero).padStart(3, "0")}

                </strong>

                <span class="${obterClasseStatus(parcela.status)}">

                    ${parcela.status}

                </span>

            </div>

            <div class="parcel-body">

                <p>

                    <strong>Valor:</strong>
                    ${formatarMoeda(parcela.valor)}

                </p>

                <p>

                    <strong>Vencimento:</strong>
                    ${formatarData(parcela.vencimento)}

                </p>

            </div>

        `;

        card.addEventListener("click", () => {

            abrirModal(parcela);

        });

        lista.appendChild(card);

    });

}

/*==========================================================
MODAL
==========================================================*/

function abrirModal(parcela) {

    document.getElementById("modalNumero").textContent =
        parcela.numero;

    document.getElementById("modalValor").textContent =
        formatarMoeda(parcela.valor);

    document.getElementById("modalVencimento").textContent =
        formatarData(parcela.vencimento);

    document.getElementById("modalStatus").textContent =
        parcela.status;

    document
        .getElementById("modalParcela")
        .classList.add("show");

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

    alert("Boleto ainda não disponível.");

}

async function copiarPix() {

    alert("PIX ainda não disponível.");

}

function abrirComprovante() {

    alert("Comprovante ainda não disponível.");

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