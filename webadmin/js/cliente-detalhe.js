
verificarLogin();

let clienteId = null;
let clienteAtualAdmin = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    clienteId = Number(params.get("id"));

    if (!clienteId) {
        mostrarErro("Link inválido", "Informe um cliente na lista de clientes.");
        return;
    }

    carregarDetalhe();

    document.getElementById("listaContratosCliente")?.addEventListener("click", async (event) => {
        const botaoBoleto = event.target.closest("[data-boleto-parcela]");
        if (botaoBoleto) {
            const contratoId = Number(botaoBoleto.dataset.contratoId);
            const parcelaId = Number(botaoBoleto.dataset.boletoParcela);
            await abrirBoletoAdmin(contratoId, parcelaId, botaoBoleto);
            return;
        }

        const botaoWhatsapp = event.target.closest("[data-whatsapp-parcela]");
        if (botaoWhatsapp) {
            const contratoId = Number(botaoWhatsapp.dataset.contratoId);
            const parcelaId = Number(botaoWhatsapp.dataset.whatsappParcela);
            const numeroParcela = Number(botaoWhatsapp.dataset.numeroParcela);
            const valor = Number(botaoWhatsapp.dataset.valorParcela);
            await enviarBoletoWhatsAppAdmin(contratoId, parcelaId, numeroParcela, valor, botaoWhatsapp);
        }
    });
});

async function carregarDetalhe() {
    mostrarLoading(true);

    try {
        const { response, data: json } = await http.get(`/clientes/${clienteId}/detalhe`);

        if (!json.sucesso) {
            mostrarErro(
                "Não foi possível carregar",
                json.mensagem || "Cliente não encontrado."
            );
            return;
        }

        renderizarCliente(json.cliente, json.contratos || []);
        mostrarPainel();
    } catch {
        mostrarErro(
            "Falha de conexão",
            "Verifique se a API está ativa e tente atualizar a página."
        );
    } finally {
        mostrarLoading(false);
    }
}

function mostrarLoading(ativo) {
    document.getElementById("estadoLoading").hidden = !ativo;
}

function mostrarErro(titulo, texto) {
    document.getElementById("painelCliente").hidden = true;
    document.getElementById("estadoErro").hidden = false;
    document.getElementById("tituloErro").textContent = titulo;
    document.getElementById("textoErro").textContent = texto;
    document.getElementById("tituloCliente").textContent = "Cliente";
}

function mostrarPainel() {
    document.getElementById("estadoErro").hidden = true;
    document.getElementById("painelCliente").hidden = false;
}

function renderizarCliente(cliente, contratos) {
    clienteAtualAdmin = cliente;
    document.getElementById("tituloCliente").textContent = cliente.nome;
    document.getElementById("subtituloCliente").textContent =
        `${cliente.cpfCnpj || ""} • ${contratos.length} consórcio(s)`;

    document.getElementById("gridDadosCliente").innerHTML = `
        <div><span>CPF/CNPJ</span><strong>${esc(cliente.cpfCnpj)}</strong></div>
        <div><span>E-mail</span><strong>${esc(cliente.email || "—")}</strong></div>
        <div><span>Telefone</span><strong>${esc(cliente.telefone || "—")}</strong></div>
        <div><span>Status</span><strong>${esc(cliente.status)}</strong></div>
        <div><span>Cidade</span><strong>${esc(cliente.cidade || "—")} / ${esc(cliente.estado || "—")}</strong></div>
    `;

    document.getElementById("totalContratosResumo").textContent =
        `${contratos.length} contrato(s) vinculado(s)`;

    const container = document.getElementById("listaContratosCliente");

    if (!contratos.length) {
        container.innerHTML = `
            <div class="empty-inline" style="padding:20px;">
                <i class="fa-solid fa-file-circle-xmark" aria-hidden="true"></i>
                <strong>Nenhum consórcio</strong>
                <p>Este cliente ainda não possui contratos cadastrados.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = contratos.map(contrato => renderContratoCard(contrato)).join("");

    contratos.forEach(contrato => {
        const tabela = document.getElementById(`lances-contrato-${contrato.id}`);

        if (tabela) {
            vincularAcoesLances(tabela, carregarDetalhe, "feedbackCliente");
        }
    });
}

function renderContratoCard(contrato) {
    const lances = contrato.lances || [];
    const statusClasse = contrato.status === "CONTEMPLADO"
        ? "badge-success"
        : contrato.status === "ATIVO"
            ? "badge-primary"
            : "badge-warning";

    const linhasLances = lances.length
        ? lances.map(lance => {
            const data = new Date(lance.criadoEm).toLocaleString("pt-BR");
            const assembleia = lance.assembleia || {};
            const dataAsm = assembleia.dataAssembleia
                ? new Date(assembleia.dataAssembleia).toLocaleDateString("pt-BR")
                : "—";

            const acoes = lance.status === "REGISTRADO"
                ? `
                    <button type="button" class="btn btn-sm btn-primary" data-aprovar-lance="${lance.id}">
                        Aprovar
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" data-reprovar-lance="${lance.id}">
                        Reprovar
                    </button>
                `
                : "—";

            return `
                <tr>
                    <td>${esc(assembleia.titulo || `Grupo ${assembleia.grupo || "—"}`)}</td>
                    <td>${dataAsm}</td>
                    <td><strong>${formatarMoedaLance(lance.valor)}</strong></td>
                    <td>${data}</td>
                    <td>${badgeStatusLance(lance.status)}</td>
                    <td class="acoes-lance">${acoes}</td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="6" class="text-center">Nenhum lance neste contrato.</td>
            </tr>
        `;

    return `
        <article class="contrato-cliente-card">
            <header class="contrato-cliente-header">
                <div>
                    <h4>
                        ${esc(contrato.plano?.nome || "Consórcio")}
                        <span class="badge ${statusClasse}">${esc(contrato.status)}</span>
                    </h4>
                    <p>
                        Contrato ${esc(contrato.numeroContrato || `#${contrato.id}`)}
                        • Grupo ${esc(contrato.grupo || "—")} / Cota ${esc(contrato.cota || "—")}
                    </p>
                </div>
                <div class="contrato-cliente-valores">
                    <div>
                        <span>Carta</span>
                        <strong>${formatarMoedaLance(contrato.valorCarta)}</strong>
                    </div>
                    <div>
                        <span>Parcela</span>
                        <strong>${formatarMoedaLance(contrato.valorParcela)}</strong>
                    </div>
                    <div>
                        <span>Progresso</span>
                        <strong>${contrato.parcelasPagas}/${contrato.quantidadeParcelas}</strong>
                    </div>
                </div>
            </header>

            ${renderParcelasContrato(contrato)}

            <div class="table-responsive">
                <table class="table" id="lances-contrato-${contrato.id}" aria-label="Lances do contrato ${esc(contrato.numeroContrato || contrato.id)}">
                    <thead>
                        <tr>
                            <th>Assembleia</th>
                            <th>Data</th>
                            <th>Valor</th>
                            <th>Enviado em</th>
                            <th>Status</th>
                            <th width="180">Ações</th>
                        </tr>
                    </thead>
                    <tbody>${linhasLances}</tbody>
                </table>
            </div>
        </article>
    `;
}

function renderParcelasContrato(contrato) {
    const parcelas = contrato.parcelas || [];

    if (!parcelas.length) {
        return '<p class="empty-inline" style="margin:16px 0;">Nenhuma parcela cadastrada.</p>';
    }

    const linhas = parcelas.map(parcela => {
        const podeBoleto = ["PENDENTE", "VENCIDA"].includes(String(parcela.status || "").toUpperCase());
        return `
            <tr>
                <td>${parcela.numero}</td>
                <td>${new Date(parcela.vencimento).toLocaleDateString("pt-BR")}</td>
                <td>${formatarMoedaLance(parcela.valor)}</td>
                <td><span class="badge ${parcela.status === "PAGA" ? "badge-success" : parcela.status === "VENCIDA" ? "badge-warning" : parcela.status === "CANCELADA" ? "badge-danger" : "badge-primary"}">${esc(parcela.status)}</span></td>
                <td>
                    ${podeBoleto ? `
                        <button type="button" class="btn btn-sm btn-primary" data-boleto-parcela="${parcela.id}" data-contrato-id="${contrato.id}">
                            <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i>
                            Baixar boleto
                        </button>
                        <button type="button" class="btn btn-sm btn-success" data-whatsapp-parcela="${parcela.id}" data-contrato-id="${contrato.id}" data-numero-parcela="${parcela.numero}" data-valor-parcela="${parcela.valor}">
                            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
                            WhatsApp
                        </button>
                    ` : "—"}
                </td>
            </tr>
        `;
    }).join("");

    return `
        <div class="table-responsive" style="margin:16px 0 22px;">
            <table class="table" aria-label="Parcelas do contrato ${esc(contrato.numeroContrato || contrato.id)}">
                <thead>
                    <tr>
                        <th>Parcela</th>
                        <th>Vencimento</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th width="190">Boleto</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `;
}

async function abrirBoletoAdmin(contratoId, parcelaId, botao) {
    const janela = window.open("", "_blank");
    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando boleto';

    try {
        const { response, data } = await http.get(
            `/contratos/${contratoId}/parcelas/${parcelaId}/boleto`
        );

        if (!response.ok || !data?.sucesso || !data?.dados?.url) {
            throw new Error(data?.mensagem || "Não foi possível obter o boleto.");
        }

        janela ? janela.location.replace(data.dados.url) : window.open(data.dados.url, "_blank", "noopener,noreferrer");
    } catch (erro) {
        if (janela) janela.close();
        mostrarFeedback("feedbackCliente", "error", "Boleto", erro.message || "Não foi possível obter o boleto.");
    } finally {
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
    }
}

function esc(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

async function enviarBoletoWhatsAppAdmin(contratoId, parcelaId, numeroParcela, valor, botao) {
    const telefone = String(clienteAtualAdmin?.telefone || "").replace(/\D/g, "");
    if (!telefone) {
        mostrarFeedback("feedbackCliente", "error", "WhatsApp", "Este cliente não possui telefone cadastrado.");
        return;
    }

    const original = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando';

    try {
        const { response, data } = await http.get(`/contratos/${contratoId}/parcelas/${parcelaId}/boleto`);
        if (!response.ok || !data?.sucesso || !data?.dados?.url) {
            throw new Error(data?.mensagem || "Não foi possível gerar a segunda via.");
        }

        const numero = telefone.startsWith("55") ? telefone : `55${telefone}`;
        const nome = clienteAtualAdmin?.nome || "cliente";
        const texto = `Olá, ${nome}. Segue a segunda via atualizada da parcela ${numeroParcela}, no valor de ${formatarMoedaLance(valor)}: ${data.dados.url}`;
        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    } catch (erro) {
        mostrarFeedback("feedbackCliente", "error", "WhatsApp", erro.message || "Não foi possível preparar o boleto.");
    } finally {
        botao.disabled = false;
        botao.innerHTML = original;
    }
}
