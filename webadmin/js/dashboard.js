let graficoInstancia = null;

document.addEventListener("DOMContentLoaded", () => {
    verificarLogin();
    document.getElementById("btnLogout")?.addEventListener("click", logout);
    carregarDashboardAdmin();
});

async function carregarDashboardAdmin() {
    definirKpi("clientes", "—");
    definirKpi("planos", "—");
    definirKpi("contratos", "—");
    definirKpi("parcelas", "—");
    preencherTabelaCarregando();

    try {
        const [resClientes, resPlanos, resContratos] = await Promise.all([
            http.get("/clientes"),
            http.get("/planos"),
            http.get("/contratos")
        ]);

        if ([resClientes, resPlanos, resContratos].some(r => r.response.status === 401)) {
            return;
        }

        const jsonClientes = resClientes.data;
        const jsonPlanos = resPlanos.data;
        const jsonContratos = resContratos.data;

        if (!jsonClientes.sucesso || !jsonPlanos.sucesso || !jsonContratos.sucesso) {
            throw new Error("Não foi possível carregar os indicadores.");
        }

        const clientes = jsonClientes.clientes || [];
        const planos = jsonPlanos.planos || [];
        const contratos = jsonContratos.contratos || [];

        definirKpi("clientes", clientes.length);
        definirKpi("planos", planos.length);
        definirKpi("contratos", contratos.length);
        definirKpi("parcelas", contarParcelasPendentes(contratos));

        renderizarUltimosContratos(contratos.slice(0, 5));
        renderizarGrafico(contratos);
        atualizarResumoGrafico(contratos);
    } catch (erro) {
        console.error(erro);
        mostrarFeedback("feedbackDashboard", "error", "Erro", erro.message || "Falha ao carregar o dashboard.");
        preencherTabelaErro();
    }
}

function contarParcelasPendentes(contratos) {
    return contratos.reduce((total, contrato) => {
        const parcelas = contrato.parcelas || [];
        return total + parcelas.filter(p => p.status === "PENDENTE").length;
    }, 0);
}

function definirKpi(id, valor) {
    const el = document.getElementById(id);

    if (el) {
        el.textContent = valor;
    }
}

function preencherTabelaCarregando() {
    const tbody = document.getElementById("ultimosContratos");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="table-state-cell">
                <span class="empty-inline">
                    <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                    Carregando contratos…
                </span>
            </td>
        </tr>
    `;
}

function preencherTabelaErro() {
    const tbody = document.getElementById("ultimosContratos");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="table-state-cell">
                <span class="empty-inline">Não foi possível listar os contratos.</span>
            </td>
        </tr>
    `;
}

function esc(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function renderizarUltimosContratos(contratos) {
    const tbody = document.getElementById("ultimosContratos");

    if (!tbody) {
        return;
    }

    if (!contratos.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="table-state-cell">
                    <span class="empty-inline">
                        <i class="fa-solid fa-inbox" aria-hidden="true"></i>
                        Nenhum contrato cadastrado.
                    </span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = contratos.map(contrato => {
        const cliente = esc(contrato.cliente?.nome || "—");
        const plano = esc(contrato.plano?.nome || "—");
        const valor = formatarMoeda(contrato.valorCarta);
        const status = esc(contrato.status || "—");
        const badge = contrato.status === "ATIVO" ? "badge-success" : "badge-warning";

        return `
            <tr>
                <td>${cliente}</td>
                <td>${plano}</td>
                <td>${valor}</td>
                <td><span class="badge ${badge}">${status}</span></td>
            </tr>
        `;
    }).join("");
}

function renderizarGrafico(contratos) {
    const canvas = document.getElementById("graficoContratos");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const { labels, valores } = agruparContratosPorMes(contratos);

    if (graficoInstancia) {
        graficoInstancia.destroy();
    }

    graficoInstancia = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Contratos",
                data: valores,
                backgroundColor: "rgba(13, 78, 166, 0.75)",
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

function agruparContratosPorMes(contratos) {
    const meses = [];

    for (let i = 5; i >= 0; i -= 1) {
        const data = new Date();
        data.setDate(1);
        data.setHours(0, 0, 0, 0);
        data.setMonth(data.getMonth() - i);
        meses.push({
            chave: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`,
            label: data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        });
    }

    const contagem = Object.fromEntries(meses.map(m => [m.chave, 0]));

    contratos.forEach(contrato => {
        if (!contrato.criadoEm) {
            return;
        }

        const data = new Date(contrato.criadoEm);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

        if (chave in contagem) {
            contagem[chave] += 1;
        }
    });

    return {
        labels: meses.map(m => m.label),
        valores: meses.map(m => contagem[m.chave])
    };
}

function atualizarResumoGrafico(contratos) {
    const el = document.getElementById("resumoGraficoContratos");

    if (!el) {
        return;
    }

    const { labels, valores } = agruparContratosPorMes(contratos);
    const partes = labels.map((label, i) => `${label}: ${valores[i]}`);
    el.textContent = `Contratos nos últimos 6 meses — ${partes.join(", ")}.`;
}
