verificarLogin();

let filtroStatus = "REGISTRADO";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filtroPendentes")?.addEventListener("click", () => {
        filtroStatus = "REGISTRADO";
        ocultarFeedbackLances("feedbackLancesAdmin");
        atualizarFiltrosLances("REGISTRADO");
        recarregar();
    });

    document.getElementById("filtroTodos")?.addEventListener("click", () => {
        filtroStatus = "TODOS";
        ocultarFeedbackLances("feedbackLancesAdmin");
        atualizarFiltrosLances("TODOS");
        recarregar();
    });

    atualizarFiltrosLances("REGISTRADO");
    recarregar();
});

function recarregar() {
    const tbody = document.getElementById("tbodyLances");

    if (!tbody) {
        return;
    }

    carregarTabelaLances(tbody, {
        status: filtroStatus,
        feedbackId: "feedbackLancesAdmin",
        aoAtualizar: recarregar
    });
}
