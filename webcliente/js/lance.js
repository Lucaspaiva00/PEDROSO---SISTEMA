const usuario = JSON.parse(localStorage.getItem("usuario"));
const token = getToken();

let contratos = [];
let contratoSelecionadoId = null;

if (!token || !usuario) {
    logout();
}

document.addEventListener("DOMContentLoaded", () => {
    configurarEventos();
    iniciar();
});

function configurarEventos() {
    document.getElementById("btnVoltar")?.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    document.getElementById("selectContrato")?.addEventListener("change", (evento) => {
        contratoSelecionadoId = Number(evento.target.value) || null;
        limparFeedback();
        carregarSituacao();
    });

    document.getElementById("btnConfirmarLance")?.addEventListener("click", confirmarLance);

    document.getElementById("inputValorLance")?.addEventListener("input", () => {
        const erro = document.getElementById("erroValorLance");
        if (erro) {
            erro.hidden = true;
            erro.textContent = "";
        }
    });
}

function limparFeedback() {
    const el = document.getElementById("feedbackLance");
    if (!el) {
        return;
    }
    el.className = "feedback-banner";
    el.innerHTML = "";
    el.hidden = true;
}

function mostrarFeedback(tipo, titulo, mensagem) {
    const el = document.getElementById("feedbackLance");
    if (!el) {
        return;
    }

    const icones = {
        success: "fa-circle-check",
        error: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    el.hidden = false;
    el.className = `feedback-banner feedback-banner--${tipo} is-visible`;
    el.innerHTML = `
        <i class="fa-solid ${icones[tipo] || icones.info}" aria-hidden="true"></i>
        <div>
            <strong>${escaparHtml(titulo)}</strong>
            <span>${escaparHtml(mensagem)}</span>
        </div>
    `;
    el.focus({ preventScroll: true });
}

function setLoading(ativo) {
    const loading = document.getElementById("cardLoading");
    const painel = document.getElementById("painelLance");

    if (loading) {
        loading.hidden = !ativo;
    }

    if (painel) {
        painel.hidden = ativo;
    }
}

function ocultarCardsLance() {
    ["cardRanking", "cardMeuLance", "cardFormLance", "cardBloqueio", "cardVazio"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.hidden = true;
        }
    });
}

async function iniciar() {
    const params = new URLSearchParams(window.location.search);
    const contratoParam = params.get("contratoId");

    setLoading(true);

    try {
        await carregarContratos();

        if (!contratos.length) {
            ocultarCardsLance();
            document.getElementById("cardAssembleia").hidden = true;
            document.getElementById("cardVazio").hidden = false;
            return;
        }

        if (contratoParam && contratos.some(c => c.id === Number(contratoParam))) {
            contratoSelecionadoId = Number(contratoParam);
        } else {
            contratoSelecionadoId = contratos[0].id;
        }

        const select = document.getElementById("selectContrato");
        if (select && contratoSelecionadoId) {
            select.value = String(contratoSelecionadoId);
        }

        await carregarSituacao();
    } catch (erro) {
        mostrarFeedback(
            "error",
            "Não foi possível carregar seus consórcios",
            erro.message || "Verifique sua conexão e tente atualizar a página."
        );
    } finally {
        setLoading(false);
    }
}

async function carregarContratos() {
    const { response: resposta, data: json } = await http.get("/portal/contratos");

    if (resposta.status === 401) {
        return;
    }

    if (!json.sucesso) {
        throw new Error(json.mensagem || "Erro ao listar contratos.");
    }

    contratos = json.dados || [];

    const select = document.getElementById("selectContrato");
    if (!select) {
        return;
    }

    if (!contratos.length) {
        select.innerHTML = `<option value="">Nenhum consórcio</option>`;
        select.disabled = true;
        return;
    }

    select.disabled = false;
    select.innerHTML = contratos.map(contrato => {
        const rotulo = [
            contrato.planoNome || "Consórcio",
            contrato.grupo ? `Grupo ${contrato.grupo}` : null,
            contrato.cota ? `Cota ${contrato.cota}` : null
        ].filter(Boolean).join(" • ");

        return `<option value="${contrato.id}">${escaparHtml(rotulo)}</option>`;
    }).join("");
}

async function carregarSituacao() {
    if (!contratoSelecionadoId) {
        return;
    }

    setLoading(true);
    limparFeedback();

    try {
        const { response: resposta, data: json } = await http.get(
            `/portal/lances/situacao?contratoId=${contratoSelecionadoId}`
        );

        if (resposta.status === 401) {
            return;
        }

        if (!json.sucesso) {
            mostrarFeedback(
                "error",
                "Não foi possível carregar a assembleia",
                json.mensagem || "Tente novamente em alguns instantes."
            );
            return;
        }

        renderizarSituacao(json.dados);
    } catch {
        mostrarFeedback(
            "error",
            "Falha de conexão",
            "Não conseguimos contactar o servidor. Verifique a internet e tente de novo."
        );
    } finally {
        setLoading(false);
    }
}

function renderizarSituacao(dados) {
    const textoAssembleia = document.getElementById("textoAssembleia");
    ocultarCardsLance();
    document.getElementById("cardAssembleia").hidden = false;

    if (dados.contrato.status === "CONTEMPLADO") {
        textoAssembleia.textContent = "Este contrato já foi contemplado.";
        document.getElementById("tituloBloqueio").textContent = "Consórcio contemplado";
        document.getElementById("textoBloqueio").textContent =
            "Não é possível dar novos lances em um contrato contemplado.";
        document.getElementById("cardBloqueio").hidden = false;
        return;
    }

    if (!dados.assembleia) {
        textoAssembleia.textContent = "Nenhuma assembleia aberta no momento.";
        document.getElementById("tituloBloqueio").textContent = "Assembleia fechada";
        document.getElementById("textoBloqueio").textContent =
            dados.motivoBloqueio ||
            "Aguarde a administradora abrir uma nova assembleia para o seu grupo.";
        document.getElementById("cardBloqueio").hidden = false;
        return;
    }

    const data = new Date(dados.assembleia.dataAssembleia);
    const titulo = dados.assembleia.titulo || "Assembleia do grupo";

    textoAssembleia.textContent =
        `${titulo} • Grupo ${dados.contrato.grupo} • ${data.toLocaleDateString("pt-BR")}`;

    document.getElementById("cardRanking").hidden = false;
    document.getElementById("totalLances").textContent = String(dados.ranking?.totalLances ?? 0);
    document.getElementById("maiorLance").textContent =
        dados.ranking?.maiorValor != null
            ? formatarMoeda(dados.ranking.maiorValor)
            : "Nenhum lance ainda";

    if (dados.meuLance) {
        document.getElementById("cardMeuLance").hidden = false;
        document.getElementById("valorMeuLance").textContent = formatarMoeda(dados.meuLance.valor);
        document.getElementById("posicaoMeuLance").textContent =
            `Você está em ${dados.meuLance.posicao}º lugar entre ${dados.ranking.totalLances} lance(s) nesta assembleia.`;

        const badge = document.getElementById("badgeStatusLance");
        const status = dados.meuLance.status;
        if (status === "VENCEDOR") {
            badge.className = "status-lance badge badge-success";
            badge.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i><span>Aprovado — contemplado</span>';
        } else if (status === "NAO_CONTEMPLADO") {
            badge.className = "status-lance badge badge-danger";
            badge.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i><span>Reprovado nesta assembleia</span>';
        } else {
            badge.className = "status-lance badge badge-warning";
            badge.innerHTML = '<i class="fa-solid fa-clock" aria-hidden="true"></i><span>Aguardando análise da administradora</span>';
        }
        return;
    }

    if (dados.podeDarLance) {
        document.getElementById("cardFormLance").hidden = false;
        document.getElementById("inputValorLance")?.focus();
        return;
    }

    document.getElementById("tituloBloqueio").textContent = "Lance não disponível";
    document.getElementById("textoBloqueio").textContent =
        dados.motivoBloqueio || "Este contrato não atende aos requisitos para lance no momento.";
    document.getElementById("cardBloqueio").hidden = false;
}

async function confirmarLance() {
    const input = document.getElementById("inputValorLance");
    const erroEl = document.getElementById("erroValorLance");
    const valor = Number(input?.value);

    if (!valor || valor <= 0) {
        if (erroEl) {
            erroEl.hidden = false;
            erroEl.textContent = "Informe um valor maior que zero em reais.";
        }
        input?.focus();
        return;
    }

    const confirmou = confirm(
        `Confirmar lance de ${formatarMoeda(valor)}?\n\nDepois de confirmar, não será possível alterar ou cancelar.`
    );

    if (!confirmou) {
        return;
    }

    const botao = document.getElementById("btnConfirmarLance");
    botao.disabled = true;
    limparFeedback();

    try {
        const { data: json } = await http.post("/portal/lances", {
            contratoId: contratoSelecionadoId,
            valor
        });

        if (!json.sucesso) {
            mostrarFeedback(
                "error",
                "Lance não registrado",
                json.mensagem || "Revise o valor e tente novamente."
            );
            return;
        }

        mostrarFeedback(
            "success",
            "Lance registrado",
            "Sua proposta foi enviada e aguarda análise. Você será informado quando houver decisão."
        );

        if (input) {
            input.value = "";
        }

        await carregarSituacao();
    } catch {
        mostrarFeedback(
            "error",
            "Falha ao enviar",
            "Não conseguimos registrar o lance. Verifique a conexão e tente novamente."
        );
    } finally {
        botao.disabled = false;
    }
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
