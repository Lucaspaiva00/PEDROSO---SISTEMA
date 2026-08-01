
function mostrarFeedbackLances(elementoId, tipo, titulo, mensagem) {
    mostrarFeedback(elementoId, tipo, titulo, mensagem);
}

function ocultarFeedbackLances(elementoId) {
    ocultarFeedback(elementoId);
}

async function buscarLances(status = "REGISTRADO") {
    const path = status === "TODOS"
        ? "/lances?todos=true"
        : `/lances?status=${encodeURIComponent(status)}`;

    const { data } = await http.get(path);
    return data;
}

function formatarMoedaLance(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escLance(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function badgeStatusLance(status) {
    const mapa = {
        REGISTRADO: {
            classe: "badge badge-warning",
            icone: "fa-clock",
            texto: "Aguardando análise"
        },
        VENCEDOR: {
            classe: "badge badge-success",
            icone: "fa-check",
            texto: "Aprovado"
        },
        NAO_CONTEMPLADO: {
            classe: "badge badge-danger",
            icone: "fa-xmark",
            texto: "Reprovado"
        }
    };

    const item = mapa[status] || {
        classe: "badge badge-primary",
        icone: "fa-circle",
        texto: status
    };

    return `
        <span class="status-lance">
            <span class="${item.classe}">
                <i class="fa-solid ${item.icone}" aria-hidden="true"></i>
                <span>${escLance(item.texto)}</span>
            </span>
        </span>
    `;
}

function linhaEstadoTabela(colspan, conteudo) {
    return `
        <tr>
            <td colspan="${colspan}" class="table-state-cell">
                ${conteudo}
            </td>
        </tr>
    `;
}

function linhaCarregando(colspan) {
    return linhaEstadoTabela(
        colspan,
        `<span class="empty-inline"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>Carregando lances…</span>`
    );
}

function linhaVazia(colspan, pendente) {
    if (pendente) {
        return linhaEstadoTabela(
            colspan,
            `
                <div class="empty-inline">
                    <i class="fa-solid fa-inbox" aria-hidden="true"></i>
                    <strong>Nenhum lance aguardando análise</strong>
                    <p>Quando clientes enviarem lances, eles aparecerão aqui para aprovar ou reprovar.</p>
                </div>
            `
        );
    }

    return linhaEstadoTabela(
        colspan,
        `
            <div class="empty-inline">
                <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
                <strong>Nenhum lance encontrado</strong>
                <p>Altere o filtro ou aguarde novos envios dos clientes.</p>
            </div>
        `
    );
}

function renderizarLinhasLances(lances, { mostrarAcoes = true, compacto = false } = {}) {
    const cols = compacto ? 8 : 10;

    if (!lances?.length) {
        return null;
    }

    return lances.map(lance => {
        const contrato = lance.contrato || {};
        const assembleia = lance.assembleia || {};
        const dataLance = new Date(lance.criadoEm).toLocaleString("pt-BR");
        const dataAssembleia = assembleia.dataAssembleia
            ? new Date(assembleia.dataAssembleia).toLocaleDateString("pt-BR")
            : "-";

        const rotuloContrato = escLance(contrato.numeroContrato || `ID ${contrato.id}` || "-");

        const acoes = mostrarAcoes && lance.status === "REGISTRADO"
            ? `
                <button type="button" class="btn btn-sm btn-primary" data-aprovar-lance="${lance.id}" aria-label="Aprovar lance de ${rotuloContrato}">
                    Aprovar
                </button>
                <button type="button" class="btn btn-sm btn-danger" data-reprovar-lance="${lance.id}" aria-label="Reprovar lance de ${rotuloContrato}">
                    Reprovar
                </button>
            `
            : `<span class="sr-only">Sem ações</span>—`;

        if (compacto) {
            return `
                <tr>
                    <td>${rotuloContrato}</td>
                    <td>${escLance(contrato.cliente || "-")}</td>
                    <td>${escLance(contrato.grupo || "-")} / ${escLance(contrato.cota || "-")}</td>
                    <td>${escLance(contrato.plano || "-")}</td>
                    <td>${escLance(assembleia.titulo || `Grupo ${assembleia.grupo || "-"}`)}</td>
                    <td><strong>${formatarMoedaLance(lance.valor)}</strong></td>
                    <td>${badgeStatusLance(lance.status)}</td>
                    <td class="acoes-lance">${acoes}</td>
                </tr>
            `;
        }

        return `
            <tr>
                <td>${rotuloContrato}</td>
                <td>${escLance(contrato.cliente || "-")}</td>
                <td>${escLance(contrato.grupo || "-")} / ${escLance(contrato.cota || "-")}</td>
                <td>${escLance(contrato.plano || "-")}</td>
                <td>${escLance(assembleia.titulo || `Grupo ${assembleia.grupo || "-"}`)}</td>
                <td>${dataAssembleia}</td>
                <td><strong>${formatarMoedaLance(lance.valor)}</strong></td>
                <td>${dataLance}</td>
                <td>${badgeStatusLance(lance.status)}</td>
                <td class="acoes-lance">${acoes}</td>
            </tr>
        `;
    }).join("");
}

function vincularAcoesLances(container, aoAtualizar, feedbackId) {
    if (!container) {
        return;
    }

    container.querySelectorAll("[data-aprovar-lance]").forEach(botao => {
        botao.addEventListener("click", async () => {
            const id = botao.dataset.aprovarLance;

            if (!confirm("Aprovar este lance?\n\nO contrato será marcado como contemplado e a assembleia será encerrada.")) {
                return;
            }

            botao.disabled = true;

            try {
                const { data: json } = await http.post(`/lances/${id}/aprovar`);

                if (!json.sucesso) {
                    mostrarFeedbackLances(
                        feedbackId,
                        "error",
                        "Não foi possível aprovar",
                        json.mensagem || "Tente novamente ou atualize a página."
                    );
                    return;
                }

                mostrarFeedbackLances(
                    feedbackId,
                    "success",
                    "Lance aprovado",
                    "O contrato foi contemplado e os demais lances pendentes foram encerrados nesta assembleia."
                );
            } catch {
                mostrarFeedbackLances(
                    feedbackId,
                    "error",
                    "Falha de conexão",
                    "Não conseguimos concluir a aprovação. Verifique a rede e tente de novo."
                );
            } finally {
                botao.disabled = false;
                if (aoAtualizar) {
                    aoAtualizar();
                }
            }
        });
    });

    container.querySelectorAll("[data-reprovar-lance]").forEach(botao => {
        botao.addEventListener("click", async () => {
            const id = botao.dataset.reprovarLance;

            if (!confirm("Reprovar este lance?\n\nO cliente não será contemplado; a assembleia continua aberta para outros lances.")) {
                return;
            }

            botao.disabled = true;

            try {
                const { data: json } = await http.post(`/lances/${id}/reprovar`);

                if (!json.sucesso) {
                    mostrarFeedbackLances(
                        feedbackId,
                        "error",
                        "Não foi possível reprovar",
                        json.mensagem || "Tente novamente."
                    );
                    return;
                }

                mostrarFeedbackLances(
                    feedbackId,
                    "success",
                    "Lance reprovado",
                    "O status foi atualizado. O cliente pode acompanhar no portal."
                );
            } catch {
                mostrarFeedbackLances(
                    feedbackId,
                    "error",
                    "Falha de conexão",
                    "Não conseguimos concluir a reprovação. Tente novamente."
                );
            } finally {
                botao.disabled = false;
                if (aoAtualizar) {
                    aoAtualizar();
                }
            }
        });
    });
}

async function carregarTabelaLances(tbody, opcoes = {}) {
    const status = opcoes.status ?? "REGISTRADO";
    const cols = opcoes.compacto ? 8 : 10;
    const feedbackId = opcoes.feedbackId || "feedbackLancesAdmin";
    const pendente = status === "REGISTRADO";

    if (!tbody) {
        return;
    }

    tbody.innerHTML = linhaCarregando(cols);

    try {
        const json = await buscarLances(status);

        if (!json.sucesso) {
            tbody.innerHTML = linhaEstadoTabela(
                cols,
                `<span class="empty-inline"><strong>Erro ao carregar</strong><p>${escLance(json.mensagem || "Tente atualizar a página.")}</p></span>`
            );
            mostrarFeedbackLances(
                feedbackId,
                "error",
                "Erro ao carregar lances",
                json.mensagem || "Atualize a página ou tente mais tarde."
            );
            return;
        }

        const linhas = renderizarLinhasLances(json.lances, opcoes);

        if (!linhas) {
            tbody.innerHTML = linhaVazia(cols, pendente);
            return;
        }

        tbody.innerHTML = linhas;

        vincularAcoesLances(
            tbody.closest("table") || tbody,
            opcoes.aoAtualizar,
            feedbackId
        );
    } catch {
        tbody.innerHTML = linhaEstadoTabela(
            cols,
            `<span class="empty-inline"><strong>Falha de conexão</strong><p>Verifique a internet e clique em atualizar.</p></span>`
        );
        mostrarFeedbackLances(
            feedbackId,
            "error",
            "Sem conexão com o servidor",
            "Confira se a API está em execução e tente novamente."
        );
    }
}

function atualizarFiltrosLances(ativo) {
    const pendentes = document.getElementById("filtroPendentes");
    const todos = document.getElementById("filtroTodos");

    if (pendentes) {
        pendentes.setAttribute("aria-pressed", ativo === "REGISTRADO" ? "true" : "false");
    }

    if (todos) {
        todos.setAttribute("aria-pressed", ativo === "TODOS" ? "true" : "false");
    }
}
