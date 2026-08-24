function garantirMenuInadimplencia() {
    const lista = document.querySelector("#sidebar ul");
    if (!lista || lista.querySelector('a[href="inadimplentes.html"]')) return;

    const item = document.createElement("li");
    if (location.pathname.endsWith("inadimplentes.html")) item.classList.add("active");
    item.innerHTML = '<a href="inadimplentes.html"><i class="fa-solid fa-triangle-exclamation"></i><span>Inadimplência</span></a>';

    const config = [...lista.querySelectorAll("li")].find(li => li.querySelector('a[href="configuracoes.html"]'));
    if (config) lista.insertBefore(item, config);
    else lista.appendChild(item);
}

function decorateStackedTables(root = document) {
    let tables = [];

    if (root instanceof HTMLTableElement && root.classList.contains("table-stack")) {
        tables = [root];
    } else if (root && typeof root.querySelectorAll === "function") {
        tables = [...root.querySelectorAll("table.table-stack")];
    }

    tables.forEach(table => {
        const headers = [...table.querySelectorAll("thead th")].map(th => th.textContent.trim());

        table.querySelectorAll("tbody tr").forEach(tr => {
            const cells = [...tr.querySelectorAll("td")];
            const stateCell = cells.find(td => td.colSpan > 1 || td.classList.contains("table-state-cell"));

            if (stateCell) {
                stateCell.removeAttribute("data-label");
                return;
            }

            cells.forEach((td, index) => {
                if (headers[index]) {
                    td.setAttribute("data-label", headers[index]);
                }
            });
        });
    });
}

window.decorateStackedTables = decorateStackedTables;

document.addEventListener("DOMContentLoaded", () => {
    garantirMenuInadimplencia();
    decorateStackedTables();

    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const btnMenu = document.getElementById("btnMenu");

    if (!sidebar || !btnMenu) {
        return;
    }

    const fechar = () => {
        sidebar.classList.remove("open");
        document.body.classList.remove("sidebar-open");

        if (backdrop) {
            backdrop.hidden = true;
        }

        btnMenu.setAttribute("aria-expanded", "false");
        btnMenu.setAttribute("aria-label", "Abrir menu");
    };

    const abrir = () => {
        sidebar.classList.add("open");
        document.body.classList.add("sidebar-open");

        if (backdrop) {
            backdrop.hidden = false;
        }

        btnMenu.setAttribute("aria-expanded", "true");
        btnMenu.setAttribute("aria-label", "Fechar menu");
    };

    btnMenu.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) {
            fechar();
        } else {
            abrir();
        }
    });

    backdrop?.addEventListener("click", fechar);

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.matchMedia("(max-width: 768px)").matches) {
                fechar();
            }
        });
    });

    window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 769px)").matches) {
            fechar();
        }
    });
});
