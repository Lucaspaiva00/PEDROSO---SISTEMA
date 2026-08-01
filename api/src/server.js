require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET?.trim()) {
    console.error("JWT_SECRET não definido. Configure no .env ou nas variáveis do Render.");
    process.exit(1);
}

app.listen(PORT, () => {

    console.clear();

    console.log("========================================");
    console.log("🚀 GESTÃO DE CONSÓRCIOS");
    console.log("========================================");
    console.log(`Servidor iniciado na porta ${PORT}`);
    console.log("========================================");

});