/*==========================================================
PEDROSO CONSÓRCIOS
CONTRATOS.JS
PARTE 1/3
==========================================================*/

const API = "http://localhost:3000";

const token = localStorage.getItem("token");

/*==========================================================
ELEMENTOS
==========================================================*/

const tbody = document.getElementById("tbodyContratos");

const pesquisa = document.getElementById("pesquisa");

const modal = document.getElementById("modalContrato");

const form = document.getElementById("formContrato");

const tituloModal = document.getElementById("tituloModal");

const btnNovo = document.getElementById("btnNovoContrato");

const btnCancelar = document.getElementById("btnCancelar");

const btnClose = document.querySelector(".btn-close");

/*==========================================================
CAMPOS
==========================================================*/

const clienteId = document.getElementById("clienteId");

const planoId = document.getElementById("planoId");

const administradora = document.getElementById("administradora");

const numeroContrato = document.getElementById("numeroContrato");

const grupo = document.getElementById("grupo");

const cota = document.getElementById("cota");

const tipo = document.getElementById("tipo");

const valorCarta = document.getElementById("valorCarta");

const valorEntrada = document.getElementById("valorEntrada");

const valorParcela = document.getElementById("valorParcela");

const quantidadeParcelas = document.getElementById("quantidadeParcelas");

const parcelasPagas = document.getElementById("parcelasPagas");

const primeiroVencimento = document.getElementById("primeiroVencimento");

const diaVencimento = document.getElementById("diaVencimento");

const asaasBillingType = document.getElementById("asaasBillingType");

const sincronizarAsaas = document.getElementById("sincronizarAsaas");

const observacoes = document.getElementById("observacoes");

/*==========================================================
CONTROLE
==========================================================*/

let contratos = [];

let clientes = [];

let planos = [];

let contratoEditando = null;

/*==========================================================
INIT
==========================================================*/

document.addEventListener("DOMContentLoaded", async () => {

    registrarEventos();

    await Promise.all([

        carregarClientes(),

        carregarPlanos()

    ]);

    await carregarContratos();

});

/*==========================================================
EVENTOS
==========================================================*/

function registrarEventos() {

    btnNovo.addEventListener("click", abrirNovoContrato);

    btnCancelar.addEventListener("click", fecharModal);

    btnClose.addEventListener("click", fecharModal);

    form.addEventListener("submit", salvarContrato);

    pesquisa.addEventListener("input", pesquisarContratos);

    planoId.addEventListener("change", selecionarPlano);

}

/*==========================================================
CARREGAR CONTRATOS
==========================================================*/

async function carregarContratos() {

    try {

        const response = await fetch(`${API}/contratos`, {

            headers: {

                Authorization: `Bearer ${token}`

            }

        });

        const json = await response.json();

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        contratos = json.contratos;

        renderizarTabela(contratos);

    }

    catch (erro) {

        console.error(erro);

        alert("Erro ao carregar contratos.");

    }

}

/*==========================================================
CARREGAR CLIENTES
==========================================================*/

async function carregarClientes() {

    try {

        const response = await fetch(`${API}/clientes`, {

            headers: {

                Authorization: `Bearer ${token}`

            }

        });

        const json = await response.json();

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        clientes = json.clientes;

        clienteId.innerHTML = `

            <option value="">

                Selecione um cliente

            </option>

        `;

        clientes.forEach(cliente => {

            clienteId.innerHTML += `

                <option value="${cliente.id}">

                    ${cliente.nome}

                </option>

            `;

        });

    }

    catch (erro) {

        console.error(erro);

    }

}

/*==========================================================
CARREGAR PLANOS
==========================================================*/

async function carregarPlanos() {

    try {

        const response = await fetch(`${API}/planos`, {

            headers: {

                Authorization: `Bearer ${token}`

            }

        });

        const json = await response.json();

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        planos = json.planos;

        planoId.innerHTML = `

            <option value="">

                Selecione um plano

            </option>

        `;

        planos.forEach(plano => {

            planoId.innerHTML += `

                <option value="${plano.id}">

                    ${plano.nome}

                </option>

            `;

        });

    }

    catch (erro) {

        console.error(erro);

    }

}

/*==========================================================
PESQUISAR
==========================================================*/

function pesquisarContratos() {

    const texto = pesquisa.value
        .toLowerCase()
        .trim();

    const filtrados = contratos.filter(contrato => {

        return (

            (contrato.numeroContrato || "")
                .toLowerCase()
                .includes(texto)

            ||

            (contrato.cliente?.nome || "")
                .toLowerCase()
                .includes(texto)

            ||

            (contrato.administradora || "")
                .toLowerCase()
                .includes(texto)

            ||

            (contrato.grupo || "")
                .toLowerCase()
                .includes(texto)

            ||

            (contrato.cota || "")
                .toLowerCase()
                .includes(texto)

            ||

            (contrato.plano?.nome || "")
                .toLowerCase()
                .includes(texto)

        );

    });

    renderizarTabela(filtrados);

}
/*==========================================================
RENDERIZAR TABELA
==========================================================*/

function renderizarTabela(lista) {

    tbody.innerHTML = "";

    if (!lista.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="8" class="text-center">

                    Nenhum contrato encontrado.

                </td>

            </tr>

        `;

        return;

    }

    lista.forEach(contrato => {

        tbody.innerHTML += `

            <tr>

                <td>

                    ${contrato.numeroContrato || "-"}

                </td>

                <td>

                    ${contrato.cliente?.nome || "-"}

                </td>

                <td>

                    ${contrato.administradora || "-"}

                </td>

                <td>

                    ${contrato.grupo || "-"} / ${contrato.cota || "-"}

                </td>

                <td>

                    ${contrato.plano?.nome || "-"}

                </td>

                <td>

                    ${formatarMoeda(contrato.valorCarta)}

                </td>

                <td>

                    <span class="badge ${contrato.status === "ATIVO"
                ? "badge-success"
                : "badge-danger"}">

                        ${contrato.status}

                    </span>

                </td>

                <td>

                    <div class="table-actions">

                        <button
                            class="btn btn-warning btn-icon"
                            onclick="editarContrato(${contrato.id})">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="btn btn-danger btn-icon"
                            onclick="excluirContrato(${contrato.id})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}

/*==========================================================
NOVO CONTRATO
==========================================================*/

function abrirNovoContrato() {

    contratoEditando = null;

    tituloModal.textContent = "Novo Contrato";

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

    tipo.value = "";

    valorCarta.value = "";

    valorParcela.value = "";

    quantidadeParcelas.value = "";

    parcelasPagas.value = 0;

    sincronizarAsaas.checked = true;

    asaasBillingType.value = "BOLETO";

}

/*==========================================================
SELECIONAR PLANO
==========================================================*/

function selecionarPlano() {

    const plano = planos.find(p => p.id == planoId.value);

    if (!plano) {

        tipo.value = "";

        valorCarta.value = "";

        valorParcela.value = "";

        quantidadeParcelas.value = "";

        return;

    }

    tipo.value = plano.tipo;

    valorCarta.value = plano.valorCarta;

    valorParcela.value = plano.valorParcela;

    quantidadeParcelas.value = plano.quantidadeParcelas;

}

/*==========================================================
EDITAR CONTRATO
==========================================================*/

function editarContrato(id) {

    const contrato = contratos.find(c => c.id === id);

    if (!contrato) return;

    contratoEditando = contrato.id;

    tituloModal.textContent = "Editar Contrato";

    clienteId.value = contrato.clienteId;

    planoId.value = contrato.planoId || "";

    selecionarPlano();

    administradora.value = contrato.administradora || "";

    numeroContrato.value = contrato.numeroContrato || "";

    grupo.value = contrato.grupo || "";

    cota.value = contrato.cota || "";

    valorEntrada.value = contrato.valorEntrada || "";

    parcelasPagas.value = contrato.parcelasPagas;

    primeiroVencimento.value = contrato.primeiroVencimento
        ? contrato.primeiroVencimento.substring(0, 10)
        : "";

    diaVencimento.value = contrato.diaVencimento;

    asaasBillingType.value = contrato.asaasBillingType;

    sincronizarAsaas.checked = contrato.sincronizarAsaas;

    observacoes.value = contrato.observacoes || "";

    modal.classList.add("show");

}

/*==========================================================
EXCLUIR
==========================================================*/

async function excluirContrato(id) {

    if (!confirm("Deseja excluir este contrato?")) {

        return;

    }

    try {

        const response = await fetch(`${API}/contratos/${id}`, {

            method: "DELETE",

            headers: {

                Authorization: `Bearer ${token}`

            }

        });

        const json = await response.json();

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        carregarContratos();

    }

    catch (erro) {

        console.error(erro);

        alert(erro.message);

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
SALVAR CONTRATO
==========================================================*/

async function salvarContrato(event) {

    event.preventDefault();

    const dados = {

        clienteId: Number(clienteId.value),

        planoId: planoId.value
            ? Number(planoId.value)
            : null,

        numeroContrato: numeroContrato.value.trim(),

        administradora: administradora.value.trim(),

        grupo: grupo.value.trim(),

        cota: cota.value.trim(),

        tipo: tipo.value,

        valorCarta: Number(valorCarta.value),

        valorEntrada:

            valorEntrada.value
                ? Number(valorEntrada.value)
                : null,

        valorParcela: Number(valorParcela.value),

        quantidadeParcelas:

            Number(quantidadeParcelas.value),

        parcelasPagas:

            Number(parcelasPagas.value),

        primeiroVencimento: new Date(primeiroVencimento.value),

        diaVencimento:

            Number(diaVencimento.value),

        observacoes:

            observacoes.value.trim(),

        asaasBillingType:

            asaasBillingType.value,

        sincronizarAsaas:

            sincronizarAsaas.checked

    };

    /*==========================================
    VALIDAÇÕES
    ==========================================*/

    if (!dados.clienteId) {

        return alert("Selecione um cliente.");

    }

    if (!dados.planoId) {

        return alert("Selecione um plano.");

    }

    if (!dados.administradora) {

        return alert("Informe a administradora.");

    }

    if (!dados.grupo) {

        return alert("Informe o grupo.");

    }

    if (!dados.cota) {

        return alert("Informe a cota.");

    }

    if (!dados.primeiroVencimento) {

        return alert("Informe o primeiro vencimento.");

    }

    if (!dados.diaVencimento) {

        return alert("Informe o dia do vencimento.");

    }

    try {

        let metodo = "POST";

        let url = `${API}/contratos`;

        if (contratoEditando) {

            metodo = "PUT";

            url = `${API}/contratos/${contratoEditando}`;

        }

        const response = await fetch(url, {

            method: metodo,

            headers: {

                Authorization: `Bearer ${token}`,

                "Content-Type": "application/json"

            },

            body: JSON.stringify(dados)

        });

        const json = await response.json();

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        alert(json.mensagem);

        contratoEditando = null;

        fecharModal();

        limparFormulario();

        carregarContratos();

    }

    catch (erro) {

        console.error(erro);

        alert(erro.message || "Erro ao salvar contrato.");

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