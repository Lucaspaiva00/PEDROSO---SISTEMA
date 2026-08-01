function escFeedback(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function mostrarFeedback(elementoId, tipo, titulo, mensagem) {
    const el = document.getElementById(elementoId || "feedbackDashboard");

    if (!el) {
        return;
    }

    const classes = {
        success: "alert alert-success",
        error: "alert alert-danger",
        info: "alert alert-info"
    };

    el.className = classes[tipo] || classes.info;
    el.setAttribute("role", tipo === "error" ? "alert" : "status");
    el.setAttribute("aria-live", tipo === "error" ? "assertive" : "polite");
    el.hidden = false;
    el.innerHTML = `<strong>${escFeedback(titulo)}</strong> ${escFeedback(mensagem)}`;
    el.tabIndex = -1;
    el.focus({ preventScroll: true });
}

function ocultarFeedback(elementoId) {
    const el = document.getElementById(elementoId || "feedbackDashboard");

    if (el) {
        el.hidden = true;
        el.textContent = "";
    }
}
