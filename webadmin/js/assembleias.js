const FEEDBACK_ID = "feedbackAssembleias";

verificarLogin();

let assembleiaAnaliseId = null;

document.addEventListener("DOMContentLoaded", () => {
    carregarAssembleias();
    registrarEventos();
});

function feedbackAssembleia(tipo, titulo, mensagem) {
    mostrarFeedback(FEEDBACK_ID, tipo, titulo, mensagem);
}

function registrarEventos() {
    document.getElementById("btnAbrirLancesGrupo")?.addEventListener("click", abrirModal);

    document.getElementById("btnFecharModal")?.addEventListener("click", fecharModal);
    document.getElementById("btnCancelarAssembleia")?.addEventListener("click", fecharModal);

    document.getElementById("formAbrirLances")?.addEventListener("submit", confirmarAbrirLances);

    document.getElementById("btnContemplarMaior")?.addEventListener("click", contemplarMaior);
}

async function abrirModal() {
    await popularGrupos();
    const modal = document.getElementById("modalAssembleia");
    if (modal) {
        modal.classList.add("show");
    }
}

function fecharModal() {
    const modal = document.getElementById("modalAssembleia");
    if (modal) {
        modal.classList.remove("show");
    }
    document.getElementById("formAbrirLances")?.reset();
}

async function popularGrupos() {
    const select = document.getElementById("selectGrupoLances");
    const wrapSelect = document.getElementById("wrapSelectGrupo");
    const wrapManual = document.getElementById("wrapGrupoManual");
    const inputManual = document.getElementById("inputGrupoManual");

    if (!select || !wrapSelect || !wrapManual) {
        return;
    }

    select.innerHTML = "<option value=\"\">Selecione o grupo…</option>";

    try {
        const { data: json } = await http.get("/assembleias/grupos");
        const grupos = json.sucesso ? json.grupos || [] : [];

        if (!grupos.length) {
            wrapSelect.hidden = true;
            wrapManual.hidden = false;
            select.removeAttribute("required");
            inputManual?.setAttribute("required", "required");
            return;
        }

        wrapSelect.hidden = false;
        wrapManual.hidden = true;
        select.setAttribute("required", "required");
        inputManual?.removeAttribute("required");

        grupos.forEach(grupo => {
            const option = document.createElement("option");
            option.value = grupo;
            option.textContent = grupo;
            select.appendChild(option);
        });
    } catch {
        wrapSelect.hidden = true;
        wrapManual.hidden = false;
        select.removeAttribute("required");
        inputManual?.setAttribute("required", "required");
    }
}

function obterGrupoDoFormulario() {
    const select = document.getElementById("selectGrupoLances");
    const manual = document.getElementById("inputGrupoManual");
    const wrapManual = document.getElementById("wrapGrupoManual");

    if (wrapManual && !wrapManual.hidden) {
        return manual?.value?.trim() || "";
    }

    return select?.value?.trim() || "";
}

async function confirmarAbrirLances(evento) {
    evento.preventDefault();

    const grupo = obterGrupoDoFormulario();

    if (!grupo) {
        feedbackAssembleia("error", "Grupo obrigatório", "Selecione ou informe o grupo do consórcio.");
        return;
    }

    const titulo = document.getElementById("tituloRodada")?.value?.trim() || undefined;
    const dataAssembleia = document.getElementById("dataRodada")?.value || undefined;

    const botao = evento.target.querySelector("button[type=\"submit\"]");
    if (botao) {
        botao.disabled = true;
    }

    try {
        const { data: json } = await http.post("/assembleias/abrir-lances-grupo", {
            grupo,
            titulo,
            dataAssembleia
        });

        if (!json.sucesso) {
            feedbackAssembleia("error", "Não foi possível abrir", json.mensagem || "Tente novamente.");
            return;
        }

        feedbackAssembleia(
            "success",
            "Lances abertos",
            json.mensagem || "Clientes do grupo já podem dar lance no portal."
        );
        fecharModal();
        carregarAssembleias();
    } catch {
        feedbackAssembleia(
            "error",
            "Falha de conexão",
            "Não conseguimos contactar o servidor. Verifique a rede e tente de novo."
        );
    } finally {
        if (botao) {
            botao.disabled = false;
        }
    }
}

async function carregarAssembleias() {
    const { data: json } = await http.get("/assembleias");

    if (!json.sucesso) {
        feedbackAssembleia("error", "Erro", json.mensagem || "Erro ao listar rodadas.");
        return;
    }

    const tbody = document.getElementById("tbodyAssembleias");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = (json.assembleias || []).map(item => {
        const data = new Date(item.dataAssembleia).toLocaleString("pt-BR");
        const status = item.encerrada
            ? "Encerrada"
            : item.aceitaLances
                ? "Lances abertos"
                : "Aguardando";

        return `
            <tr>
                <td>${esc(item.grupo)}</td>
                <td>${esc(item.titulo || "-")}</td>
                <td>${data}</td>
                <td>${item.totalLances}</td>
                <td>${status}</td>
                <td>
                    <div class="table-link-actions">
                    <button type="button" class="btn-link" data-analisar="${item.id}">Analisar</button>
                    ${!item.encerrada && !item.aceitaLances
                        ? `<button type="button" class="btn-link" data-abrir="${item.id}">Abrir lances</button>`
                        : ""}
                    ${!item.encerrada
                        ? `<button type="button" class="btn-link btn-link-muted" data-encerrar="${item.id}">Encerrar</button>`
                        : ""}
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    window.decorateStackedTables?.(tbody.closest("table"));

    tbody.querySelectorAll("[data-analisar]").forEach(botao => {
        botao.addEventListener("click", () => analisar(botao.dataset.analisar));
    });

    tbody.querySelectorAll("[data-abrir]").forEach(botao => {
        botao.addEventListener("click", () => abrirLances(botao.dataset.abrir));
    });

    tbody.querySelectorAll("[data-encerrar]").forEach(botao => {
        botao.addEventListener("click", () => encerrar(botao.dataset.encerrar));
    });
}

async function abrirLances(id) {
    const { data: json } = await http.patch(`/assembleias/${id}/abrir-lances`);
    feedbackAssembleia(
        json.sucesso ? "success" : "error",
        json.sucesso ? "Sucesso" : "Erro",
        json.mensagem || (json.sucesso ? "Lances abertos." : "Não foi possível abrir lances.")
    );
    carregarAssembleias();
}

async function encerrar(id) {
    if (!confirm("Encerrar esta rodada sem contemplar?")) {
        return;
    }

    const { data: json } = await http.patch(`/assembleias/${id}/encerrar`);
    feedbackAssembleia(
        json.sucesso ? "success" : "error",
        json.sucesso ? "Sucesso" : "Erro",
        json.mensagem || (json.sucesso ? "Rodada encerrada." : "Erro ao encerrar.")
    );
    carregarAssembleias();
}

async function analisar(id) {
    assembleiaAnaliseId = Number(id);

    const { data: json } = await http.get(`/assembleias/${id}/analise`);

    if (!json.sucesso) {
        feedbackAssembleia("error", "Erro", json.mensagem || "Erro na análise.");
        return;
    }

    document.getElementById("cardAnalise").style.display = "block";
    document.getElementById("tituloAnalise").textContent =
        `Grupo ${json.assembleia.grupo} — ${json.totalLances} lance(s)`;

    const tbody = document.getElementById("tbodyRanking");

    tbody.innerHTML = (json.ranking || []).map(item => `
        <tr>
            <td>${item.posicao}º</td>
            <td>${esc(item.numeroContrato || item.contratoId)}</td>
            <td>${esc(item.cliente)}</td>
            <td>${esc(item.cota || "-")}</td>
            <td>${formatarMoeda(item.valor)}</td>
            <td>${esc(item.status)}</td>
            <td>
                ${item.status === "REGISTRADO"
                    ? `
                        <div class="table-link-actions">
                        <button type="button" class="btn-link" data-aprovar-lance="${item.lanceId}">Aprovar</button>
                        <button type="button" class="btn-link btn-link-danger" data-reprovar-lance="${item.lanceId}">Reprovar</button>
                        </div>
                    `
                    : ""}
            </td>
        </tr>
    `).join("");

    window.decorateStackedTables?.(document.getElementById("tbodyRanking")?.closest("table"));

    const tabela = document.getElementById("tbodyRanking")?.closest("table");

    if (tabela && typeof vincularAcoesLances === "function") {
        vincularAcoesLances(tabela, () => {
            carregarAssembleias();
            analisar(assembleiaAnaliseId);
        }, "feedbackLancesAssembleia");
    }
}

async function contemplar(lanceId) {
    if (!assembleiaAnaliseId) {
        return;
    }

    if (!confirm("Contemplar este lance e marcar contrato como CONTEMPLADO?")) {
        return;
    }

    const { data: json } = await http.post(`/assembleias/${assembleiaAnaliseId}/contemplar/${lanceId}`);
    feedbackAssembleia(
        json.sucesso ? "success" : "error",
        json.sucesso ? "Sucesso" : "Erro",
        json.mensagem || (json.sucesso ? "Lance contemplado." : "Erro ao contemplar.")
    );

    carregarAssembleias();
    analisar(assembleiaAnaliseId);
}

async function contemplarMaior() {
    if (!assembleiaAnaliseId) {
        return;
    }

    if (!confirm("Contemplar o maior lance desta rodada?")) {
        return;
    }

    const { data: json } = await http.post(
        `/assembleias/${assembleiaAnaliseId}/contemplar-maior-lance`
    );
    feedbackAssembleia(
        json.sucesso ? "success" : "error",
        json.sucesso ? "Sucesso" : "Erro",
        json.mensagem || (json.sucesso ? "Maior lance contemplado." : "Erro ao contemplar.")
    );

    carregarAssembleias();
    analisar(assembleiaAnaliseId);
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function esc(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
