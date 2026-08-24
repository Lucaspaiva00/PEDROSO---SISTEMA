const usuario = JSON.parse(localStorage.getItem("usuario"));
const token = getToken();
if (!token || !usuario) logout();

document.addEventListener("DOMContentLoaded", () => { carregarDashboard(); configurarEventos(); atualizarSaudacao(); });

function configurarEventos() {
    irPara("btnContrato", "contrato.html");
    irPara("btnParcelas", "parcelas.html");
    irPara("btnLance", "lance.html");
    irPara("btnDocumentos", "documentos.html");
    irPara("btnPerfil", "perfil.html");
    irPara("btnPerfilAtalho", "perfil.html");
}
function irPara(id, url) { document.getElementById(id)?.addEventListener("click", () => location.href = url); }

async function carregarDashboard() {
    try {
        mostrarLoading();
        const { response, data } = await http.get("/portal/dashboard");
        if (response.status === 401) return;
        if (!data?.sucesso) throw new Error(data?.mensagem || "Não foi possível carregar o dashboard.");
        preencherDashboard(data.dados);
    } catch (erro) {
        mostrarFeedbackDashboard("error", "Erro ao carregar", erro.message || "Tente novamente em instantes.");
    } finally { esconderLoading(); }
}

function preencherDashboard(dados) {
    setText("nomeCliente", dados.nome || "-");
    const contratos = dados.contratos || [];
    const secao = document.getElementById("secaoMeusConsorcios");
    const container = document.getElementById("contratosDashboard");
    if (secao && container && contratos.length > 1) {
        secao.hidden = false;
        container.innerHTML = contratos.map(c => `
            <a class="consorcio-link" href="contrato.html?contratoId=${c.id}">
                <div><strong>${esc([c.planoNome || "Consórcio", c.grupo ? `Grupo ${c.grupo}` : null, c.cota ? `Cota ${c.cota}` : null].filter(Boolean).join(" • "))}</strong>
                <span>${formatarMoeda(c.valorCarta)} • ${esc(c.status || "—")}</span></div>
                <i class="fa-solid fa-chevron-right"></i>
            </a>`).join("");
    } else if (secao) secao.hidden = true;

    setText("valorCarta", formatarMoeda(dados.valorCarta));
    setText("totalPago", formatarMoeda(dados.totalPago));
    setText("saldoRestante", formatarMoeda(dados.saldoRestante));
    setText("valorParcela", formatarMoeda(dados.proximaParcela));
    setText("dataVencimento", dados.proximoVencimento ? `Vencimento: ${formatarData(dados.proximoVencimento)}` : "Nenhuma parcela pendente");
    setText("statusContrato", dados.status || "-");
    setText("textoStatus", mensagemStatus(dados.status));
    setText("grupo", dados.grupo || "-"); setText("cota", dados.cota || "-");
    setText("parcelasPagas", `${dados.parcelasPagas || 0} Pagas`);
    setText("parcelasRestantes", `${dados.parcelasRestantes || 0} Restantes`);
    atualizarProgresso(dados.percentual ?? calcularPercentual(dados.parcelasPagas, dados.parcelasTotais));

    const atraso = Number(dados.valorEmAtraso || 0);
    const cardAtraso = document.getElementById("cardAtraso");
    if (cardAtraso) cardAtraso.hidden = atraso <= 0;
    setText("parcelasAtrasadas", dados.parcelasAtrasadas || 0);
    setText("valorEmAtraso", formatarMoeda(atraso));

    if (dados.proximaAssembleia) {
        setText("dataAssembleia", formatarData(dados.proximaAssembleia.dataAssembleia));
        setText("textoAssembleia", `${dados.proximaAssembleia.titulo || "Assembleia"} • Grupo ${dados.proximaAssembleia.grupo}`);
    } else {
        setText("dataAssembleia", "—"); setText("textoAssembleia", "Nenhuma assembleia agendada.");
    }

    if (dados.ultimoLance) {
        setText("ultimoLance", formatarMoeda(dados.ultimoLance.valor));
        setText("statusUltimoLance", rotuloLance(dados.ultimoLance.status));
    } else {
        setText("ultimoLance", "—"); setText("statusUltimoLance", "Nenhum lance registrado.");
    }
}

function atualizarProgresso(percentual) { const p = Math.max(0, Math.min(100, Number(percentual || 0))); setText("percentualPlano", `${Math.round(p)}%`); const barra=document.getElementById("barraProgresso"); if(barra) barra.style.width=`${p}%`; }
function calcularPercentual(pagas,total){ return total>0 ? Math.round((pagas/total)*100):0; }
function rotuloLance(status){ return ({REGISTRADO:"Aguardando análise",VENCEDOR:"Contemplado",NAO_CONTEMPLADO:"Não contemplado"})[status] || status || "—"; }
function mensagemStatus(status){ return ({ATIVO:"Contrato em situação regular.",PAUSADO:"Contrato temporariamente pausado.",CONTEMPLADO:"Sua cota foi contemplada.",INADIMPLENTE:"Existem parcelas em atraso.",QUITADO:"Contrato totalmente quitado.",CANCELADO:"Contrato cancelado."})[status] || "Situação atual do contrato."; }
function formatarMoeda(v){ if(v==null) return "—"; return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
function formatarData(v){ return v ? new Date(v).toLocaleDateString("pt-BR") : "--/--/----"; }
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function esc(v){ return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function mostrarLoading(){ document.body.classList.add("is-loading"); }
function esconderLoading(){ document.body.classList.remove("is-loading"); }
function mostrarFeedbackDashboard(tipo,titulo,mensagem){ const el=document.getElementById("feedbackDashboard"); if(!el)return; el.hidden=false; el.className=`feedback-banner feedback-banner--${tipo} is-visible`; el.innerHTML=`<i class="fa-solid fa-circle-info"></i><div><strong>${esc(titulo)}</strong>${esc(mensagem)}</div>`; }
function atualizarSaudacao(){ const h=new Date().getHours(); const el=document.querySelector(".header-small"); if(el) el.textContent=h<12?"Bom dia 👋":h<18?"Boa tarde 👋":"Boa noite 👋"; }
