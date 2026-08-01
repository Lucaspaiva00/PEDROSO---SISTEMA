const router = require("express").Router();

const ConfiguracaoController = require("../controllers/configuracao.controller");

const auth = require("../middlewares/auth.middleware");

router.get("/", auth, ConfiguracaoController.obter);

router.put("/", auth, ConfiguracaoController.salvar);

module.exports = router;
