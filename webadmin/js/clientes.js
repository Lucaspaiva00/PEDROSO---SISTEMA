/*==========================================================
PEDROSO CONSÓRCIOS
clientes.js
PARTE 1/3
==========================================================*/

const API = "http://localhost:3000";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

/*==========================================================
ELEMENTOS
==========================================================*/

const tbody = document.getElementById("tbodyClientes");

const pesquisa = document.getElementById("pesquisa");

const modal = document.getElementById("modalCliente");

const tituloModal = document.getElementById("tituloModal");

const form = document.getElementById("formCliente");

const btnNovo = document.getElementById("btnNovoCliente");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");
const btnFechar = document.querySelector(".btn-close");

/*==========================================================
CAMPOS
==========================================================*/

const nome = document.getElementById("nome");
const cpfCnpj = document.getElementById("cpfCnpj");
const rg = document.getElementById("rg");
const nascimento = document.getElementById("nascimento");

const email = document.getElementById("email");
const telefone = document.getElementById("telefone");

const cep = document.getElementById("cep");
const rua = document.getElementById("rua");
const numero = document.getElementById("numero");
const bairro = document.getElementById("bairro");
const cidade = document.getElementById("cidade");
const estado = document.getElementById("estado");

const observacoes = document.getElementById("observacoes");

/*==========================================================
VARIÁVEIS
==========================================================*/

let clienteEditando = null;

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
};

/*==========================================================
EVENTOS
==========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    listarClientes();

});

btnNovo.addEventListener("click", () => {

    abrirModal();

});

btnCancelar.addEventListener("click", fecharModal);

btnFechar.addEventListener("click", fecharModal);

pesquisa.addEventListener("keyup", filtrarClientes);

form.addEventListener("submit", (e) => {

    e.preventDefault();

    salvarCliente();

});

/*==========================================================
PEDROSO CONSÓRCIOS
clientes.js
PARTE 2/3
==========================================================*/

/*==========================================================
LISTAR CLIENTES
==========================================================*/

async function listarClientes() {

    try {

        const response = await fetch(`${API}/clientes`, {
            headers
        });

        const json = await response.json();

        if (!response.ok || !json.sucesso) {

            throw new Error(json.mensagem || "Erro ao listar clientes.");

        }

        renderizarTabela(json.clientes);

    } catch (error) {

        console.error(error);

        alert("Erro ao carregar clientes.");

    }

}

/*==========================================================
RENDERIZAR TABELA
==========================================================*/

function renderizarTabela(clientes) {

    tbody.innerHTML = "";

    if (!clientes.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="6" class="text-center">

                    Nenhum cliente encontrado.

                </td>

            </tr>

        `;

        return;

    }

    clientes.forEach(cliente => {

        tbody.innerHTML += `

            <tr>

                <td>${cliente.nome}</td>

                <td>${cliente.cpfCnpj}</td>

                <td>${cliente.telefone || "-"}</td>

                <td>${cliente.email || "-"}</td>

                <td>

                    <span class="badge ${cliente.status === "ATIVO"
                ? "badge-success"
                : "badge-danger"}">

                        ${cliente.status}

                    </span>

                </td>

                <td>

                    <div class="table-actions">

                        <button
                            class="btn btn-warning btn-icon"
                            onclick="editarCliente(${cliente.id})">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="btn btn-danger btn-icon"
                            onclick="excluirCliente(${cliente.id})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}

/*==========================================================
FILTRO
==========================================================*/

function filtrarClientes() {

    const texto = pesquisa.value.toLowerCase();

    document.querySelectorAll("#tbodyClientes tr").forEach(tr => {

        tr.style.display = tr.innerText
            .toLowerCase()
            .includes(texto)

            ? ""

            : "none";

    });

}

/*==========================================================
EDITAR
==========================================================*/

async function editarCliente(id) {

    try {

        const response = await fetch(`${API}/clientes/${id}`, {
            headers
        });

        const json = await response.json();

        if (!response.ok || !json.sucesso) {

            throw new Error(json.mensagem);

        }

        abrirModal(json.cliente);

    } catch (error) {

        console.error(error);

        alert("Erro ao carregar cliente.");

    }

}

/*==========================================================
EXCLUIR
==========================================================*/

async function excluirCliente(id) {

    if (!confirm("Deseja realmente excluir este cliente?")) {

        return;

    }

    try {

        const response = await fetch(`${API}/clientes/${id}`, {

            method: "DELETE",

            headers

        });

        const json = await response.json();

        if (!response.ok || !json.sucesso) {

            throw new Error(json.mensagem);

        }

        listarClientes();

    } catch (error) {

        console.error(error);

        alert("Erro ao excluir cliente.");

    }

}

/*==========================================================
PEDROSO CONSÓRCIOS
clientes.js
PARTE 3/3
==========================================================*/

/*==========================================================
ABRIR MODAL
==========================================================*/

function abrirModal(cliente = null) {

    clienteEditando = cliente;

    limparFormulario();

    if (cliente) {

        tituloModal.textContent = "Editar Cliente";

        nome.value = cliente.nome || "";
        cpfCnpj.value = cliente.cpfCnpj || "";
        rg.value = cliente.rg || "";

        nascimento.value = cliente.nascimento
            ? cliente.nascimento.substring(0, 10)
            : "";

        email.value = cliente.email || "";
        telefone.value = cliente.telefone || "";

        cep.value = cliente.cep || "";
        rua.value = cliente.rua || "";
        numero.value = cliente.numero || "";
        bairro.value = cliente.bairro || "";
        cidade.value = cliente.cidade || "";
        estado.value = cliente.estado || "";

        observacoes.value = cliente.observacoes || "";

    } else {

        tituloModal.textContent = "Novo Cliente";

    }

    modal.classList.add("show");

    document.body.style.overflow = "hidden";

}

/*==========================================================
FECHAR MODAL
==========================================================*/

function fecharModal() {

    modal.classList.remove("show");

    document.body.style.overflow = "auto";

    clienteEditando = null;

    limparFormulario();

}

/*==========================================================
LIMPAR FORMULÁRIO
==========================================================*/

function limparFormulario() {

    form.reset();

    observacoes.value = "";

}
async function salvarCliente() {

    const nascimentoFormatado = nascimento.value
        ? new Date(`${nascimento.value}T00:00:00`).toISOString()
        : null;

    const body = {
        nome: nome.value.trim(),
        cpfCnpj: cpfCnpj.value.trim(),
        rg: rg.value.trim() || null,

        nascimento: nascimentoFormatado,

        email: email.value.trim() || null,
        telefone: telefone.value.trim() || null,

        cep: cep.value.trim() || null,
        rua: rua.value.trim() || null,
        numero: numero.value.trim() || null,
        bairro: bairro.value.trim() || null,
        cidade: cidade.value.trim() || null,
        estado: estado.value.trim() || null,

        observacoes: observacoes.value.trim() || null
    };

    try {

        const response = await fetch(
            clienteEditando
                ? `${API}/clientes/${clienteEditando.id}`
                : `${API}/clientes`,
            {
                method: clienteEditando ? "PUT" : "POST",
                headers,
                body: JSON.stringify(body)
            }
        );

        const json = await response.json();

        if (!response.ok || !json.sucesso) {
            throw new Error(json.mensagem || "Erro ao salvar cliente.");
        }

        fecharModal();

        listarClientes();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}

/*==========================================================
FECHAR MODAL CLICANDO FORA
==========================================================*/

modal.addEventListener("click", (e) => {

    if (e.target === modal) {

        fecharModal();

    }

});