/*==========================================================
PEDROSO CONSÓRCIOS
PORTAL DO CLIENTE
parcelas.js
==========================================================*/

const usuario = JSON.parse(localStorage.getItem("usuario"));
const token = getToken();

let contratoAtual = null;
let todasParcelas = [];
let proximaParcela = null;
let parcelaSelecionada = null;
let areaParcelasAberta = false;

if (!token || !usuario) {
    logout();
}

document.addEventListener("DOMContentLoaded", () => {
    configurarEventos();
    carregarDadosPortal();
});

/*==========================================================
CARREGAR CONTRATO E PARCELAS
==========================================================*/

async function carregarDadosPortal() {
    try {
        mostrarLoadingContratos();

        const [respostaContrato, respostaParcelas] = await Promise.all([
            http.get("/portal/contrato"),
            http.get("/portal/parcelas")
        ]);

        if (
            respostaContrato.response.status === 401 ||
            respostaParcelas.response.status === 401
        ) {
            return;
        }

        const dadosContrato = respostaContrato.data;
        const dadosParcelas = respostaParcelas.data;

        if (!dadosContrato.sucesso) {
            throw new Error(
                dadosContrato.mensagem ||
                "Não foi possível carregar o contrato."
            );
        }

        if (!dadosParcelas.sucesso) {
            throw new Error(
                dadosParcelas.mensagem ||
                "Não foi possível carregar as parcelas."
            );
        }

        contratoAtual = dadosContrato.dados;
        todasParcelas = dadosParcelas.dados?.parcelas || [];
        proximaParcela = dadosParcelas.dados?.proximaParcela || null;

        renderizarConsorcios();

    } catch (erro) {
        console.error("Erro ao carregar dados do portal:", erro);

        const container = document.getElementById("contratosContainer");

        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Não foi possível carregar</h3>
                    <p>
                        ${escaparHtml(
                erro.message ||
                "Tente novamente em alguns instantes."
            )}
                    </p>
                </div>
            `;
        }
    }
}

/*==========================================================
EVENTOS
==========================================================*/

function configurarEventos() {
    const btnVoltar = document.getElementById("btnVoltar");

    if (btnVoltar) {
        btnVoltar.addEventListener("click", () => {
            if (areaParcelasAberta) {
                voltarParaConsorcios();
                return;
            }

            window.location.href = "dashboard.html";
        });
    }

    const btnBoleto = document.getElementById("btnBoleto");

    if (btnBoleto) {
        btnBoleto.addEventListener("click", abrirBoletoProximaParcela);
    }

    const btnPix = document.getElementById("btnPix");

    if (btnPix) {
        btnPix.addEventListener("click", mostrarPixProximaParcela);
    }

    const btnComprovante = document.getElementById("btnComprovante");

    if (btnComprovante) {
        btnComprovante.addEventListener(
            "click",
            abrirComprovanteProximaParcela
        );
    }

    const btnFecharModal = document.getElementById("btnFecharModal");

    if (btnFecharModal) {
        btnFecharModal.addEventListener("click", fecharModal);
    }

    const btnModalBoleto = document.getElementById("btnModalBoleto");

    if (btnModalBoleto) {
        btnModalBoleto.addEventListener("click", abrirBoletoModal);
    }

    const btnModalPix = document.getElementById("btnModalPix");

    if (btnModalPix) {
        btnModalPix.addEventListener("click", mostrarPixModal);
    }

    const btnModalCopiarPix =
        document.getElementById("btnModalCopiarPix");

    if (btnModalCopiarPix) {
        btnModalCopiarPix.addEventListener(
            "click",
            copiarPixModal
        );
    }

    const btnModalComprovante =
        document.getElementById("btnModalComprovante");

    if (btnModalComprovante) {
        btnModalComprovante.addEventListener(
            "click",
            abrirComprovanteModal
        );
    }

    window.addEventListener("click", event => {
        const modal = document.getElementById("modalParcela");

        if (event.target === modal) {
            fecharModal();
        }
    });
}

/*==========================================================
LISTA DE CONSÓRCIOS
==========================================================*/

function renderizarConsorcios() {
    const container = document.getElementById("contratosContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!contratoAtual) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-file-circle-xmark"></i>
                <h3>Nenhum consórcio encontrado</h3>
                <p>
                    Não existe um contrato disponível para este cliente.
                </p>
            </div>
        `;

        return;
    }

    const card = document.createElement("button");

    card.type = "button";
    card.className = "consorcio-card";

    card.innerHTML = `
        <div class="consorcio-card-topo">
            <div class="consorcio-card-icon">
                <i class="${obterIconeConsorcio(
        contratoAtual.tipoConsorcio
    )}"></i>
            </div>

            <div class="consorcio-card-titulo">
                <span class="consorcio-card-label">
                    ${escaparHtml(
        contratoAtual.plano?.nome ||
        "Consórcio"
    )}
                </span>

                <strong>
                    ${formatarMoeda(
        contratoAtual.valorCartaCredito
    )}
                </strong>
            </div>

            <span class="${obterClasseStatus(
        contratoAtual.status
    )}">
                ${escaparHtml(
        contratoAtual.status || "ATIVO"
    )}
            </span>
        </div>

        <div class="consorcio-card-dados">
            <div>
                <span>Grupo</span>
                <strong>
                    ${escaparHtml(
        contratoAtual.grupo || "-"
    )}
                </strong>
            </div>

            <div>
                <span>Cota</span>
                <strong>
                    ${escaparHtml(
        contratoAtual.cota || "-"
    )}
                </strong>
            </div>

            <div>
                <span>Parcelas</span>
                <strong>
                    ${Number(
        contratoAtual.quantidadeParcelas || 0
    )}
                </strong>
            </div>
        </div>

        <div class="consorcio-card-rodape">
            <div>
                <span>Próxima parcela</span>

                <strong>
                    ${proximaParcela
            ? formatarMoeda(proximaParcela.valor)
            : "Nenhuma pendente"
        }
                </strong>
            </div>

            <div class="consorcio-card-acessar">
                Ver parcelas
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </div>
    `;

    card.addEventListener("click", abrirParcelasDoConsorcio);

    container.appendChild(card);
}

/*==========================================================
ABRIR ÁREA DAS PARCELAS
==========================================================*/

function abrirParcelasDoConsorcio() {
    const listaContratos =
        document.getElementById("listaContratos");

    const areaParcelas =
        document.getElementById("areaParcelas");

    if (listaContratos) {
        listaContratos.style.display = "none";
    }

    if (areaParcelas) {
        areaParcelas.style.display = "block";
    }

    areaParcelasAberta = true;

    preencherResumoParcelas();
    renderizarHistorico(todasParcelas);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/*==========================================================
VOLTAR PARA OS CONSÓRCIOS
==========================================================*/

function voltarParaConsorcios() {
    const listaContratos =
        document.getElementById("listaContratos");

    const areaParcelas =
        document.getElementById("areaParcelas");

    fecharModal();

    if (areaParcelas) {
        areaParcelas.style.display = "none";
    }

    if (listaContratos) {
        listaContratos.style.display = "block";
    }

    areaParcelasAberta = false;
    parcelaSelecionada = null;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/*==========================================================
RESUMO DA PRÓXIMA PARCELA
==========================================================*/

function preencherResumoParcelas() {
    const valorElemento =
        document.getElementById("valorProximaParcela");

    const vencimentoElemento =
        document.getElementById("vencimentoProximaParcela");

    const statusElemento =
        document.getElementById("statusProximaParcela");

    if (!proximaParcela) {
        if (valorElemento) {
            valorElemento.textContent = "R$ 0,00";
        }

        if (vencimentoElemento) {
            vencimentoElemento.textContent =
                "Nenhuma parcela pendente.";
        }

        if (statusElemento) {
            statusElemento.textContent = "SEM PARCELAS";
            statusElemento.className = "badge badge-primary";
        }

        atualizarAcoesSuperiores(false);

        return;
    }

    if (valorElemento) {
        valorElemento.textContent =
            formatarMoeda(proximaParcela.valor);
    }

    if (vencimentoElemento) {
        vencimentoElemento.textContent =
            `Vence em ${formatarData(
                proximaParcela.vencimento
            )}`;
    }

    if (statusElemento) {
        statusElemento.textContent =
            proximaParcela.status || "-";

        statusElemento.className =
            obterClasseStatus(proximaParcela.status);
    }

    atualizarAcoesSuperiores(true);
}

/*==========================================================
ATIVAR/DESATIVAR AÇÕES SUPERIORES
==========================================================*/

function atualizarAcoesSuperiores(ativo) {
    [
        "btnBoleto",
        "btnPix",
        "btnComprovante"
    ].forEach(id => {
        const botao = document.getElementById(id);

        if (!botao) {
            return;
        }

        botao.disabled = !ativo;
        botao.style.opacity = ativo ? "1" : "0.45";
        botao.style.cursor =
            ativo ? "pointer" : "not-allowed";
    });
}

/*==========================================================
HISTÓRICO
==========================================================*/

function renderizarHistorico(parcelas) {
    const lista = document.getElementById("listaParcelas");

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    if (!parcelas || parcelas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-file-circle-xmark"></i>
                <h3>Nenhuma parcela encontrada</h3>
                <p>
                    Este consórcio ainda não possui parcelas.
                </p>
            </div>
        `;

        return;
    }

    const parcelasOrdenadas = [...parcelas].sort(
        (a, b) => Number(a.numero) - Number(b.numero)
    );

    parcelasOrdenadas.forEach(parcela => {
        const card = document.createElement("button");

        card.type = "button";

        card.className =
            `parcela-item ${normalizarStatus(
                parcela.status
            ).toLowerCase()}`;

        card.innerHTML = `
            <div class="parcela-topo">
                <div>
                    <div class="parcela-numero">
                        Parcela ${String(
            parcela.numero
        ).padStart(3, "0")}
                    </div>

                    <div class="parcela-data">
                        ${formatarData(
            parcela.vencimento
        )}
                    </div>
                </div>

                <span class="${obterClasseStatus(
            parcela.status
        )}">
                    ${escaparHtml(
            parcela.status || "-"
        )}
                </span>
            </div>

            <div class="parcela-valor">
                ${formatarMoeda(parcela.valor)}
            </div>

            <div class="parcela-seta">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        `;

        card.addEventListener("click", () => {
            abrirModal(parcela);
        });

        lista.appendChild(card);
    });
}

/*==========================================================
MODAL DA PARCELA
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
        parcela.status || "-";

    atualizarBotoesModal(parcela);

    document
        .getElementById("modalParcela")
        .classList.add("show");
}

function fecharModal() {
    const modal = document.getElementById("modalParcela");

    if (modal) {
        modal.classList.remove("show");
    }
}

/*==========================================================
BOTÕES DO MODAL
==========================================================*/

function atualizarBotoesModal(parcela) {
    const boletoDisponivel =
        Boolean(
            parcela?.bankSlipUrl ||
            parcela?.invoiceUrl
        );

    const pixDisponivel =
        Boolean(
            parcela?.pixQrCode ||
            parcela?.pixCopiaCola
        );

    const comprovanteDisponivel =
        normalizarStatus(parcela?.status) === "PAGA" &&
        Boolean(parcela?.invoiceUrl);

    definirBotaoDisponivel(
        "btnModalBoleto",
        boletoDisponivel
    );

    definirBotaoDisponivel(
        "btnModalPix",
        pixDisponivel
    );

    definirBotaoDisponivel(
        "btnModalCopiarPix",
        Boolean(parcela?.pixCopiaCola)
    );

    definirBotaoDisponivel(
        "btnModalComprovante",
        comprovanteDisponivel
    );
}

function definirBotaoDisponivel(id, disponivel) {
    const botao = document.getElementById(id);

    if (!botao) {
        return;
    }

    botao.disabled = !disponivel;
    botao.style.opacity = disponivel ? "1" : "0.45";
    botao.style.cursor =
        disponivel ? "pointer" : "not-allowed";
}

/*==========================================================
AÇÕES DA PRÓXIMA PARCELA
==========================================================*/

function abrirBoletoProximaParcela() {
    abrirBoletoDaParcela(proximaParcela);
}

function mostrarPixProximaParcela() {
    mostrarPixDaParcela(proximaParcela);
}

function abrirComprovanteProximaParcela() {
    abrirComprovanteDaParcela(proximaParcela);
}

/*==========================================================
AÇÕES DO MODAL
==========================================================*/

function abrirBoletoModal() {
    abrirBoletoDaParcela(parcelaSelecionada);
}

function mostrarPixModal() {
    mostrarPixDaParcela(parcelaSelecionada);
}

async function copiarPixModal() {
    await copiarPixDaParcela(parcelaSelecionada);
}

function abrirComprovanteModal() {
    abrirComprovanteDaParcela(parcelaSelecionada);
}

/*==========================================================
BOLETO
==========================================================*/

function abrirBoletoDaParcela(parcela) {
    if (!parcela) {
        alert("Nenhuma parcela selecionada.");
        return;
    }

    const url =
        parcela.bankSlipUrl ||
        parcela.invoiceUrl;

    if (!url) {
        alert("Boleto indisponível para esta parcela.");
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
}

/*==========================================================
PIX
==========================================================*/

function mostrarPixDaParcela(parcela) {
    if (!parcela?.pixQrCode) {
        alert("QR Code PIX indisponível para esta parcela.");
        return;
    }

    const janela = window.open("", "_blank");

    if (!janela) {
        alert(
            "O navegador bloqueou a abertura do PIX. " +
            "Libere os pop-ups e tente novamente."
        );

        return;
    }

    janela.document.open();

    janela.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>Pagamento via PIX</title>

            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    min-height: 100vh;
                    margin: 0;
                    padding: 24px;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    font-family: Arial, sans-serif;

                    color: #122033;
                    background: #f4f7fb;
                }

                .pix-container {
                    width: 100%;
                    max-width: 420px;

                    padding: 28px;

                    text-align: center;

                    background: #ffffff;

                    border: 1px solid #e4e9f0;
                    border-radius: 22px;

                    box-shadow:
                        0 18px 50px rgba(15, 79, 168, 0.14);
                }

                .pix-container h1 {
                    margin: 0 0 8px;

                    color: #0f4fa8;

                    font-size: 26px;
                }

                .pix-container p {
                    margin: 0 0 20px;

                    color: #667085;

                    font-size: 14px;
                    line-height: 1.5;
                }

                .pix-container img {
                    width: 100%;
                    max-width: 300px;

                    margin: 0 auto 20px;
                }

                .pix-info {
                    padding: 16px;

                    background: #f8fafc;

                    border-radius: 14px;
                }

                .pix-info strong {
                    display: block;

                    margin-top: 5px;

                    font-size: 20px;
                }
            </style>
        </head>

        <body>
            <main class="pix-container">
                <h1>Pagamento via PIX</h1>

                <p>
                    Aponte a câmera do seu celular para o
                    QR Code abaixo.
                </p>

                <img
                    src="data:image/png;base64,${parcela.pixQrCode}"
                    alt="QR Code PIX"
                >

                <div class="pix-info">
                    <span>Valor da parcela</span>

                    <strong>
                        ${formatarMoeda(parcela.valor)}
                    </strong>
                </div>
            </main>
        </body>
        </html>
    `);

    janela.document.close();
}

async function copiarPixDaParcela(parcela) {
    if (!parcela?.pixCopiaCola) {
        alert("Código PIX indisponível para esta parcela.");
        return;
    }

    try {
        await navigator.clipboard.writeText(
            parcela.pixCopiaCola
        );

        alert("Código PIX copiado com sucesso.");
    } catch (erro) {
        console.error("Erro ao copiar PIX:", erro);

        copiarTextoAlternativo(
            parcela.pixCopiaCola
        );
    }
}

function copiarTextoAlternativo(texto) {
    const textarea = document.createElement("textarea");

    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();
    document.execCommand("copy");

    document.body.removeChild(textarea);

    alert("Código PIX copiado com sucesso.");
}

/*==========================================================
COMPROVANTE
==========================================================*/

function abrirComprovanteDaParcela(parcela) {
    if (!parcela) {
        alert("Nenhuma parcela selecionada.");
        return;
    }

    if (normalizarStatus(parcela.status) !== "PAGA") {
        alert("Esta parcela ainda não foi paga.");
        return;
    }

    if (!parcela.invoiceUrl) {
        alert("Comprovante indisponível.");
        return;
    }

    window.open(
        parcela.invoiceUrl,
        "_blank",
        "noopener,noreferrer"
    );
}

/*==========================================================
STATUS
==========================================================*/

function normalizarStatus(status) {
    const valor = String(status || "").toUpperCase();

    if (valor === "PAGO") {
        return "PAGA";
    }

    if (valor === "ATRASADO") {
        return "VENCIDA";
    }

    return valor;
}

function obterClasseStatus(status) {
    switch (normalizarStatus(status)) {
        case "PAGA":
            return "badge badge-success";

        case "PENDENTE":
            return "badge badge-warning";

        case "VENCIDA":
            return "badge badge-danger";

        case "CANCELADA":
        case "ESTORNADA":
            return "badge badge-danger";

        case "ATIVO":
            return "badge badge-success";

        case "QUITADO":
        case "CONTEMPLADO":
            return "badge badge-primary";

        case "INADIMPLENTE":
            return "badge badge-danger";

        default:
            return "badge badge-primary";
    }
}

/*==========================================================
ÍCONE DO CONSÓRCIO
==========================================================*/

function obterIconeConsorcio(tipo) {
    switch (String(tipo || "").toUpperCase()) {
        case "CARRO":
            return "fa-solid fa-car";

        case "MOTO":
            return "fa-solid fa-motorcycle";

        case "IMOVEL":
            return "fa-solid fa-house";

        case "CAMINHAO":
            return "fa-solid fa-truck";

        case "SERVICO":
            return "fa-solid fa-screwdriver-wrench";

        default:
            return "fa-solid fa-file-contract";
    }
}

/*==========================================================
FORMATAÇÃO
==========================================================*/

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

function formatarData(data) {
    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleDateString("pt-BR");
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/*==========================================================
LOADING
==========================================================*/

function mostrarLoadingContratos() {
    const container =
        document.getElementById("contratosContainer");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-state">
            <div class="spinner"></div>

            <p style="margin-top: 18px;">
                Carregando consórcios...
            </p>
        </div>
    `;
}
