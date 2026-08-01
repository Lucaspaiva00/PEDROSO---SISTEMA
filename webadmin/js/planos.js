/*==========================================================
PEDROSO CONSÓRCIOS
PLANOS.JS
PARTE 1/3
==========================================================*/


verificarLogin();

const token = getToken();

/*==========================================================
ELEMENTOS
==========================================================*/

const tbody = document.getElementById("tbodyPlanos");

const pesquisa = document.getElementById("pesquisa");

const modal = document.getElementById("modalPlano");

const form = document.getElementById("formPlano");

const tituloModal = document.getElementById("tituloModal");

const btnNovo = document.getElementById("btnNovoPlano");

const btnSalvar = document.getElementById("btnSalvar");

const btnCancelar = document.getElementById("btnCancelar");

const btnClose = document.querySelector(".btn-close");

/*==========================================================
CONTROLE
==========================================================*/

let planos = [];

let planoEditando = null;

/*==========================================================
INIT
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    carregarPlanos();

    registrarEventos();

});

/*==========================================================
EVENTOS
==========================================================*/

function registrarEventos() {

    btnNovo.addEventListener("click", abrirNovoPlano);

    form.addEventListener("submit", salvarPlano);

    btnCancelar.addEventListener("click", fecharModal);

    btnClose.addEventListener("click", fecharModal);

    pesquisa.addEventListener("input", pesquisarPlano);

}

/*==========================================================
LISTAR PLANOS
==========================================================*/

async function carregarPlanos() {

    try {

        const { response, data: json } = await http.get("/planos");

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        planos = json.planos;

        renderizarTabela(planos);

    }

    catch (erro) {

        console.error(erro);

        mostrarFeedback("feedbackPlanos", "error", "Erro", "Erro ao carregar planos.");

    }

}

/*==========================================================
PESQUISA
==========================================================*/

function pesquisarPlano() {

    const texto = pesquisa.value
        .toLowerCase()
        .trim();

    const lista = planos.filter(plano => {

        return (

            plano.nome.toLowerCase().includes(texto)

            ||

            plano.tipo.toLowerCase().includes(texto)

        );

    });

    renderizarTabela(lista);

}
/*==========================================================
RENDERIZAR TABELA
==========================================================*/

function renderizarTabela(lista) {

    tbody.innerHTML = "";

    if (!lista.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7" class="text-center">

                    Nenhum plano encontrado.

                </td>

            </tr>

        `;

        return;

    }

    lista.forEach(plano => {

        tbody.innerHTML += `

            <tr>

                <td>

                    ${plano.nome}

                </td>

                <td>

                    ${plano.tipo}

                </td>

                <td>

                    ${formatarMoeda(plano.valorCarta)}

                </td>

                <td>

                    ${plano.quantidadeParcelas}

                </td>

                <td>

                    ${formatarMoeda(plano.valorParcela)}

                </td>

                <td>

                    <span class="badge ${plano.ativo ? "badge-success" : "badge-danger"}">

                        ${plano.ativo ? "Ativo" : "Inativo"}

                    </span>

                </td>

                <td>

                    <div class="table-actions">

                        <button
                            class="btn btn-warning btn-icon"
                            onclick="editarPlano(${plano.id})">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="btn btn-danger btn-icon"
                            onclick="excluirPlano(${plano.id})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}

/*==========================================================
NOVO PLANO
==========================================================*/

function abrirNovoPlano() {

    planoEditando = null;

    tituloModal.textContent = "Novo Plano";

    limparFormulario();

    modal.classList.add("show");

}

/*==========================================================
FECHAR MODAL
==========================================================*/

function fecharModal() {

    modal.classList.remove("show");

}

/*==========================================================
LIMPAR FORMULÁRIO
==========================================================*/

function limparFormulario() {

    form.reset();

    document.getElementById("ativo").checked = true;

}

/*==========================================================
EDITAR
==========================================================*/

function editarPlano(id) {

    const plano = planos.find(item => item.id === id);

    if (!plano) return;

    planoEditando = id;

    tituloModal.textContent = "Editar Plano";

    document.getElementById("nome").value = plano.nome;

    document.getElementById("tipo").value = plano.tipo;

    document.getElementById("descricao").value = plano.descricao || "";

    document.getElementById("valorCarta").value = plano.valorCarta;

    document.getElementById("quantidadeParcelas").value = plano.quantidadeParcelas;

    document.getElementById("valorParcela").value = plano.valorParcela;

    document.getElementById("imagemUrl").value = plano.imagemUrl || "";

    document.getElementById("ativo").checked = plano.ativo;

    modal.classList.add("show");

}

/*==========================================================
EXCLUIR
==========================================================*/

async function excluirPlano(id) {

    const confirmar = confirm("Deseja realmente excluir este plano?");

    if (!confirmar) return;

    try {

        const { response, data: json } = await http.delete(`/planos/${id}`);

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        carregarPlanos();

    }

    catch (erro) {

        console.error(erro);

        mostrarFeedback("feedbackPlanos", "error", "Erro", "Erro ao excluir plano.");

    }

}

/*==========================================================
FORMATAR MOEDA
==========================================================*/

function formatarMoeda(valor) {

    return Number(valor).toLocaleString("pt-BR", {

        style: "currency",

        currency: "BRL"

    });

}

/*==========================================================
SALVAR
==========================================================*/

async function salvarPlano(event) {

    event.preventDefault();

    const dados = {

        nome: document.getElementById("nome").value.trim(),

        tipo: document.getElementById("tipo").value,

        descricao: document.getElementById("descricao").value.trim(),

        valorCarta: Number(document.getElementById("valorCarta").value),

        quantidadeParcelas: Number(document.getElementById("quantidadeParcelas").value),

        valorParcela: Number(document.getElementById("valorParcela").value),

        imagemUrl: document.getElementById("imagemUrl").value.trim() || null,

        ativo: document.getElementById("ativo").checked

    };

    /*==========================================
    VALIDAÇÕES
    ==========================================*/

    if (!dados.nome) {

        mostrarFeedback("feedbackPlanos", "error", "Validação", "Informe o nome do plano.");
        return;

    }

    if (!dados.tipo) {

        mostrarFeedback("feedbackPlanos", "error", "Validação", "Selecione o tipo do consórcio.");
        return;

    }

    if (dados.valorCarta <= 0) {

        mostrarFeedback("feedbackPlanos", "error", "Validação", "Informe o valor da carta.");
        return;

    }

    if (dados.quantidadeParcelas <= 0) {

        mostrarFeedback("feedbackPlanos", "error", "Validação", "Informe a quantidade de parcelas.");
        return;

    }

    if (dados.valorParcela <= 0) {

        mostrarFeedback("feedbackPlanos", "error", "Validação", "Informe o valor da parcela.");
        return;

    }

    try {

        const resultado = planoEditando
            ? await http.put(`/planos/${planoEditando}`, dados)
            : await http.post("/planos", dados);

        const { response, data: json } = resultado;

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        mostrarFeedback("feedbackPlanos", "success", "Sucesso", json.mensagem || "Plano salvo.");

        fecharModal();

        limparFormulario();

        planoEditando = null;

        carregarPlanos();

    }

    catch (erro) {

        console.error(erro);

        mostrarFeedback("feedbackPlanos", "error", "Erro", erro.message || "Erro ao salvar plano.");

    }

}

/*==========================================================
FECHAR MODAL AO CLICAR FORA
==========================================================*/

window.addEventListener("click", (event) => {

    if (event.target === modal) {

        fecharModal();

    }

});

/*==========================================================
ESC FECHA MODAL
==========================================================*/

window.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        fecharModal();

    }

});