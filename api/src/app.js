const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const clienteRoutes = require("./routes/cliente.routes");
const planoRoutes = require("./routes/plano.routes");
const contratoRoutes = require("./routes/contrato.routes");
const portalRoutes = require("./routes/portal.routes");
const asaasRoutes = require("./routes/asaas.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/clientes", clienteRoutes);
app.use("/planos", planoRoutes);
app.use("/contratos", contratoRoutes);
app.use("/portal", portalRoutes);
app.use("/asaas", asaasRoutes);

module.exports = app;