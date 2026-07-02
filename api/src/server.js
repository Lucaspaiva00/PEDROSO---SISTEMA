require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.clear();

    console.log("========================================");
    console.log("🚀 GESTÃO DE CONSÓRCIOS");
    console.log("========================================");
    console.log(`Servidor iniciado na porta ${PORT}`);
    console.log("========================================");

});