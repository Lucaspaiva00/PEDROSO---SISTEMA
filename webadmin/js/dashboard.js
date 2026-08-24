let graficoRecebimentos = null;

document.addEventListener("DOMContentLoaded", () => {
    verificarLogin();
    document.getElementById("btnLogout")?.addEventListener("click", logout);
    carregarDashboardExecutivo();
});

async function carregarDashboardExecutivo() {
    try {
        const { response, data } = await http.get("/dashboard/executivo");
        if (response.status === 401) return;
        if (!response.ok || !data?.sucesso) throw new Error(data?.mensagem || "Não foi possível carregar o painel executivo.");
        renderizarDashboard(data.dados);
    } catch (erro) {
        console.error(erro);
        mostrarFeedback?.("feedbackDashboard", "error", "Erro", erro.message || "Falha ao carregar o dashboard.");
    }
}

function renderizarDashboard(dados) {
    const carteira = dados.carteira || {};
    const financeiro = dados.financeiro || {};

    setText("valorCartas", moeda(carteira.valorCartas));
    setText("resumoCarteira", `${carteira.contratos || 0} contratos • ${carteira.clientes || 0} clientes`);
    setText("clientes", carteira.clientes || 0);
    setText("contratos", carteira.contratos || 0);
    setText("recebidoMes", moeda(financeiro.recebidoMes));
    setText("previstoMes", moeda(financeiro.previstoMes));
    setText("inadimplenciaValor", moeda(financeiro.valorInadimplente));
    setText("taxaInadimplencia", `${Number(financeiro.taxaInadimplencia || 0).toLocaleString("pt-BR")} %`);
    setText("ativos", carteira.ativos || 0);
    setText("contemplados", carteira.contemplados || 0);
    setText("pausados", carteira.pausados || 0);
    setText("cancelados", carteira.cancelados || 0);
    setText("saudePrevisto", moeda(financeiro.previstoMes));
    setText("saudeRecebido", moeda(financeiro.recebidoMes));
    setText("saudeAberto", moeda(financeiro.abertoMes));
    setText("clientesAtraso", financeiro.clientesInadimplentes || 0);

    const percentual = financeiro.previstoMes > 0
        ? Math.min(100, Math.round((financeiro.recebidoMes / financeiro.previstoMes) * 100))
        : 0;
    const barra = document.getElementById("barraRecebido");
    if (barra) barra.style.width = `${percentual}%`;
    setText("percentualRecebido", `${percentual}% do previsto para o mês já recebido`);

    renderizarGrafico(dados.recebimentos || []);
    renderizarAssembleias(dados.proximasAssembleias || []);
    renderizarContratos(dados.ultimosContratos || []);
    renderizarAtividades(dados.atividades || []);
}

function renderizarGrafico(itens) {
    const canvas = document.getElementById("graficoRecebimentos");
    if (!canvas || typeof Chart === "undefined") return;
    if (graficoRecebimentos) graficoRecebimentos.destroy();
    graficoRecebimentos = new Chart(canvas, {
        type: "bar",
        data: {
            labels: itens.map(i => i.label),
            datasets: [{ label: "Recebido", data: itens.map(i => i.valor), borderRadius: 8 }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => moeda(ctx.raw) } } },
            scales: { y: { beginAtZero: true, ticks: { callback: valor => `R$ ${Number(valor).toLocaleString("pt-BR")}` } } }
        }
    });
}

function renderizarAssembleias(itens) {
    const el = document.getElementById("proximasAssembleias");
    if (!el) return;
    if (!itens.length) {
        el.innerHTML = '<div class="empty-inline">Nenhuma assembleia futura cadastrada.</div>';
        return;
    }
    el.innerHTML = itens.map(item => `
        <a class="agenda-item" href="assembleias.html">
            <span class="agenda-date"><strong>${new Date(item.dataAssembleia).toLocaleDateString("pt-BR", { day: "2-digit" })}</strong><small>${new Date(item.dataAssembleia).toLocaleDateString("pt-BR", { month: "short" })}</small></span>
            <div><strong>${esc(item.titulo || `Grupo ${item.grupo}`)}</strong><span>Grupo ${esc(item.grupo)} • ${item.totalLances} lance(s)</span></div>
            <i class="fa-solid fa-chevron-right"></i>
        </a>
    `).join("");
}

function renderizarContratos(itens) {
    const tbody = document.getElementById("ultimosContratos");
    if (!tbody) return;
    if (!itens.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell">Nenhum contrato cadastrado.</td></tr>';
        return;
    }
    tbody.innerHTML = itens.map(item => `
        <tr>
            <td><a href="cliente-detalhe.html?id=${item.clienteId}"><strong>${esc(item.cliente || "—")}</strong></a></td>
            <td>${esc(item.plano || "—")}</td>
            <td>${moeda(item.valorCarta)}</td>
            <td><span class="badge ${classeStatus(item.status)}">${esc(item.status)}</span></td>
        </tr>
    `).join("");
    window.decorateStackedTables?.(tbody.closest("table"));
}

function classeStatus(status) {
    if (["ATIVO", "CONTEMPLADO", "QUITADO"].includes(status)) return "badge-success";
    if (["CANCELADO", "INADIMPLENTE"].includes(status)) return "badge-danger";
    return "badge-warning";
}

function setText(id, valor) { const el = document.getElementById(id); if (el) el.textContent = valor; }
function moeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function esc(texto) { return String(texto ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function renderizarAtividades(itens) {
    const el = document.getElementById("atividadesRecentes");
    if (!el) return;
    if (!itens.length) { el.innerHTML = '<div class="empty-inline">Nenhuma movimentação recente.</div>'; return; }
    el.innerHTML = itens.map(item => `
        <div class="activity-item">
            <span class="activity-icon"><i class="fa-solid fa-${esc(item.icone || "circle-info")}"></i></span>
            <div><strong>${esc(item.titulo)}</strong><span>${esc(item.descricao)}</span></div>
            <time>${new Date(item.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
        </div>`).join("");
}
