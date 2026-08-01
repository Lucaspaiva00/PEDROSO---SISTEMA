


const token = getToken();

/*==========================================================
ELEMENTOS
==========================================================*/

const btnSalvar = document.getElementById("btnSalvar");

/*==========================================================
EMPRESA
==========================================================*/

const nomeEmpresa = document.getElementById("nomeEmpresa");

const cnpj = document.getElementById("cnpj");

const telefone = document.getElementById("telefone");

const whatsapp = document.getElementById("whatsapp");

const email = document.getElementById("email");

const logo = document.getElementById("logo");

/*==========================================================
ENDEREÇO
==========================================================*/

const cep = document.getElementById("cep");

const rua = document.getElementById("rua");

const numero = document.getElementById("numero");

const bairro = document.getElementById("bairro");

const cidade = document.getElementById("cidade");

const estado = document.getElementById("estado");

/*==========================================================
USUÁRIO
==========================================================*/

const nomeUsuario = document.getElementById("nomeUsuario");

const emailUsuario = document.getElementById("emailUsuario");

const senhaAtual = document.getElementById("senhaAtual");

const novaSenha = document.getElementById("novaSenha");

const confirmarSenha = document.getElementById("confirmarSenha");

/*==========================================================
PREFERÊNCIAS
==========================================================*/

const gerarParcelas =
    document.getElementById("gerarParcelas");

const sincronizarCobrancas =
    document.getElementById("sincronizarCobrancas");

const administradoraPadrao =
    document.getElementById("administradoraPadrao");

const formaPagamentoPadrao =
    document.getElementById("formaPagamentoPadrao");

/*==========================================================
INIT
==========================================================*/

document.addEventListener("DOMContentLoaded", async () => {

    registrarEventos();

    await carregarConfiguracoes();

});

/*==========================================================
EVENTOS
==========================================================*/

function registrarEventos() {

    btnSalvar.addEventListener("click", salvarConfiguracoes);

    logo.addEventListener("change", selecionarLogo);

}

/*==========================================================
CARREGAR CONFIGURAÇÕES
==========================================================*/

async function carregarConfiguracoes() {

    try {

        const { response, data: json } = await http.get("/configuracoes");

        if (!json.sucesso) {

            return;

        }

        preencherFormulario(json.configuracao);

    }

    catch (erro) {

        console.error(erro);

    }

}

function preencherFormulario(config) {

    if (!config) return;

    nomeEmpresa.value = config.nomeEmpresa || "";
    cnpj.value = config.cnpj || "";
    telefone.value = config.telefone || "";
    whatsapp.value = config.whatsapp || "";
    email.value = config.email || "";

    cep.value = config.cep || "";
    rua.value = config.rua || "";
    numero.value = config.numero || "";
    bairro.value = config.bairro || "";
    cidade.value = config.cidade || "";
    estado.value = config.estado || "";

    nomeUsuario.value = config.nomeUsuario || "";
    emailUsuario.value = config.emailUsuario || "";

    gerarParcelas.checked = config.gerarParcelas ?? true;
    sincronizarCobrancas.checked = config.sincronizarCobrancas ?? true;

    administradoraPadrao.value =
        config.administradoraPadrao || "";

    formaPagamentoPadrao.value =
        config.formaPagamentoPadrao || "BOLETO";

}

function selecionarLogo() {

    const arquivo = logo.files[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {

        mostrarFeedback("feedbackConfig", "error", "Validação", "Selecione uma imagem válida.");

        logo.value = "";

        return;

    }

}

function validarSenhas() {

    if (
        novaSenha.value &&
        novaSenha.value !== confirmarSenha.value
    ) {

        mostrarFeedback("feedbackConfig", "error", "Validação", "As senhas não coincidem.");

        confirmarSenha.focus();

        return false;

    }

    return true;

}

function limparSenhas() {

    senhaAtual.value = "";

    novaSenha.value = "";

    confirmarSenha.value = "";

}

async function salvarConfiguracoes() {

    if (!validarSenhas()) {

        return;

    }

    const dados = {

        nomeEmpresa: nomeEmpresa.value.trim(),

        cnpj: cnpj.value.trim(),

        telefone: telefone.value.trim(),

        whatsapp: whatsapp.value.trim(),

        email: email.value.trim(),

        cep: cep.value.trim(),

        rua: rua.value.trim(),

        numero: numero.value.trim(),

        bairro: bairro.value.trim(),

        cidade: cidade.value.trim(),

        estado: estado.value.trim(),

        nomeUsuario: nomeUsuario.value.trim(),

        emailUsuario: emailUsuario.value.trim(),

        senhaAtual: senhaAtual.value,

        novaSenha: novaSenha.value,

        gerarParcelas: gerarParcelas.checked,

        sincronizarCobrancas: sincronizarCobrancas.checked,

        administradoraPadrao:
            administradoraPadrao.value.trim(),

        formaPagamentoPadrao:
            formaPagamentoPadrao.value

    };

    try {

        const { response, data: json } = await http.put("/configuracoes", dados);

        if (!json.sucesso) {

            throw new Error(json.mensagem);

        }

        limparSenhas();

        mostrarFeedback("feedbackConfig", "success", "Sucesso", json.mensagem);

    }

    catch (erro) {

        console.error(erro);

        mostrarFeedback("feedbackConfig", "error", "Erro", erro.message || "Erro ao salvar configurações.");

    }

}