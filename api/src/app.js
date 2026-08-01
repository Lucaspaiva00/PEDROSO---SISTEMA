const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const clienteRoutes = require("./routes/cliente.routes");
const planoRoutes = require("./routes/plano.routes");
const contratoRoutes = require("./routes/contrato.routes");
const portalRoutes = require("./routes/portal.routes");
const asaasRoutes = require("./routes/asaas.routes");
const assembleiaRoutes = require("./routes/assembleia.routes");
const lanceRoutes = require("./routes/lance.routes");
const configuracaoRoutes = require("./routes/configuracao.routes");

const app = express();

app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
});

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/clientes", clienteRoutes);
app.use("/planos", planoRoutes);
app.use("/contratos", contratoRoutes);
app.use("/portal", portalRoutes);
app.use("/asaas", asaasRoutes);
app.use("/assembleias", assembleiaRoutes);
app.use("/lances", lanceRoutes);
app.use("/configuracoes", configuracaoRoutes);

module.exports = app;