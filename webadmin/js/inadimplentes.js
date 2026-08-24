let inadimplentes = [];

document.addEventListener("DOMContentLoaded", () => {
    verificarLogin();
    document.getElementById("buscaInadimplente")?.addEventListener("input", renderizarLista);
    document.addEventListener("click", tratarAcao);
    carregar();
});

async function carregar() {
    try {
        const { response, data } = await http.get("/dashboard/inadimplentes");
        if (!response.ok || !data?.sucesso) throw new Error(data?.mensagem || "Erro ao carregar inadimplentes.");
        inadimplentes = data.dados || [];
        setText("qtdClientes", data.resumo?.clientes || 0);
        setText("qtdParcelas", data.resumo?.parcelas || 0);
        setText("valorTotal", moeda(data.resumo?.valor));
        renderizarLista();
    } catch (erro) {
        document.getElementById("listaInadimplentes").innerHTML = `<tr><td colspan="7">${esc(erro.message)}</td></tr>`;
    }
}

function renderizarLista() {
    const q = String(document.getElementById("buscaInadimplente")?.value || "").toLowerCase().trim();
    const lista = inadimplentes.filter(item => !q || [item.cliente, item.numeroContrato, item.grupo, item.cota, item.plano].join(" ").toLowerCase().includes(q));
    const tbody = document.getElementById("listaInadimplentes");
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="table-state-cell">Nenhuma cobrança em atraso encontrada.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(item => `
        <tr>
            <td><a href="cliente-detalhe.html?id=${item.clienteId}"><strong>${esc(item.cliente)}</strong></a></td>
            <td>${esc(item.numeroContrato || `#${item.contratoId}`)}<br><small>G ${esc(item.grupo || "—")} / C ${esc(item.cota || "—")}</small></td>
            <td>${item.numeroParcela}</td>
            <td>${new Date(item.vencimento).toLocaleDateString("pt-BR")}</td>
            <td><span class="badge badge-danger">${item.diasAtraso} dia(s)</span></td>
            <td><strong>${moeda(item.valor)}</strong></td>
            <td class="action-row">
                <button class="btn btn-sm btn-primary" data-boleto="${item.contratoId}:${item.parcelaId}"><i class="fa-solid fa-barcode"></i>Boleto</button>
                <button class="btn btn-sm btn-success" data-whatsapp="${item.parcelaId}"><i class="fa-brands fa-whatsapp"></i>WhatsApp</button>
            </td>
        </tr>
    `).join("");
    window.decorateStackedTables?.(tbody.closest("table"));
}

async function tratarAcao(event) {
    const boleto = event.target.closest("[data-boleto]");
    if (boleto) {
        const [contratoId, parcelaId] = boleto.dataset.boleto.split(":");
        const janela = window.open("", "_blank");
        boleto.disabled = true;
        try {
            const { response, data } = await http.get(`/contratos/${contratoId}/parcelas/${parcelaId}/boleto`);
            if (!response.ok || !data?.sucesso || !data?.dados?.url) throw new Error(data?.mensagem || "Boleto indisponível.");
            janela ? janela.location.replace(data.dados.url) : window.open(data.dados.url, "_blank", "noopener,noreferrer");
        } catch (erro) {
            janela?.close(); alert(erro.message);
        } finally { boleto.disabled = false; }
        return;
    }

    const whats = event.target.closest("[data-whatsapp]");
    if (whats) {
        const item = inadimplentes.find(i => i.parcelaId === Number(whats.dataset.whatsapp));
        if (!item) return;
        const telefone = String(item.telefone || "").replace(/\D/g, "");
        if (!telefone) { alert("Cliente sem telefone cadastrado."); return; }
        whats.disabled = true;
        try {
            const { response, data } = await http.get(`/contratos/${item.contratoId}/parcelas/${item.parcelaId}/boleto`);
            if (!response.ok || !data?.sucesso || !data?.dados?.url) throw new Error(data?.mensagem || "Não foi possível gerar a segunda via.");
            const numero = telefone.startsWith("55") ? telefone : `55${telefone}`;
            const texto = `Olá, ${item.cliente}. A parcela ${item.numeroParcela} do seu consórcio, no valor de ${moeda(item.valor)}, venceu em ${new Date(item.vencimento).toLocaleDateString("pt-BR")}. Segue a segunda via atualizada do boleto: ${data.dados.url}`;
            window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
        } catch (erro) {
            alert(erro.message || "Não foi possível preparar a cobrança pelo WhatsApp.");
        } finally {
            whats.disabled = false;
        }
    }
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function moeda(v) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function esc(v) { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
