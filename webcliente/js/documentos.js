const usuarioDocumentos = JSON.parse(localStorage.getItem("usuario"));
if (!getToken() || !usuarioDocumentos) logout();
let contratosDocumentos = [];
let contratoDocumentoId = null;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnVoltar")?.addEventListener("click", () => location.href="dashboard.html");
    document.getElementById("selectContrato")?.addEventListener("change", e => { contratoDocumentoId=Number(e.target.value); carregarDocumentos(); });
    document.addEventListener("click", abrirDocumento);
    iniciarDocumentos();
});

async function iniciarDocumentos(){
    try{
        const {data}=await http.get("/portal/contratos");
        if(!data?.sucesso) throw new Error(data?.mensagem||"Erro ao listar contratos.");
        contratosDocumentos=data.dados||[];
        const select=document.getElementById("selectContrato");
        select.innerHTML=contratosDocumentos.map(c=>`<option value="${c.id}">${esc([c.planoNome||"Consórcio",c.grupo?`Grupo ${c.grupo}`:null,c.cota?`Cota ${c.cota}`:null].filter(Boolean).join(" • "))}</option>`).join("");
        contratoDocumentoId=contratosDocumentos[0]?.id||null;
        if(!contratoDocumentoId){ document.getElementById("listaDocumentos").innerHTML='<section class="card empty-state"><h3>Nenhum contrato encontrado</h3></section>'; return; }
        await carregarDocumentos();
    }catch(e){ mostrarErro(e.message); }
}

async function carregarDocumentos(){
    const lista=document.getElementById("listaDocumentos");
    lista.innerHTML='<section class="card card-loading"><i class="fa-solid fa-spinner fa-spin"></i> Carregando documentos…</section>';
    try{
        const {response,data}=await http.get(`/portal/documentos?contratoId=${contratoDocumentoId}`);
        if(!response.ok||!data?.sucesso) throw new Error(data?.mensagem||"Não foi possível carregar os documentos.");
        const docs=data.dados?.documentos||[];
        if(!docs.length){ lista.innerHTML='<section class="card empty-state"><i class="fa-solid fa-folder-open"></i><h3>Nenhum documento disponível</h3><p>Os documentos aparecerão aqui assim que forem disponibilizados.</p></section>'; return; }
        lista.innerHTML=docs.map((doc,i)=>`<section class="card document-item"><div class="document-icon"><i class="fa-solid fa-${esc(doc.icone||"file")}"></i></div><div class="document-info"><span>${esc(rotuloTipo(doc.tipo))}</span><strong>${esc(doc.titulo)}</strong><small>${esc(doc.descricao||"")}</small></div><button class="document-action" data-doc-index="${i}" aria-label="Abrir ${esc(doc.titulo)}"><i class="fa-solid fa-arrow-up-right-from-square"></i></button></section>`).join("");
        lista.dataset.docs=encodeURIComponent(JSON.stringify(docs));
    }catch(e){ mostrarErro(e.message); }
}

async function abrirDocumento(event){
    const botao=event.target.closest("[data-doc-index]"); if(!botao)return;
    const docs=JSON.parse(decodeURIComponent(document.getElementById("listaDocumentos").dataset.docs||"%5B%5D"));
    const doc=docs[Number(botao.dataset.docIndex)]; if(!doc)return;
    const janela=window.open("","_blank");
    try{
        let url=doc.url;
        if(doc.tipo==="BOLETO" && doc.parcelaId){ const {response,data}=await http.get(`/portal/parcelas/${doc.parcelaId}/boleto`); if(!response.ok||!data?.sucesso) throw new Error(data?.mensagem||"Boleto indisponível."); url=data.dados.url; }
        if(!url) throw new Error("Documento indisponível.");
        janela?janela.location.replace(url):window.open(url,"_blank","noopener,noreferrer");
    }catch(e){ janela?.close(); alert(e.message); }
}
function rotuloTipo(t){return ({CONTRATO:"Contrato",BOLETO:"Boleto",COMPROVANTE:"Comprovante"})[t]||"Documento";}
function mostrarErro(msg){ document.getElementById("listaDocumentos").innerHTML=`<section class="card empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Não foi possível carregar</h3><p>${esc(msg)}</p></section>`; }
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
